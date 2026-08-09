# Security policy

## Supported versions

causalwire is pre-release. Security fixes currently target the latest `0.1.x` release line once published.

## Report a vulnerability privately

Do not open a public issue. After the repository is published, use GitHub's **Security → Report a vulnerability** private reporting flow. If private vulnerability reporting has not yet been enabled, contact the maintainer through the private address listed in the repository profile and include only enough information to establish a secure follow-up channel.

Please include the affected version/commit, operating system and Node version, impact, minimal reproduction, and whether payload content or credentials may have been exposed. Do not include real secrets or third-party data. You should receive acknowledgement within three business days and a status update within seven business days.

## Product boundary

causalwire executes the child command with the invoking user's privileges; it is not a sandbox. `--content full` stores exact MCP frames locally and does not redact them. Metadata captured with content off—including method names, tool names, sizes, hashes, and fingerprints—may still be sensitive. OTLP export is network-off unless an endpoint is explicitly configured, and OTLP header values must never appear in logs or reports.

See [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) for the launch review and [README.md](README.md#reliability-and-security-boundaries) for safe-use constraints.
