import { randomBytes } from 'node:crypto';
import { basename, join } from 'node:path';
import { spawn } from 'node:child_process';
import { constants as osConstants } from 'node:os';
import { FrameDecoder } from './frame-decoder.js';
import { inspectFrame } from './content-policy.js';
import { JournalWriter } from './journal-writer.js';
import { LiveCorrelator } from './correlator.js';
import { DEFAULTS, JOURNAL_SCHEMA, protocolInfo, type JournalRecord } from '../schema/journal-v1.js';

export interface RecordChildOptions {
  command: string;
  args?: string[];
  out?: string;
  content?: 'off' | 'full';
  protocolVersion?: string;
  requestTimeoutMs?: number;
  maxFrameBytes?: number;
  maxJournalBytes?: number;
  quiet?: boolean;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  errorOutput?: NodeJS.WritableStream;
}
export interface RecordResult { journalPath: string; exitCode: number; signal: NodeJS.Signals | null; frameCount: number; exchangeCount: number; captureComplete: boolean; durationMs: number }

const defaultPath = () => join('.causalwire', 'runs', `${new Date().toISOString().replace(/[-:]/g, '')}-${randomBytes(4).toString('hex')}.jsonl`);

export async function recordChild(options: RecordChildOptions): Promise<RecordResult> {
  const content = options.content ?? DEFAULTS.content;
  const out = options.out ?? defaultPath();
  const startMono = process.hrtime.bigint();
  const runId = `cw_${randomBytes(8).toString('hex')}`; const salt = randomBytes(16);
  let seq = 0; let frames = 0; let exchanges = 0; let captureComplete = true; let dropped = 0; let captureDisabled = false; let captureFailureClass: string | undefined;
  const proto = protocolInfo(options.protocolVersion ?? 'unknown', options.protocolVersion ? 'cli' : 'unknown');
  const record = (kind: string, body: Record<string, unknown> = {}): JournalRecord => ({ schema: JOURNAL_SCHEMA, run_id: runId, seq: seq++, kind, ts_wall: new Date().toISOString(), ts_mono_ns: (process.hrtime.bigint() - startMono).toString(), ...body });
  let writer: JournalWriter;
  try {
    writer = new JournalWriter(out, options.maxJournalBytes ?? DEFAULTS.maxJournalBytes);
    writer.append(record('run_start', { content_policy: content, recorder_version: '0.1.0', platform: process.platform, node_version: process.versions.node, protocol: proto, command: { executable_basename: basename(options.command) } }), 4096);
  } catch (error: any) {
    throw Object.assign(new Error(`Unable to create journal (${String(error?.code ?? 'write_error')})`), { exitCode: 74, cause: error });
  }
  const correlator = new LiveCorrelator();
  const decoders = { client_to_server: new FrameDecoder(options.maxFrameBytes ?? DEFAULTS.maxFrameBytes), server_to_client: new FrameDecoder(options.maxFrameBytes ?? DEFAULTS.maxFrameBytes) };
  const capture = (direction: keyof typeof decoders, chunk: Buffer, end = false) => {
    if (captureDisabled) return;
    const decoded = end ? decoders[direction].end() : decoders[direction].push(chunk);
    for (const item of decoded) {
      try {
        const meta = inspectFrame(item.bytes, content, salt, proto, item.parseStatus === 'oversized' ? { bytes: item.totalBytes, sha256: item.sha256 } : undefined);
        const wire = record('wire', { direction, ...meta }); writer.append(wire, 4096); frames++;
        if (meta.frame.parse_status !== 'ok') writer.append(record('capture_diagnostic', { code: 'D001', severity: 'error', at_seq: wire.seq, message_key: String(meta.frame.parse_status) }), 4096);
        const matched = correlator.accept(wire);
        if (matched) {
          const reqRpc = matched.request.rpc as Record<string, any>; const resRpc = matched.response.rpc as Record<string, any>;
          const durationMs = Number(BigInt(matched.response.ts_mono_ns) - BigInt(matched.request.ts_mono_ns)) / 1e6;
          writer.append(record('exchange', { request_seq: matched.request.seq, response_seq: matched.response.seq, id_hash: reqRpc.id_hash, method: reqRpc.method, tool_name: reqRpc.tool_name, status: resRpc.status, duration_ms: durationMs, request_bytes: matched.request.frame.bytes, response_bytes: matched.response.frame.bytes, request_sha256: matched.request.frame.sha256, response_sha256: matched.response.frame.sha256 }), 4096); exchanges++;
        }
      } catch (error: any) {
        captureComplete = false; dropped++; captureDisabled = true;
        captureFailureClass = String(error?.code ?? 'capture_write_error');
        try { writer.append(record('capture_truncated', { code: 'D009', severity: 'error', at_seq: seq, reason: captureFailureClass }), 2048); } catch { /* physical storage exhaustion may prevent the final marker */ }
      }
    }
  };

  return await new Promise<RecordResult>((resolve) => {
    let child;
    try { child = spawn(options.command, options.args ?? [], { shell: false, stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch { try { writer.append(record('run_end', { exit_code: null, signal: null, capture_complete: false, dropped_record_count: 0, duration_ms: 0, counts: { frames: 0, exchanges: 0 }, spawn_error_class: 'spawn_error' })); } finally { writer.close(); } resolve({ journalPath: out, exitCode: 74, signal: null, frameCount: 0, exchangeCount: 0, captureComplete: false, durationMs: 0 }); return; }
    const input = options.input ?? process.stdin; const output = options.output ?? process.stdout; const errorOutput = options.errorOutput ?? process.stderr;
    let settled = false; let signalCount = 0;
    const onInputData = (raw: Buffer | string) => { const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw); if (!child.stdin.write(chunk)) (input as any).pause?.(); capture('client_to_server', chunk); };
    const onInputEnd = () => { child.stdin.end(); capture('client_to_server', Buffer.alloc(0), true); };
    const onInputDrain = () => (input as any).resume?.();
    const onChildOutput = (raw: Buffer) => { const ready = output.write(raw); capture('server_to_client', raw); if (!ready) child.stdout.pause(); };
    const onOutputDrain = () => child.stdout.resume();
    const onChildOutputEnd = () => capture('server_to_client', Buffer.alloc(0), true);
    const onStdinError = (error: NodeJS.ErrnoException) => { if (error.code !== 'EPIPE') { captureComplete = false; captureFailureClass ??= String(error.code ?? 'child_stdin_error'); } };
    const forward = (signal: NodeJS.Signals) => { signalCount++; if (signalCount === 1) child.kill(signal); else process.exit(128 + (osConstants.signals[signal] ?? 1)); };
    const onSigint = () => forward('SIGINT'); const onSigterm = () => forward('SIGTERM');
    const cleanup = () => {
      input.off('data', onInputData); input.off('end', onInputEnd); child.stdin.off('drain', onInputDrain); child.stdin.off('error', onStdinError);
      child.stdout.off('data', onChildOutput); child.stdout.off('end', onChildOutputEnd); output.off('drain', onOutputDrain);
      process.off('SIGINT', onSigint); process.off('SIGTERM', onSigterm); child.stderr.unpipe(errorOutput);
    };
    const finish = (code: number | null, signal: NodeJS.Signals | null, spawnError = false) => {
      if (settled) return; settled = true; cleanup();
      const durationMs = Number(process.hrtime.bigint() - startMono) / 1e6;
      if (spawnError) { captureComplete = false; captureFailureClass ??= 'spawn_error'; }
      try { writer.append(record('run_end', { exit_code: code, signal, capture_complete: captureComplete, dropped_record_count: dropped, duration_ms: durationMs, counts: { frames, exchanges }, ...(captureFailureClass ? { capture_failure_class: captureFailureClass } : {}), ...(spawnError ? { spawn_error_class: 'spawn_error' } : {}) })); } catch { captureComplete = false; }
      try { writer.close(); } catch { captureComplete = false; }
      const signalNumber = signal ? (osConstants.signals[signal] ?? 1) : 0;
      const childExitCode = spawnError ? 74 : code ?? (signal ? 128 + signalNumber : 1);
      if (!options.quiet) errorOutput.write(frames ? `Captured ${frames} frames / ${exchanges} exchanges in ${durationMs.toFixed(1)}ms\n` : 'No MCP frames captured\n');
      resolve({ journalPath: out, exitCode: childExitCode === 0 && !captureComplete ? 74 : childExitCode, signal, frameCount: frames, exchangeCount: exchanges, captureComplete, durationMs });
    };
    input.on('data', onInputData); input.on('end', onInputEnd);
    child.stdin.on('drain', onInputDrain); child.stdin.on('error', onStdinError);
    child.stdout.on('data', onChildOutput); child.stdout.on('end', onChildOutputEnd); output.on('drain', onOutputDrain);
    child.stderr.pipe(errorOutput, { end: false });
    child.once('error', () => finish(null, null, true));
    child.once('close', (code, signal) => finish(code, signal));
    process.once('SIGINT', onSigint); process.once('SIGTERM', onSigterm);
    if (!options.quiet) errorOutput.write(`Recording MCP stdio → ${out}\n`);
  });
}
