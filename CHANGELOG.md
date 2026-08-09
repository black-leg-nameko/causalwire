# Changelog

All notable changes are documented here. This project follows [Semantic Versioning](https://semver.org/) before and after `1.0.0`.

## [Unreleased]

- Awaiting the first public GitHub and npm release.

## [0.1.0] - 2026-08-10

### Added

- MCP stdio child-process recording with content-off-by-default JournalV1 evidence.
- Deterministic diagnostics for malformed frames and correlation failures.
- CLI, standalone HTML/SVG, offline OTLP JSON, and explicit OTLP/HTTP export.
- Bundled seeded demos and a versioned conformance corpus.
- Package smoke tests, browser QA, privacy tests, and reproducible benchmark reports.

### Security

- Exclusive journal/output creation, symlink refusal, bounded frames/journals, shell-free child spawn, escaped HTML/SVG, and no default network telemetry.

[Unreleased]: https://github.com/black-leg-nameko/causalwire/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/black-leg-nameko/causalwire/releases/tag/v0.1.0
