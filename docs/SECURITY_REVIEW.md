# Security and quality review

- Review date: 2026-08-10 (Asia/Tokyo)
- Scope: the user-owned `causalwire` repository, package, generated artifacts, and future GitHub/npm automation
- Review mode: defensive pre-launch review with fixes and regression verification
- Stack/exposure: Node.js 20+ / TypeScript ESM local CLI; MCP stdio proxy; local JSONL; standalone HTML/SVG; optional explicit OTLP/HTTP export
- Result: **Critical 0, High 1 fixed / 0 open, Medium 6 fixed / 0 open, Low 1 fixed / 0 open**
- Gate result: **High/Critical open = 0**. The local security gate passes. Live cross-platform CI and repository settings remain external release checks.

## Assumptions

The initial audience is global, English-first MCP server/platform engineers. The package is free Apache-2.0 OSS and has no auth, tenancy, payments, hosted storage, file uploads, AI model/tool loop, or browser automation. It handles attacker-influenced MCP/JSONL data and potentially sensitive local metadata. Users explicitly choose child commands, output paths, full-content mode, usage-log paths, and OTLP endpoints. A `venture-context.yaml` is absent; README, THESIS, SPEC, Gate B evidence, and the user's authorization define scope.

## Lightweight threat model

1. Assets: unmodified stdio bytes, local journals, optional full payloads, OTLP headers, incident artifacts, and maintainer release credentials.
2. Entry points: child stdin/stdout/stderr, journal files passed to inspect/export, CLI flags/paths, OTLP environment variables, and package/workflow dependencies.
3. Trust boundary: causalwire forwards a user-selected child process but does not sandbox it.
4. Trust boundary: MCP frames and imported journals are untrusted even when the child command itself is expected.
5. Trust boundary: content-full journals leave process memory and become plaintext local files only after explicit opt-in.
6. Trust boundary: network is off until the user supplies an OTLP HTTP(S) endpoint; header values are secrets.
7. Likely failures/attackers: a faulty or compromised MCP server, a crafted shared journal, another local user racing a shared directory, and compromised dependencies/Actions.
8. Primary impact: memory exhaustion, dropped/altered proxy traffic, file clobber, sensitive metadata disclosure, misleading evidence, or release compromise.
9. Guardrails: forward-first backpressure, bounded parsing/storage, exclusive no-follow writes, escaped self-contained rendering, and allowlisted telemetry fields.
10. Security goal: fail closed for evidence capture/output while keeping child traffic byte-transparent; never claim sandboxing, redaction, or semantic root cause.

## Findings and fixes

| ID | Severity | Impact and verified evidence | Fix | File / current evidence | Status |
|---|---|---|---|---|---|
| CW-SEC-001 | **High** | A noisy child could outpace the output sink and shadow parser. `output.write()` return values were ignored and capture work accumulated through an unbounded Promise chain, allowing memory growth and proxy degradation. This was confirmed by reading the actual child stdout/capture path. | Forward bytes first, pause child stdout on backpressure until `drain`, run bounded synchronous shadow work, disable capture after the first storage failure, and stream oversized hashing while retaining at most `max+1` bytes. | `src/capture/child-process-wrapper.ts:47`, `:78`; `src/capture/frame-decoder.ts:14`; `tests/integration/faults.test.ts` backpressure/limit cases | **Fixed; retested** |
| CW-SEC-002 | **Medium** | A crafted journal could contain an oversized file/line or excessive record count. The previous reader used readline and the normalizer retained every passthrough field, including full raw payloads, increasing local memory-DoS impact. | Enforce 512 MiB file, 32 MiB line, and 100,100 record limits before/while reading; use fatal UTF-8 decode and bounded streaming; project only normalization fields and drop raw content before graph construction. | `src/normalize/pipeline.ts:7`; `src/normalize/mcp-jsonrpc-v1.ts:9`; `src/schema/journal-v1.ts:10`; sparse-file regression in `tests/integration/faults.test.ts` | **Fixed; retested** |
| CW-SEC-003 | **Medium** | Non-overwrite export checked existence and then renamed, creating a local TOCTOU clobber window. The optional usage log appended through symlinks. In shared directories this could overwrite or append to an unintended same-privilege file. | Non-overwrite output now writes directly with `O_CREAT|O_EXCL|O_NOFOLLOW`; journals remain exclusive; usage logs reject symlinks and open with append/no-follow mode; new directories/files request `0700`/`0600`. | `src/cli.ts:18`; `src/capture/journal-writer.ts:9`; `src/usage/local-usage-log.ts:3`; symlink regression in `tests/integration/faults.test.ts` | **Fixed; retested** |
| CW-SEC-004 | **Medium** | Journal limit/write failures caused repeated failed capture attempts, could omit truncation evidence, and a non-finite `--max-journal-mb` disabled the comparison. This risked CPU churn and a falsely complete artifact. | Validate positive finite/safe sizes; reserve room for truncation/run-end; stop capture at first failure; mark D009 where storage permits; force incomplete capture and exit 74 while traffic continues. Added forced ENOSPC and bounded-journal tests. | `src/cli.ts:17`, `:29`; `src/capture/journal-writer.ts:14`; `src/capture/child-process-wrapper.ts:61`; `tests/integration/faults.test.ts` | **Fixed; retested** |
| CW-SEC-005 | **Medium** | Each library capture left SIGINT/SIGTERM and stream listeners installed; spawn error and close could both finalize. Repeated programmatic use could leak listeners or route later signals to a closed child. | Idempotent settle path, explicit removal/unpipe of all listeners, EPIPE handling, and automated first-signal forwarding/cleanup tests. | `src/capture/child-process-wrapper.ts:74`, `:84`, `:89`; `tests/integration/faults.test.ts` signal cases | **Fixed; retested** |
| CW-SEC-006 | **Medium** | OTLP accepted arbitrary URL schemes, embedded credentials, fragments, and non-finite/unbounded timeouts. While the endpoint is explicit local configuration rather than a remote SSRF input, malformed values could leak credentials into URL handling or create unreliable network behavior. | Parse with `URL`; allow only HTTP(S); reject embedded credentials/fragments; bound timeout to 1–300,000 ms; correctly distinguish the standard traces endpoint from the base endpoint; keep error text generic and header values unlogged. | `src/export/otlp.ts:16`; `src/cli.ts:38`; invalid endpoint/timeout regressions in `tests/integration/otlp.test.ts` | **Fixed; retested** |
| CW-SEC-007 | **Medium** | GitHub Actions used mutable major tags and broad job permissions, increasing release/supply-chain blast radius. | Pin every action to a full commit SHA, disable persisted checkout credentials in sensitive jobs, scope `security-events:write` to CodeQL, and scope `contents:write`/`id-token:write` to the environment-gated publish job. Dependabot tracks Actions. | `.github/workflows/security.yml:11`; `.github/workflows/release.yml`; `.github/dependabot.yml` | **Fixed; static verification** |
| CW-SEC-008 | **Low** | Oversized full-content frames previously retained a truncated prefix while reporting metadata derived from retained bytes, which could be mistaken for exact oversized evidence. | Hash/count all forwarded frame bytes incrementally, retain only the bound, classify oversized, and never write `raw_b64` for an oversized frame. | `src/capture/frame-decoder.ts:14`; `src/capture/content-policy.ts:31`; unit regression in `tests/unit/core.test.ts` | **Fixed; retested** |

## Re-verification

| Command | Result |
|---|---|
| `corepack pnpm lint` | PASS |
| `corepack pnpm typecheck` | PASS |
| `corepack pnpm test` | PASS — 7 unit tests |
| `corepack pnpm test:integration` | PASS — 13 integration tests including 7 fault/path/signal cases |
| `corepack pnpm test:e2e` | PASS — 3 CLI state tests |
| `corepack pnpm test:conformance` | PASS — 20/20 exact seeded failures plus controls |
| `corepack pnpm test:security` | PASS — default-off privacy and self-contained injection boundaries |
| `corepack pnpm bench:capture` | PASS — max incremental p95 2.402 ms; mismatch/drop/reorder 0/0/0 on local Linux/Node 22 |
| `corepack pnpm bench:child` | PASS — packaged child path max incremental p95 4.207 ms; byte mismatch 0 on local Linux/Node 22 |
| `corepack pnpm pack:artifact && corepack pnpm smoke:pack` | PASS — 16-file, 115.0 kB tarball; seven core commands; privacy marker occurrences 0 |
| `gitleaks git . --redact` | PASS — zero commits and zero history leaks |
| `gitleaks dir . --redact` | PASS — complete working tree scanned (over 618 kB), zero leaks |
| `corepack pnpm audit --audit-level low` | PASS — no known vulnerabilities |
| `corepack pnpm licenses list --prod --json` | PASS — production dependency licenses Apache-2.0 or MIT |
| `npm publish --dry-run --provenance --access public` | PASS — dry-run only; no package was published |

Saved machine-readable outputs include `artifacts/repo-audit/gitleaks-history.json`, `artifacts/repo-audit/gitleaks-worktree.json`, package contents, benchmark JSON, conformance JSON, and tarball-smoke evidence. CI action SHA resolution was checked directly against each official GitHub action repository on 2026-08-10.

The first final `verify:release` rerun failed once because the SIGTERM integration test sent the signal after the wrapper's status line but before the child had installed its handler; the wrapper process consequently exited 143 instead of observing the child's expected 42. The failure is preserved in `artifacts/logs/signal-regression-failure.log`. The wrapper now emits its ready/status line only after installing its own signal listeners, and the test waits for an explicit child-ready marker. `faults.test.ts` then passed 10 consecutive isolated runs and the complete final release verification passed. This was a test/readiness race, not evidence that failed forwarding was accepted.

## Checked and clear / not applicable

- **Secrets:** zero gitleaks hits after removing key-like test marker syntax; OTLP header values are never emitted by causalwire; no `.env` files.
- **Stdio/command injection:** child spawn remains argv-based with `shell:false`; stdout remains protocol bytes only; child stderr passes through but is never journaled.
- **Symlink/path traversal:** leaf outputs are exclusive/no-follow or safe atomic demo replacement. Ancestor-directory symlink behavior is a documented residual below.
- **JSONL/deserialization:** no `eval`, dynamic import, object-method invocation, or arbitrary plugin loading; schema/common fields and resource bounds are validated.
- **HTML/SVG injection:** all evidence strings are encoded; HTML CSP is `default-src 'none'`; no scripts, remote images, links, fonts, or CDNs; browser QA and injection tests pass.
- **OTLP network/headers:** no endpoint means no connection and exit 78; only explicit HTTP(S); header values are passed to the exporter but not logged or stored.
- **Privacy/content full:** default off does not retain scalar payload content/plaintext IDs; exact frames require `--content full` and a warning; derived HTML/SVG/OTLP remain metadata-only.
- **DoS:** frame, journal bytes, line, record, and graph-node limits exist; output/input backpressure is honored; capture failure does not intentionally stop forwarded child traffic.
- **Dependencies/supply chain:** frozen lockfile, pnpm build allowlist, no known advisories, compatible production licenses, SHA-pinned Actions, provenance-enabled environment-gated release.
- **Auth/session/authorization/CSRF/CORS/rate limits:** not applicable; no service, identity, session, tenant, or HTTP application endpoint exists.
- **Payments/webhooks/uploads/AI prompt injection/browser automation:** not applicable; none are implemented and all remain outside the MVP.

## Residual risks and launch follow-ups

1. **Unsandboxed child (accepted):** the child has the invoking user's privileges. A sandbox would be a different product boundary; README/CLI/SECURITY state this explicitly.
2. **Full content at rest (accepted):** full mode stores plaintext frame bytes without encryption or arbitrary redaction. Use only with safe data and restricted local storage; do not share blindly.
3. **Ancestor symlinks (Low):** portable leaf no-follow flags do not establish a capability-safe walk of every parent directory. Avoid attacker-writable/shared ancestor paths. The leaf cannot be silently followed and no privilege elevation is introduced.
4. **Evidence authenticity (Low):** JournalV1 is append-only by writer behavior but is not signed or tamper-evident after capture. Diagnose imported journals as supplied evidence, not authenticated ground truth.
5. **Physical disk exhaustion:** when no bytes remain, even the reserved D009/run-end record may be impossible to persist. Exit 74 and stderr are the remaining signals; forwarded traffic is prioritized.
6. **Cross-platform external gate:** local fixes were verified only on Linux/Node 22. The configured Node 20/22/24 × Linux/macOS/Windows workflows, including child benchmark/package smoke, must be green before public claims or release.
7. **Future protocol surfaces:** HTTP/A2A proxying, replay, cloud storage, auth, arbitrary plugins, and redaction are not reviewed because they are not implemented. Re-run this review before adding any of them.
