---
title: reposell doctor
description: Diagnose repository health with auto-repair. Planned command.
---

# reposell doctor

::: warning Status: planned
`doctor` is specified but **not yet part of the shipped binary** (v0.x). The closest shipped commands today are [`validate`](/commands/) (publication gate checklist) and [`health`](/commands/) (per-release health). The landing-page audit on the [homepage](/) runs the same checks remotely against any GitHub repository.
:::

Diagnose the repository and report what stands between it and a healthy listing.

```bash
reposell doctor          # inspect and report
reposell doctor --fix    # repair safe problems automatically
```

## Planned checks

| Check | Description |
|-------|-------------|
| Git provider | Remote detection (owner/repo/provider) |
| Authentication | Signing key present, Stripe key resolvable |
| `reposell.yml` | Parses, schema-valid, releases defined |
| `/sell` config | `sell.enabled`, per-release pricing complete |
| Payment | Payment Link present, HTTPS, Stripe domain, amount/currency match |
| Releases | GitHub release exists for every declared tag |
| CI | Generated workflow present and current |
| Signatures | Verification key committed, trust chain verifies |
| Listing | Registration state (when enabled) |

## Planned behavior

- Every finding is **error**, **warning** or **ok** — with the fix, not just the problem.
- `--fix` repairs only safe, deterministic items (create missing config, regenerate workflow); anything touching money or keys is printed, never mutated.
- Exit code `0` only when no errors remain.

## Related

- [`reposell validate`](/commands/)
- [`reposell health`](/commands/)
