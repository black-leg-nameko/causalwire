import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, platform, release, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const warmup = 200;
const measured = 2_000;
const runs = 5;
const sizes = [1024, 16 * 1024, 256 * 1024];
const labels = ['1KiB', '16KiB', '256KiB'];
const echoProgram = 'process.stdin.pipe(process.stdout)';
const work = mkdtempSync(join(tmpdir(), 'causalwire-child-bench-'));

type Sample = { bucket: string; ms: number };

function payload(index: number): Buffer {
  const ratio = index % 100;
  const bucket = ratio < 80 ? 0 : ratio < 95 ? 1 : 2;
  const prefix = `{"jsonrpc":"2.0","id":${index},"method":"tools/call","params":{"name":"bench.echo","padding":"`;
  const suffix = '"}}\n';
  return Buffer.from(prefix + 'x'.repeat(Math.max(0, sizes[bucket] - Buffer.byteLength(prefix) - Buffer.byteLength(suffix))) + suffix);
}

function start(args: string[]): ChildProcessWithoutNullStreams {
  return spawn(process.execPath, args, { shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
}

async function measure(args: string[]): Promise<{ samples: Sample[]; mismatches: number; stderr: string }> {
  const child = start(args);
  let buffered = Buffer.alloc(0);
  let stderr = '';
  let resolveLine: ((line: Buffer) => void) | undefined;
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });
  child.stdout.on('data', (chunk: Buffer) => {
    buffered = Buffer.concat([buffered, chunk]);
    const newline = buffered.indexOf(0x0a);
    if (newline >= 0 && resolveLine) {
      const line = Buffer.from(buffered.subarray(0, newline + 1));
      buffered = buffered.subarray(newline + 1);
      const resolveCurrent = resolveLine;
      resolveLine = undefined;
      resolveCurrent(line);
    }
  });
  const samples: Sample[] = [];
  let mismatches = 0;
  for (let index = 0; index < warmup + measured; index++) {
    const input = payload(index);
    const bucket = labels[sizes.indexOf(input.length)] ?? `${input.length}B`;
    const output = new Promise<Buffer>((resolveLinePromise) => { resolveLine = resolveLinePromise; });
    const startAt = performance.now();
    if (!child.stdin.write(input)) await new Promise<void>((resolveDrain) => child.stdin.once('drain', resolveDrain));
    const echoed = await output;
    const elapsed = performance.now() - startAt;
    if (!echoed.equals(input)) mismatches++;
    if (index >= warmup) samples.push({ bucket, ms: elapsed });
  }
  child.stdin.end();
  const exit = await new Promise<number | null>((resolveExit, reject) => {
    child.once('error', reject);
    child.once('close', resolveExit);
  });
  if (exit !== 0) throw new Error(`benchmark child exited ${exit}: ${stderr}`);
  return { samples, mismatches, stderr };
}

const percentile = (values: number[], fraction: number) => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
};

try {
  const baseline: Sample[] = [];
  const causalwire: Sample[] = [];
  let mismatches = 0;
  for (let run = 0; run < runs; run++) {
    const direct = await measure(['-e', echoProgram]);
    const wrapped = await measure([
      resolve('dist/cli.js'), '--quiet', 'record', '--out', join(work, `run-${run}.jsonl`), '--', process.execPath, '-e', echoProgram,
    ]);
    baseline.push(...direct.samples);
    causalwire.push(...wrapped.samples);
    mismatches += direct.mismatches + wrapped.mismatches;
  }
  const buckets = labels.map((bucket) => {
    const direct = baseline.filter((sample) => sample.bucket === bucket).map((sample) => sample.ms);
    const wrapped = causalwire.filter((sample) => sample.bucket === bucket).map((sample) => sample.ms);
    const baselineP95Ms = percentile(direct, 0.95);
    const causalwireP95Ms = percentile(wrapped, 0.95);
    return {
      bucket,
      count: wrapped.length,
      baselineP95Ms,
      causalwireP95Ms,
      incrementalP95Ms: causalwireP95Ms - baselineP95Ms,
      baselineP99Ms: percentile(direct, 0.99),
      causalwireP99Ms: percentile(wrapped, 0.99),
    };
  });
  const maxIncrementalP95Ms = Math.max(...buckets.map((bucket) => bucket.incrementalP95Ms));
  const pass = maxIncrementalP95Ms <= 5 && mismatches === 0;
  const report = {
    generatedAt: new Date().toISOString(),
    method: 'sequential newline exchange, direct OS child echo vs dist CLI record wrapper; one in-flight frame at a time',
    conditions: { warmup, measured, runs, payloadMix: '80% 1KiB, 15% 16KiB, 5% 256KiB', content: 'off' },
    environment: { os: `${platform()} ${release()}`, node: process.version, cpu: cpus()[0]?.model },
    buckets,
    maxIncrementalP95Ms,
    byteMismatch: mismatches,
    pass,
    claimBoundary: 'Measures a local packaged child-process echo path. It excludes remote MCP/tool/network latency and is cross-platform evidence only on runners that execute it.',
    sourceSha256: createHash('sha256').update(echoProgram).digest('hex'),
  };
  mkdirSync('artifacts/reports', { recursive: true });
  writeFileSync('artifacts/reports/child-process-overhead.json', `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync('artifacts/reports/child-process-overhead.md', `# Packaged child-process overhead\n\n- Result: ${pass ? 'PASS' : 'FAIL'}\n- Maximum incremental p95: ${maxIncrementalP95Ms.toFixed(3)} ms (target <=5 ms)\n- Byte mismatches: ${mismatches}\n- Runtime: ${report.environment.os}; ${report.environment.node}\n- Method: ${report.method}\n\n## Claim boundary\n\n${report.claimBoundary}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!pass) process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
