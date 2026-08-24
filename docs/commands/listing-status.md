# listing status

The terminal dashboard: repository, license, `/sell` endpoint and live payment-provider account state in one output.

```bash
$ reposell listing status
```

## What it reports

| Section | Source |
| --- | --- |
| `Repository` | Git remote detection (provider · owner/repo) |
| `License` | License check (SPDX id, RepoSell templates flagged) |
| `reposell.yml` | Presence + recorded license mode (`rsl-1.0` / `keep-existing`) |
| `/sell endpoint` | Whether `sell.enabled: true` is set in `reposell.yml` |
| `Payments` | Live Stripe account check via resolved secret key |

## Payments resolution

Key order: `REPOSELL_STRIPE_SECRET_KEY` → `STRIPE_SECRET_KEY`, process environment before local `.env`. Missing or rejected keys print `not configured` with setup guidance instead of failing. Live-mode keys produce a visible warning. See [Payments](../guide/payments/) for the full key-handling contract.

## Exit codes

- `0` — status gathered (including unconfigured payments; that's a state, not an error)
- `1` — unexpected failure (filesystem, network transport)
