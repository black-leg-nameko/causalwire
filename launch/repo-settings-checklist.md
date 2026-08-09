# Repository settings checklist

This is an external-state checklist. No GitHub remote exists as of 2026-08-10, and no repository, push, package publication, release, topic, or social-preview API action was performed.

## Identity and metadata

- [ ] Create the public repository only after explicit user confirmation.
- [ ] Set the owner and replace repository-specific placeholders if any are introduced.
- [ ] Description (105 characters): `Local MCP stdio flight recorder that finds the first broken causal edge and exports OpenTelemetry evidence.`
- [ ] Website: use the documentation site only if it exists at launch; otherwise leave blank.
- [ ] Topics (primary language category: **TypeScript**): `mcp`, `model-context-protocol`, `typescript`, `cli`, `observability`, `opentelemetry`, `json-rpc`, `debugging`, `developer-tools`.
- [ ] Upload `artifacts/social/causalwire-social-preview.png` as the 1280×640 social preview.
- [ ] After the remote URL is known, add `repository`, `homepage`, and `bugs` fields to `package.json`, real release links to `CHANGELOG.md`, and a real `CODEOWNERS` handle.
- [ ] Replace the temporary README CI/npm status badges with live workflow and npm badges only after their targets exist and are green.

## Security and collaboration settings

- [ ] Enable private vulnerability reporting; verify the flow while logged out of the maintainer account.
- [ ] Enable Discussions and create/pin a launch-feedback Discussion or issue.
- [ ] Enable Issues; add the eight drafts in `docs/GOOD_FIRST_ISSUES.md` with accurate labels.
- [ ] Require two-factor authentication for maintainer accounts and least-privilege access.
- [ ] Enable secret scanning, push protection, Dependabot alerts, dependency graph, and CodeQL/default code scanning.
- [ ] Disable unused Actions and third-party integrations; restrict Actions to required verified publishers if organizational policy permits.

## Branch and release protection

- [ ] Set default branch to `main`.
- [ ] Protect `main`: pull request required, conversation resolution required, no force-push/delete, linear history preferred.
- [ ] Require all nine `CI` matrix jobs, `Published package contract`, `Security`, and `Links` before merge after their exact check names stabilize.
- [ ] Create the `npm-release` GitHub Environment with a maintainer reviewer and prevent self-bypass.
- [ ] Configure npm trusted publishing for `.github/workflows/release.yml`; do not store a long-lived npm token.
- [ ] Re-check that `causalwire` is available on npm immediately before publication. It returned registry 404 on 2026-08-10; availability is not reserved by this check.
- [ ] Create and push signed `v0.1.0` only after the matrix is green and release notes are final. The environment approval gates `npm publish --provenance`.
- [ ] Verify npm provenance attestation and unpacked package contents after publication, before distribution posts.

## Day-of hygiene

- [ ] Confirm latest `main` CI/security/link runs are green and less than 24 hours old.
- [ ] Confirm README live links, GIF rendering, social card crop, release page, package install, and `npx -y causalwire@latest demo` from a clean machine in ≤60 seconds.
- [ ] Confirm maintainer notifications and a launch-day response rotation.
- [ ] Capture screenshots/logs of settings and checks in a non-public audit location; do not add account PII or secrets to this repository.
- [ ] Obtain explicit user approval before any repository creation, push, release, or publication.
