# reposell CLI — Payment Integration (Static + CI)

## Architecture: Pure Static + CI

**No server, no API, no edge functions, no webhooks.** Pure static frontend + GitHub Actions CI.

## How It Works

```
Developer runs: reposell init
        │
        ▼
┌─────────────────────────────┐
│ Generates static files      │
│                             │
│ - Stripe.js integration     │
│ - Embedded Checkout UI      │
│ - Connect onboarding link   │
└─────────────────────────────┘
        │
        ▼
Developer deploys to static host
        │
        ▼
Buyer visits repo → Sees product → Clicks "Buy"
        │
        ▼
┌─────────────────────────────┐
│ Stripe Embedded Checkout    │
│ (runs entirely in browser)  │
│                             │
│ Card | Apple Pay | Google   │
│                             │
│ [ Pay $49 ]                 │
└─────────────────────────────┘
        │
        ▼
    Stripe (handles everything)
        │
   ┌────┴─────┐
   ▼          ▼
Buyer      Seller (Connect)
             │
             ▼
       Automatic payout
```

## Generated Files by `reposell init`

```
your-repo/
├── .github/workflows/
│   ├── reposell.yml          # CI: lint, typecheck, test, build
│   └── reposell-release.yml  # Release automation
├── sell/
│   ├── index.html            # Static /sell page with Stripe
│   ├── stripe-checkout.js    # Stripe.js + Embedded Checkout
│   └── connect-onboard.html  # Connect onboarding page
├── config/
│   └── reposell.yml          # Payment config (provider: stripe)
└── .env.example              # Stripe keys template (for local dev only)
```

## Configuration (`reposell.yml`)

```yaml
payment:
  provider: stripe
  # Stripe keys via GitHub Actions secrets (NEVER in repo):
  # STRIPE_PUBLISHABLE_KEY
  # STRIPE_SECRET_KEY (not used in frontend)
  # STRIPE_WEBHOOK_SECRET (not used - no webhooks)
  # STRIPE_CONNECT_CLIENT_ID
```

## Stripe Connect Setup (Static)

1. **Platform creates Connect account** in Stripe Dashboard
2. **Configure OAuth redirect** to your static `/connect-onboard.html`
3. **Add `STRIPE_CONNECT_CLIENT_ID`** to GitHub Actions secrets
4. **Seller clicks "Connect Stripe"** on repo → redirected to Stripe OAuth
5. **Stripe handles onboarding** → returns to repo with connected account

## Payment Flow (100% Client-Side)

1. Buyer clicks "Buy" on repo's `/sell` page
2. `stripe-checkout.js` creates checkout session via Stripe.js
3. Embedded Checkout opens in iframe/modal
4. Buyer pays → Stripe handles payment, Connect split
6. Stripe redirects to `success_url` with session_id
7. Repo page verifies session client-side via Stripe.js
8. **License delivered via GitHub** (fork private repo / grant access)

## Why No Webhooks?

- Stripe Connect handles seller payouts automatically
- Client-side verification via `stripe.confirmPayment()`
- GitHub used for license delivery (repo fork / collaborator add)
- CI validates purchases on release if needed

## Local Development

```bash
# Test static site locally
npx serve sell/

# Test Stripe integration
# Uses test keys from .env.example (local only)
```

## CI Validation

```yaml
# .github/workflows/reposell.yml
- name: Validate Stripe integration
  run: |
    # Check Stripe.js loads
    # Verify publishable key format
    # Confirm Connect client ID present
```