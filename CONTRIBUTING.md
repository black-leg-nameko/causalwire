# Contributing to causalwire

Thanks for helping make MCP failures easier to explain. Small, test-backed changes are preferred over broad rewrites.

## Before opening an issue

- Use the bug template for reproducible defects and the feature template for scoped proposals.
- Do not attach journals captured with `--content full` unless every payload is safe to disclose.
- Never post credentials, private MCP traffic, customer names, or security vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md) for vulnerabilities.
- Check the [MVP non-goals](docs/SPEC.md#スコープ外v2以降). HTTP proxying, replay, policy enforcement, cloud storage, and arbitrary redaction are intentionally out of scope.

## Development setup

Requirements: Node.js 20, 22, or 24 and Corepack/pnpm.

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm verify
corepack pnpm pack:artifact
corepack pnpm smoke:pack
```

The clean install depends on network and package-manager cache state, but the built demo itself should complete in under 10 seconds. CI runs the supported Node/OS matrix.

## Change expectations

- Preserve stdout byte transparency in `record`; causalwire messages belong on stderr.
- Keep content capture off by default. Never describe a hash as redaction or anonymization.
- Add or update conformance fixtures for protocol-diagnostic changes.
- Add tests for empty, error, degraded, privacy, and success behavior as relevant.
- Keep generated artifacts reproducible; do not hand-edit reports and claim they came from a command.
- Run `corepack pnpm verify`, `corepack pnpm audit:repo`, and the packed tarball smoke test.

## Pull requests

Keep each pull request focused. Explain the user-visible change, security/privacy impact, tests run, and any claim or compatibility boundary. By submitting a contribution, you agree that it is licensed under Apache-2.0.

## Good first issues

Start with [docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md). Maintainers will file and label these after the GitHub remote exists so links and ownership are accurate.
