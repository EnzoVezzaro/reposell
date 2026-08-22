# security.md — Security-sensitive changes

1. Run `acc check` to validate current state.
2. Run `acc context --include memory` to review learned security notes.
3. Run `acc impact <changed-path>` to find what could break.
4. Verify all cryptographic operations use Ed25519.
5. Verify no hardcoded secrets in source or config.
6. Verify webhook signatures are verified (Stripe, GitHub).
7. Verify idempotency keys are used for financial operations.
8. Verify input validation is active on all user-provided data.
9. Verify output validation is active on all generated manifests.
10. Run `reposell doctor` to check security configuration.
11. Run `reposell verify` to verify signatures and manifests.
12. Update `.acc-memory.md` with any security lessons learned.

## Security Requirements Checklist

- [ ] Ed25519 used for all signing operations
- [ ] Private keys NEVER committed to Git, npm, CI artifacts, or logs
- [ ] Stripe webhook signature verification mandatory
- [ ] Payment confirmation never trusted from browser
- [ ] All financial operations idempotent
- [ ] Input validation on all user-provided data
- [ ] Output validation on all generated manifests
- [ ] GitHub token minimization (narrowest permissions)
- [ ] Secure HTTP headers (CSP, HSTS, etc.)
- [ ] Dependency auditing (bun audit)
- [ ] Supply chain protection