---
title: reposell verify
description: CI-facing verification entry points — manifest gates, build trust chain, official pricing.
---

# reposell verify

Verification entry points designed for CI. Each target prints a one-line verdict and exits non-zero on failure — CI fails closed.

```bash
reposell verify <manifest | trust | pricing> [endpoint-url]
```

## Targets

### `verify manifest`

Loads `reposell.yml`, evaluates the repository and asserts that every gating release passes **all** publication gates (GitHub release exists, manifest valid, Payment Link verified, license ok, signature valid).

```bash
$ reposell verify manifest
✓ Manifest valid · 2 gating release(s) pass all gates
```

Any blocked release names the tag and exits `1`:

```
✗ BLOCKED: v1.4.0
```

### `verify trust`

Verifies that `dist/reposell/**` matches its `signature.json` envelope under the distributed public key `.github/reposell/verification-key.pem` (Ed25519 over canonical JSON digests). Run after `reposell build` with `REPOSELL_SIGNING_KEY` present.

```bash
$ reposell verify trust
✓ Trust chain valid — 6 signed files verified
```

Tampered or missing files produce `✗ INVALID SIGNATURE → BLOCKED` plus the failing entries.

### `verify pricing <endpoint-url>`

Fetches the official listing pricing endpoint and verifies it against the pinned RepoSell public key from `REPOSELL_OFFICIAL_VERIFY_KEY`. A pricing document that fails signature or schema verification is rejected — never trusted, never partially applied.

```bash
$ reposell verify pricing https://listing.reposell.dev/api/v1/pricing
✓ Pricing policy valid · policy_id: … · signature verified
```

## Usage in CI

The generated workflow (`.github/workflows/reposell.yml`) runs `verify manifest` and `verify trust` on every push; a failure blocks deployment of `/reposell/*`. See [Testing the CI flow](/development/testing-ci).

## Related

- [Signatures](/protocol/signatures)
- [`reposell build`](/commands/)
