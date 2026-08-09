# Gate B QA report

- Date: 2026-08-10 (Asia/Tokyo)
- Runtime tested: Node v22.23.1, Linux 6.18.33.2-microsoft-standard-WSL2
- Browser tested: Playwright Chromium 151
- Product state: launch-grade prototype; cross-platform release certification pending

## Outcome

The end-to-end core flow works from the packed npm tarball: bundled demo → first break → HTML/SVG, real stdio record → append-only journal → inspect, offline OTLP JSON, and official OTLP/HTTP protobuf export to a local receiver. CLI loading/running, empty, error, degraded/privacy, and success behavior are covered by automated tests or saved command evidence.

## Browser QA

| Surface | Width | Result |
|---|---:|---|
| HTML first-break success | 1280 | pass; no overflow, console errors, or failed requests |
| HTML first-break success | 768 | pass; metrics wrap, graph remains contained |
| HTML first-break success | 375 | pass; single-column metrics, readable first break, no page overflow |
| HTML empty state | 1280 | pass; explains next record command, no fake nodes |
| HTML empty state | 375 | pass; readable and contained |
| Standalone SVG success | 1280 | pass; accessible title/description, no failed requests |

Machine-readable browser evidence is in `artifacts/reports/browser-qa.json`. Screenshots are in `artifacts/screenshots/`, and the README demo GIF is generated from the browser-verified artifact.

## Functional and state verification

- Success: demo returns D004 at source seq 3 and writes standalone HTML/SVG.
- Running: `record` announces journal path to stderr while stdout remains protocol-only.
- Empty: zero-wire journal renders “No JSON-RPC exchanges found” and the next command; no fake graph.
- Error: invalid demo scenario exits 64 with an actionable message; missing OTLP endpoint exits 78 without connecting.
- Degraded: malformed frames are forwarded and diagnosed; content full requires an explicit flag and warning.
- OTLP: a local ephemeral receiver accepted official protobuf output; offline mapping contains spans, status, and diagnostic events without raw bytes, hashes, or plaintext IDs.

## Test and measurement summary

- Unit: 7 tests, including partial-tail recovery and bounded oversized-frame hashing.
- Integration: 13 tests, including byte transparency, exit 23 propagation, content off/full graph parity, local OTLP receiver, endpoint validation, output backpressure, forced ENOSPC, journal exhaustion, signal forwarding/listener cleanup, symlink refusal, and sparse oversized-journal rejection.
- E2E: 3 tests for success, usage error, and empty artifact.
- Conformance: 2 harness tests over 20 ground-truth failures + 4 controls; 20/20 exact first-break code/sequence/node.
- Security: 2 tests; privacy marker occurrences 0 across default-off metadata/HTML/SVG/OTLP, injection escaped, self-contained artifacts.
- Shadow benchmark: 5 runs × (200 warmup + 2,000 measured), 80/15/5% payload mix; latest max incremental p95 2.402ms; mismatch/drop/reorder 0.
- Packaged child benchmark: 5 runs × (200 warmup + 2,000 measured), 80/15/5% payload mix; latest max incremental p95 4.207ms; byte mismatch 0.

## Release-gate status after repository/security hardening

- **External pending:** only Linux WSL2 + Node 22 was available locally. CI and release workflows now execute Node 20/22/24 on Linux/macOS/Windows, but those live jobs must be green before cross-platform certification.
- **Resolved locally / external matrix pending:** a packaged OS child-process benchmark now passes locally and is in every CI matrix job. The saved in-process benchmark remains a separate shadow-path measurement.
- **Resolved locally:** automated first-signal forwarding/listener cleanup, output backpressure, bounded-journal truncation, and forced ENOSPC writer tests pass. The SIGTERM process test is skipped on Windows where POSIX signal semantics do not apply; Windows exit behavior remains covered by its CI process tests.
- A true terminal recording was not available; the supplied 8-second GIF shows the real browser evidence flow. CLI command transcripts are saved separately.
- **Resolved locally:** repository policy/security hardening passes 30/30 automated checks, and `docs/SECURITY_REVIEW.md` records Critical 0 / High open 0. Live GitHub settings, CI, and npm trusted publishing remain user-operated external gates.

## How to reproduce

Run the package scripts listed in README, then:

```bash
node dist/cli.js demo --out-dir artifacts/demo
node scripts/browser-qa.mjs
corepack pnpm smoke:pack
```
