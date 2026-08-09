import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const checks = [];
const note = (name, pass, evidence) => checks.push({ name, pass, evidence });
const required = [
  'README.md', 'LICENSE', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'CHANGELOG.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml', '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/PULL_REQUEST_TEMPLATE.md', '.github/workflows/ci.yml', '.github/workflows/security.yml',
  '.github/workflows/release.yml', '.github/dependabot.yml', 'artifacts/demo/causalwire-demo-v2.gif',
];
for (const file of required) note(`required:${file}`, existsSync(file), existsSync(file) ? 'present' : 'missing');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
note('license-consistency', pkg.license === 'Apache-2.0' && readFileSync('LICENSE', 'utf8').includes('Apache License\n                           Version 2.0'), `package=${pkg.license}`);
note('publish-provenance', pkg.publishConfig?.provenance === true && pkg.publishConfig?.access === 'public', JSON.stringify(pkg.publishConfig));
note('supported-node', pkg.engines?.node === '>=20', pkg.engines?.node ?? 'missing');
note('package-manager-pinned', /^pnpm@\d+\.\d+\.\d+$/.test(pkg.packageManager ?? ''), pkg.packageManager ?? 'missing');

const readme = readFileSync('README.md', 'utf8');
const pitch = readme.indexOf('A local flight recorder for MCP');
const demo = readme.indexOf('causalwire-demo-v2.gif');
const quickstart = readme.indexOf('## 60-second quickstart');
note('readme-first-viewport-order', pitch >= 0 && demo > pitch && quickstart > demo, `pitch=${pitch}, demo=${demo}, quickstart=${quickstart}`);
note('readme-claim-boundary', readme.includes('cross-platform evidence only after') && readme.includes('does **not** sandbox'), 'cross-platform and sandbox boundaries present');
const gifSize = statSync('artifacts/demo/causalwire-demo-v2.gif').size;
note('demo-size', gifSize < 5 * 1024 * 1024, `${gifSize} bytes; duration is generated as 8s and recorded in launch/repo-audit.md`);

function filesIn(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) output.push(path);
    else if (entry.isDirectory()) filesIn(path, output);
    else output.push(path);
  }
  return output;
}
const allFiles = filesIn('.');
const symlinks = allFiles.filter((file) => lstatSync(file).isSymbolicLink());
note('no-repository-symlinks', symlinks.length === 0, symlinks.length ? symlinks.join(', ') : 'none');

const textExtensions = new Set(['.md', '.json', '.jsonl', '.js', '.mjs', '.ts', '.yml', '.yaml', '.toml', '.txt', '']);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:AKIA|ASIA)[A-Z0-9]{16}/,
  /gh[pousr]_[A-Za-z0-9_]{30,}/,
  /(?:sk|rk)-(?:live|test)-[A-Za-z0-9]{20,}/,
];
const secretHits = [];
for (const file of allFiles) {
  if (file === 'pnpm-lock.yaml' || file.startsWith('artifacts/repo-audit/') || !textExtensions.has(extname(file))) continue;
  const data = readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) if (pattern.test(data)) secretHits.push(`${file}:${pattern.source}`);
}
note('secret-pattern-scan', secretHits.length === 0, secretHits.length ? secretHits.join(', ') : 'no key patterns; gitleaks full-history runs separately');
const envFiles = allFiles.filter((file) => /(^|\/)\.env(?:\.|$)/.test(file));
note('no-env-files', envFiles.length === 0, envFiles.length ? envFiles.join(', ') : 'none');

const localLinkFailures = [];
for (const file of allFiles.filter((item) => extname(item) === '.md')) {
  const markdown = readFileSync(file, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const raw = match[1].trim().replace(/^<|>$/g, '');
    if (/^(?:https?:|mailto:|#)/.test(raw)) continue;
    const target = decodeURIComponent(raw.split('#')[0]);
    if (!target) continue;
    const absolute = resolve(file.includes('/') ? join(file, '..') : '.', target);
    if (!existsSync(absolute)) localLinkFailures.push(`${file} -> ${raw}`);
  }
}
note('local-markdown-links', localLinkFailures.length === 0, localLinkFailures.length ? localLinkFailures.join(', ') : 'all local targets exist');

const dry = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
let pack = null;
try { pack = JSON.parse(dry.stdout)[0]; } catch { /* recorded below */ }
note('npm-pack-dry-run', dry.status === 0 && Boolean(pack), dry.status === 0 ? `${pack?.entryCount} files; ${pack?.size} bytes` : dry.stderr || dry.stdout);
const packagePaths = pack?.files?.map((file) => file.path) ?? [];
const packageRequired = ['LICENSE', 'README.md', 'package.json', 'dist/cli.js', 'dist/public-api.js', 'fixtures/demo/stuck-tool.jsonl', 'artifacts/demo/causalwire-demo-v2.gif'];
const missingPackage = packageRequired.filter((file) => !packagePaths.includes(file));
const forbiddenPackage = packagePaths.filter((file) => /^(?:src|tests|docs|bench|scripts)\//.test(file) || /(?:^|\/)\.env(?:\.|$)/.test(file));
note('package-required-files', missingPackage.length === 0, missingPackage.length ? missingPackage.join(', ') : 'all present');
note('package-no-dev-private-files', forbiddenPackage.length === 0, forbiddenPackage.length ? forbiddenPackage.join(', ') : 'none');
note('package-size', Boolean(pack) && pack.size < 1024 * 1024 && pack.unpackedSize < 3 * 1024 * 1024, pack ? `${pack.size} packed / ${pack.unpackedSize} unpacked` : 'unavailable');

const fixtureFiles = filesIn('fixtures').filter((file) => file.endsWith('.jsonl')).sort();
const before = new Map(fixtureFiles.map((file) => [file, createHash('sha256').update(readFileSync(file)).digest('hex')]));
const fixtureRun = spawnSync(process.execPath, ['scripts/generate-fixtures.mjs'], { encoding: 'utf8' });
const changedFixtures = fixtureFiles.filter((file) => before.get(file) !== createHash('sha256').update(readFileSync(file)).digest('hex'));
note('generated-fixtures-reproducible', fixtureRun.status === 0 && changedFixtures.length === 0, changedFixtures.length ? changedFixtures.join(', ') : fixtureRun.stderr || 'byte-identical');

const verdict = checks.every((check) => check.pass) ? 'PASS' : 'FAIL';
const report = {
  generatedAt: new Date().toISOString(),
  verdict,
  checks,
  externalState: 'GitHub remote/settings, CI run, npm trusted publisher, social preview upload, and publication confirmation are intentionally not asserted locally.',
};
mkdirSync('artifacts/repo-audit', { recursive: true });
writeFileSync('artifacts/repo-audit/audit.json', `${JSON.stringify(report, null, 2)}\n`);
if (pack) writeFileSync('artifacts/repo-audit/package-contents.json', `${JSON.stringify(pack, null, 2)}\n`);
process.stdout.write(`Repository audit ${verdict}: ${checks.filter((check) => check.pass).length}/${checks.length} checks passed\n`);
for (const check of checks.filter((item) => !item.pass)) process.stdout.write(`FAIL ${check.name}: ${check.evidence}\n`);
if (verdict !== 'PASS') process.exitCode = 1;
