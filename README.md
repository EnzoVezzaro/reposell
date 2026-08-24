# reposell CLI

The core developer tool for the reposell repository-to-repository listing protocol. It automates repository initialization, `/sell` endpoint generation, `/listing` manifest creation, release management, CI/CD workflow generation, and cryptographic identity/signature operations.

## Quickstart

```bash
npm install -g reposell
cd your-repo
reposell init
```

Everything possible happens automatically. The developer should NOT have to manually maintain listing manifests, synchronize releases, update listing metadata, calculate listing fees, synchronize pricing, manually verify signatures, manually register every release, or manually maintain GitHub workflows.

The CLI and CI handle these tasks.

## Core Concept

A developer owns a Git repository. That repository can expose:

- `/sell` — Product sales endpoint (owner-owned, always optional)
- `/listing` — Listing integration (optional, reposell optional)

The repository remains the source of truth for its product.

The listing is OPTIONAL. A repository may:

- **A.** Sell through `/sell` only
- **B.** Sell through `/sell` and register `/listing`
- **C.** Register selected releases
- **D.** Automatically expose all future releases

## Commands

| Command | Description |
|---------|-------------|
| `reposell init` | Initialize repository with zero-config defaults |
| `reposell configure` | View/modify configuration |
| `reposell sell` | Generate `/sell` endpoint |
| `reposell listing enable` | Enable listing integration |
| `reposell listing disable` | Disable listing integration |
| `reposell listing register` | Register with official listing |
| `reposell listing status` | Dashboard: repo, license, `/sell` endpoint, Stripe account |
| `reposell license check` | Detect and explain the repository license |
| `reposell license use rsl` | Generate RSL-1.0 LICENSE + `.reposell/ai-policy.json` |
| `reposell license keep` | Keep your existing license |
| `reposell license compose` | Compose a rights-policy profile into `.reposell/*` machine artifacts |
| `reposell license explain` | Plain-language summary of the active license policy |
| `reposell license validate` | Validate the machine-readable licensing artifacts |
| `reposell license compatibility` | SPDX dependency compatibility check |
| `reposell audit` | Full licensing/compliance audit — PASS / WARN / BLOCKED + SBOMs + signed report |
| `reposell release` | Manage releases |
| `reposell verify` | Verify signatures and manifests |
| `reposell doctor` | Diagnose repository health |
| `reposell doctor --fix` | Auto-fix safe issues |

## Key Features

- **Zero-config**: All values derivable from Git/GitHub/CI are auto-derived
- **Payment abstraction**: `PaymentProvider` interface with `StripePaymentProvider` implementation
- **Git abstraction**: `GitProvider` interface with `GitHubProvider` implementation
- **Cryptographic identity**: Ed25519 keys for signing manifests and policies
- **Protocol versioning**: All public interfaces versioned (protocol: "reposell", version: "1.0")
- **CI/CD automation**: Generates GitHub Actions workflows for release detection and listing sync
- **Licensing framework**: 15 policy profiles, ~45 declarative rights (incl. AI training/inference/agents), machine-readable `.reposell/*` artifacts, SPDX expressions with `LicenseRef-reposell-*` support
- **Compliance audit**: `reposell audit` scans the repo + dependencies against policy — PASS/WARN/BLOCKED, SPDX & CycloneDX SBOMs, Ed25519-signed reports, CI gate mode
- **License offers**: multiple licensing schemes per release (perpetual, seats, recurring subscriptions), each with its own verified Stripe Payment Link
- **Reciprocity Program**: seller-configured, buyer-enforced — purchased forks that become commercially successful give back (original repo / dependencies / contributors), split by configurable shares

## Payment Integration

Checkout runs on **Stripe Payment Links** — created in your own Stripe dashboard and declared per release **per license offer** in `reposell.yml`. No backend server, no webhooks, no edge functions. CI verifies each link against its offer's declared pricing (HTTPS, `buy.stripe.com`, amount, currency **and billing mode** — a recurring scheme must point at a Stripe recurring price with the declared interval) before anything is published; mismatches stay BLOCKED.

One release can sell several license schemes at once — e.g. a $29 perpetual Standard license, a $99 10-seat Team license and a $9/month Pro subscription — each with its own verified link:

```yaml
licensing:
  policy:
    profile: source-available-commercial
  schemes:
    standard: { name: Standard, billing: one-time, template: rsl-1.0 }
    team:     { name: Team, billing: one-time, seats: 10 }
    pro-monthly: { name: Pro, billing: recurring, interval: month }

releases:
  definitions:
    v1.2.0:
      status: published
      offers:
        - scheme: standard
          pricing: { amount: 29, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
        - scheme: team
          pricing: { amount: 99, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
        - scheme: pro-monthly
          pricing: { amount: 9, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
```

The `/sell` page renders one purchase row per offer; the embedded agent JSON and JSON-LD carry the same facts.

### Account dashboard from the terminal

An optional secret key (`STRIPE_SECRET_KEY`) powers local tooling only:
```bash
$ reposell listing status
┌─ reposell dashboard ─────────────────────
│ Repository: you/your-repo (github)
│ ✓ License: MIT
│ reposell.yml: ✓ present · license mode: rsl-1.0
│ /sell endpoint: ✓ enabled
💳 Payments: Stripe (test mode)
    Account: Enzo Solo Dev · DO
    Charges: ✓ enabled · Payouts: ✓ enabled
└──────────────────────────────────────────
```

**Keys and environments:**

- `reposell` reads `REPOSELL_STRIPE_SECRET_KEY`, then `STRIPE_SECRET_KEY`, from the process environment first, then from a local `.env` file (`KEY=value` lines, `#` comments supported).
- No key anywhere → `Payments: not configured` with setup guidance. The CLI never crashes on a missing key.
- Invalid or rejected key → degrades gracefully to `not configured` with the reason available via the API.
- Test keys (`sk_test_…`) are recommended during development; live keys print an explicit warning.
- Keys are never logged, committed, or written to any generated file.

## Documentation

- [CLI Reference](docs/cli-reference.md)
- [Configuration](docs/configuration.md)
- [Protocol Specification](docs/protocol.md)
- [Payment Architecture](docs/payment-architecture.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

MIT - see [LICENSE](LICENSE) for details.