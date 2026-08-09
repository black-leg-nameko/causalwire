## Summary

What user-visible protocol-debugging problem does this change solve?

## Scope and boundaries

- [ ] The change stays within `docs/SPEC.md`, or the intentional boundary change is explained.
- [ ] stdout byte transparency and shell-free child spawn remain intact.
- [ ] Content stays off by default; no hash is described as anonymization or redaction.
- [ ] Network behavior remains explicit and opt-in.

## Verification

- [ ] `corepack pnpm verify`
- [ ] Relevant conformance/security/fault tests
- [ ] `corepack pnpm pack:artifact && corepack pnpm smoke:pack`
- [ ] `corepack pnpm audit:repo`

Commands and results:

## Security and privacy impact

Describe new data stored, rendered, logged, sent, or executed. State "none" only after checking.

## Claim impact

Does this change any compatibility, performance, accuracy, privacy, or security claim? Link reproducible evidence.
