# reposell

The CLI for the reposell repository-to-repository listing protocol. Automates repository initialization, release management, cryptographic signing, storefront generation, and listing publication.

**No server, no database, no Docker.** Pure static frontend + GitHub Actions CI + Stripe Payment Links.

## Install

```bash
npm install -g @reposell/cli
```

## Quickstart

```bash
cd your-repo
reposell init --yes       # zero-config: generate keys, create reposell.yml, scaffold /sell
reposell release          # declare a release with pricing + Stripe Payment Link
reposell publish          # approve publication after gates pass
```

## Commands

| Command | Description |
|---------|-------------|
| `reposell init [--yes] [--wizard]` | Guided setup wizard — license, payment, signing key |
| `reposell sell init [--link URL]` | Scaffold the `/sell` storefront wired to your Stripe Payment Link |
| `reposell sell sync [payment_link_id]` | Pull-based fulfillment: purchases, refunds, fork artifacts |
| `reposell release [tag] [--price N] [--currency USD] [--link URL]` | Declare a release with pricing |
| `reposell publish [tag]` | Approve publication after gates pass |
| `reposell validate` | Run the full publication gate checklist |
| `reposell build [--out dist]` | Generate the `/reposell/*` static surface |
| `reposell health` | Health report for every configured release |
| `reposell verify <manifest\|trust\|pricing> [url]` | CI verification entry points |
| `reposell keys <generate\|show>` | Ed25519 signing identity management |
| `reposell license check\|use\|keep\|compose\|explain\|validate\|compatibility` | License management and SPDX analysis |
| `reposell listing status\|publish` | Listing status dashboard and publication |
| `reposell audit` | Full licensing/compliance audit (PASS/WARN/BLOCKED) |
| `reposell reciprocity [--revenue N]` | Reciprocity program validation and simulation |

## How It Works

### Payment Model

```
Buyer pays TWO separate transactions:

1. DISCOVERY CONTRIBUTION → reposell's Stripe account
   (created by listing CI, seller-declared amount, e.g. $5)

2. LICENSE PURCHASE → seller's own Stripe account
   (seller-created Payment Link on /sell, seller keeps 100%)
```

### Workflow

```
reposell init          → detect repo, generate keys, create reposell.yml + /sell
reposell release       → attach pricing + Payment Link to a GitHub release
reposell publish       → approve publication after validation gates
reposell listing       → announce to the reposell listing directory
```

### What Gets Generated

```
your-repo/
├── reposell.yml                 # protocol config (product, licensing, releases, payment)
├── .reposell/
│   ├── storefront.json          # storefront theme + section layout
│   ├── ai-policy.json           # AI usage restrictions
│   └── signing-key              # Ed25519 signing key (gitignored)
├── sell/
│   ├── index.html               # /sell storefront with embedded reposell-data JSON
│   ├── styles.css               # dark theme storefront styles
│   └── scripts.js               # scroll-reveal animations
└── .github/workflows/
    └── reposell.yml             # CI: validate → build → deploy /sell to Pages
```

## Configuration

All values are auto-derived from Git/GitHub/CI. Optional overrides in `reposell.yml`:

```yaml
version: 1
product:
  name: my-project
licensing:
  schemes:
    standard:
      name: Standard
      billing: one-time
      template: rsl-1.0
releases:
  mode: manual
  definitions:
    v1.0.0:
      status: published
      offers:
        - scheme: standard
          pricing: { amount: 29, currency: USD }
          payment:
            provider: stripe
            payment_link: https://buy.stripe.com/...
sell:
  enabled: true
listing:
  enabled: true
  contribution:
    amount: 5
    currency: USD
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Developer (seller)                  │
│                                                     │
│  reposell init → reposell.yml + /sell page          │
│  reposell release → pricing attached to release     │
│  reposell publish → gates pass, page deployed       │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│          Static /sell page (GitHub Pages)           │
│                                                     │
│  Seller's Stripe Payment Link → 100% seller revenue │
│  Embedded reposell-data JSON for CI verification    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│         Listing CI (reposell-listing)                │
│                                                     │
│  verify-pr.yml → verify /sell + payment link        │
│  discovery-sync.yml → create discovery Payment Link │
│  deploy-docs.yml → rebuild + deploy listing site    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              Buyer visits listing.reposell.dev      │
│                                                     │
│  Step 1: Pay discovery contribution → reposell      │
│  Step 2: Purchase license from /sell → seller       │
└─────────────────────────────────────────────────────┘
```

## Ecosystem

| Product | Description | Link |
|---------|-------------|------|
| **reposell CLI** | Repository init, release management, signing, storefront | [reposell.dev](https://reposell.dev/) |
| **reposell listing** | Official discovery directory — verification CI + discovery payments | [listing.reposell.dev](https://listing.reposell.dev/) |
| **reposell community listing** | Self-hosted federated discovery directory — community-operated | [community.reposell.dev](https://community.reposell.dev/) |
| **reposell example** | Minimal Vite + React app for testing the CLI | [GitHub](https://github.com/EnzoVezzaro/reposell-example) |

## Documentation

Full documentation: [reposell.dev](https://reposell.dev/)

## License

Custom reposell license — see [LICENSE](LICENSE) for details.
