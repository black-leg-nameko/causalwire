# Good first issue drafts

These are ready-to-file drafts, not fabricated GitHub activity. After the remote exists, maintainers should create each issue, add `good first issue` and the suggested area label, and pin the launch-feedback issue. Each item is independently scoped and should not expand the MVP.

## 1. Add a `NO_COLOR` regression test

**Area:** CLI · **Estimate:** 1–2 hours

Add an e2e test proving that `NO_COLOR=1` produces no ANSI escapes for demo, inspect, usage errors, and empty output. Do not change the stable text contract.

## 2. Document PowerShell quickstart equivalents

**Area:** docs · **Estimate:** 1–2 hours

Add tested PowerShell examples for setting `OTEL_EXPORTER_OTLP_ENDPOINT` and inspecting a journal path. Keep the one-command demo unchanged and record the Windows version used.

## 3. Add CRLF fixture names to the conformance report

**Area:** conformance · **Estimate:** 2–3 hours

Add a report column that shows which fixtures contain LF vs CRLF wire delimiters. This is reporting only; do not rewrite fixture bytes.

## 4. Improve the empty-state next command

**Area:** rendering · **Estimate:** 2–3 hours

Verify that HTML and CLI empty states display a copy-pasteable record command without introducing a fake graph. Cover 375px and terminal output.

## 5. Add an SVG accessibility snapshot

**Area:** accessibility · **Estimate:** 2–3 hours

Assert the standalone SVG title, description, role, and diagnostic text for success and empty data. Do not add scripts, external fonts, or remote resources.

## 6. Add package help smoke coverage

**Area:** packaging · **Estimate:** 1–2 hours

Extend `scripts/tarball-smoke.mjs` to run `causalwire --help`, every subcommand's `--help`, and `--version` from the packed tarball. Assert exit zero and absence of workspace-only paths.

## 7. Document a synthetic MCP server recipe

**Area:** docs · **Estimate:** 2–4 hours

Write a short synthetic server example that returns one response and intentionally misses another. It must use fake data, run locally, and avoid presenting causalwire as a sandbox.

## 8. Add journal permission assertions on POSIX

**Area:** security · **Estimate:** 2–3 hours

Add a POSIX-only integration assertion that newly created journals use mode `0600` and directories use `0700`. Document why Windows ACL behavior is not represented by POSIX mode bits.
