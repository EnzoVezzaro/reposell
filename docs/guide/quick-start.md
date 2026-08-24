# Quick Start

Get up and running with reposell CLI in 5 minutes.

## Prerequisites

- Node.js 18+ (or Bun 1.0+)
- A Git repository with a remote origin
- GitHub account (for Stripe Connect onboarding)

## Install

```bash
# Global install
npm install -g reposell

# Or from a clone
npm link

# Verify
reposell --version
```

## Initialize Your Repository

```bash
cd your-repo
reposell init
```

The CLI will:
1. Detect Git provider (GitHub, GitLab, etc.)
2. Read repository metadata (owner, name, URL)
3. Create `reposell.yml` with derived defaults
4. Generate `/sell` static page wired to your verified Stripe Payment Links
5. Create `.github/workflows/` for CI/CD
6. Generate Ed25519 key pair for signing
7. Create `.acc/config/` for ACC framework

## Configure Payment (Stripe)

Create a **Payment Link** per release in your Stripe dashboard:

1. Dashboard → **Payment Links → + New**
2. Product name = your release · one-time price = exact amount + currency for `reposell.yml`
3. Copy the `https://buy.stripe.com/...` URL and add it to your config:

```yaml
# reposell.yml
release:
  version: v1.0.0

pricing:
  amount: 10
  currency: USD

payment:
  provider: stripe
  payment_link: https://buy.stripe.com/...
```

CI verifies the link against the declared pricing before anything is published — mismatch stays BLOCKED.

Optional keys (local tooling only — terminal dashboard + `sell sync`; never used for checkout):

```bash
# In GitHub repo settings → Secrets and variables → Actions
STRIPE_SECRET_KEY=sk_test_...
```

## Enable Listing (Optional)

```bash
reposell listing enable
reposell listing register
```

This creates `/reposell/manifest.json` and registers with the official listing at `reposell.dev`.

## Create a Release

```bash
reposell release create 1.0.0
# Creates git tag v1.0.0 and pushes
```

GitHub Actions will automatically:
1. Validate manifests
2. Update listing metadata
3. Notify listing (if registered)

## Verify Setup

```bash
reposell doctor
reposell doctor --fix  # Auto-fix safe issues
```

## Next Steps

- [Configure Payment](./payment-setup)
- [Enable Listing](./listing-setup)
- [Configure Releases](./release-config)
- [Customize Configuration](../configuration/)