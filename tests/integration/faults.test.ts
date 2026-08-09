import { afterEach, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { closeSync, ftruncateSync, mkdtempSync, openSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { recordChild } from '../../src/capture/child-process-wrapper.js';
import { JournalWriter } from '../../src/capture/journal-writer.js';
import { readJournal } from '../../src/normalize/pipeline.js';
import { DEFAULTS, JOURNAL_SCHEMA, type JournalRecord } from '../../src/schema/journal-v1.js';
import { writeUsageEvent } from '../../src/usage/local-usage-log.js';

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const temp = (prefix: string) => { const dir = mkdtempSync(join(tmpdir(), prefix)); dirs.push(dir); return dir; };
const sink = (delay = false) => { const chunks: Buffer[] = []; let drains = 0; const stream = new Writable({ highWaterMark: 1, write(chunk, _encoding, done) { chunks.push(Buffer.from(chunk)); if (delay) setImmediate(done); else done(); } }); stream.on('drain', () => drains++); return { stream, bytes: () => Buffer.concat(chunks), drains: () => drains }; };

describe('capture fault handling', () => {
  it('keeps forwarding after the bounded journal is exhausted and exits 74', async () => {
    const dir = temp('cw-limit-');
    const frames = Array.from({ length: 80 }, (_, id) => `{"jsonrpc":"2.0","id":${id},"method":"tools/call","params":{"name":"bounded.lookup"}}\n`).join('');
    const output = sink();
    const result = await recordChild({ command: process.execPath, args: ['-e', 'process.stdin.pipe(process.stdout)'], out: join(dir, 'run.jsonl'), maxJournalBytes: 12_000, input: Readable.from([frames]), output: output.stream, errorOutput: sink().stream, quiet: true });
    const journal = readFileSync(result.journalPath, 'utf8');
    expect(output.bytes().toString()).toBe(frames);
    expect(result.exitCode).toBe(74);
    expect(result.captureComplete).toBe(false);
    expect(journal).toContain('"kind":"capture_truncated"');
    expect(journal).toContain('"kind":"run_end"');
  });

  it('propagates a forced ENOSPC write and still closes the journal', () => {
    const dir = temp('cw-enospc-');
    const error = Object.assign(new Error('simulated storage exhaustion'), { code: 'ENOSPC' });
    const writer = new JournalWriter(join(dir, 'run.jsonl'), 8192, () => { throw error; });
    const record = { schema: JOURNAL_SCHEMA, run_id: 'fault', seq: 0, kind: 'run_start', ts_wall: '2026-08-10T00:00:00.000Z', ts_mono_ns: '0' } as JournalRecord;
    expect(() => writer.append(record)).toThrow(error);
    expect(() => writer.close()).not.toThrow();
  });

  it('honors output backpressure without changing bytes', async () => {
    const dir = temp('cw-backpressure-');
    const frames = Array.from({ length: 200 }, (_, id) => `{"jsonrpc":"2.0","id":${id},"result":{"ok":true}}\n`).join('');
    const output = sink(true);
    const result = await recordChild({ command: process.execPath, args: ['-e', 'process.stdin.pipe(process.stdout)'], out: join(dir, 'run.jsonl'), input: Readable.from([frames]), output: output.stream, errorOutput: sink().stream, quiet: true });
    expect(result.exitCode).toBe(0);
    expect(output.bytes().toString()).toBe(frames);
    expect(output.drains()).toBeGreaterThan(0);
  });

  it('removes process signal listeners after the child exits', async () => {
    const dir = temp('cw-listeners-'); const beforeInt = process.listenerCount('SIGINT'); const beforeTerm = process.listenerCount('SIGTERM');
    const result = await recordChild({ command: process.execPath, args: ['-e', 'process.exit(0)'], out: join(dir, 'run.jsonl'), input: Readable.from([]), output: sink().stream, errorOutput: sink().stream, quiet: true });
    expect(result.exitCode).toBe(0);
    expect(process.listenerCount('SIGINT')).toBe(beforeInt);
    expect(process.listenerCount('SIGTERM')).toBe(beforeTerm);
  });

  it.skipIf(process.platform === 'win32')('forwards SIGTERM and removes process signal listeners', async () => {
    const dir = temp('cw-signal-');
    const child = 'process.on("SIGTERM",()=>process.exit(42));process.stderr.write("CHILD_READY\\n");setInterval(()=>{},1000)';
    const cli = spawn(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), 'src/cli.ts', 'record', '--out', join(dir, 'signal.jsonl'), '--', process.execPath, '-e', child], { stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise<void>((resolveReady, reject) => { let stderr = ''; const timer = setTimeout(() => reject(new Error(`record did not start: ${stderr}`)), 5000); cli.stderr.on('data', (chunk) => { stderr += chunk.toString(); if (stderr.includes('CHILD_READY')) { clearTimeout(timer); resolveReady(); } }); cli.once('error', reject); });
    cli.kill('SIGTERM');
    const exit = await new Promise<number | null>((resolveExit) => cli.once('close', resolveExit));
    expect(exit).toBe(42);
    expect(readFileSync(join(dir, 'signal.jsonl'), 'utf8')).toContain('"exit_code":42');
  });
});

describe('bounded input and safe local paths', () => {
  it('rejects a journal larger than the read bound before allocation', async () => {
    const dir = temp('cw-read-bound-'); const path = join(dir, 'oversized.jsonl'); const fd = openSync(path, 'w'); ftruncateSync(fd, DEFAULTS.maxJournalBytes + 1); closeSync(fd);
    const consume = async () => { for await (const record of readJournal(path)) { void record; } };
    await expect(consume()).rejects.toThrow('byte read limit');
  });

  it.skipIf(process.platform === 'win32')('refuses a symlink usage log without changing its target', () => {
    const dir = temp('cw-usage-link-'); const target = join(dir, 'target.txt'); const link = join(dir, 'usage.jsonl'); writeFileSync(target, 'keep'); symlinkSync(target, link);
    expect(() => writeUsageEvent(link, 'demo_completed', { success: true })).toThrow('Refusing symlink');
    expect(readFileSync(target, 'utf8')).toBe('keep');
  });
});
