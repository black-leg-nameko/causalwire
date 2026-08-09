import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const tasks = [
  ['npm', ['run', 'verify']],
  ['node', ['scripts/browser-qa.mjs']],
  ['corepack', ['pnpm', 'bench:capture']],
  ['corepack', ['pnpm', 'bench:child']],
  ['corepack', ['pnpm', 'pack:artifact']],
  ['corepack', ['pnpm', 'smoke:pack']],
  ['gitleaks', ['git', '.', '--redact']],
  ['gitleaks', ['dir', '.', '--redact']],
  ['corepack', ['pnpm', 'audit', '--audit-level', 'low']],
  ['corepack', ['pnpm', 'licenses', 'list', '--prod', '--json']],
  ['npm', ['publish', '--dry-run', '--provenance', '--access', 'public']],
  ['corepack', ['pnpm', 'audit:repo']],
];
const log = [`causalwire release verification`, `started=${new Date().toISOString()}`, `platform=${process.platform}`, `node=${process.version}`, ''];
mkdirSync('artifacts/logs', { recursive: true });
let failed = false;
for (const [command, args] of tasks) {
  const started = Date.now();
  const result = spawnSync(command, args, { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' }, maxBuffer: 64 * 1024 * 1024 });
  log.push(`$ ${command} ${args.join(' ')}`, `[exit ${result.status}; ${Date.now() - started}ms]`, result.stdout ?? '', result.stderr ?? '', '');
  writeFileSync('artifacts/logs/release-verification.log', `${log.join('\n')}\n`);
  if (result.status !== 0) { failed = true; break; }
}
log.push(`finished=${new Date().toISOString()}`, `verdict=${failed ? 'FAIL' : 'PASS'}`);
writeFileSync('artifacts/logs/release-verification.log', `${log.join('\n')}\n`);
process.stdout.write(`Release verification ${failed ? 'FAIL' : 'PASS'}; see artifacts/logs/release-verification.log\n`);
if (failed) process.exitCode = 1;
