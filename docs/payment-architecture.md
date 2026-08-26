# reposell CLI — Payment Integration (Static + CI)

## Architecture: Pure Static + CI

**No server, no API, no edge functions, no webhooks.** Pure static frontend + GitHub Actions CI.

## Two Independent Payment Flows

```
Buyer pays TWO separate transactions:

1. DISCOVERY CONTRIBUTION → reposell's Stripe account
   (link created by Listing CI during publication PR)
   Seller declares the amount ($5/$10/$25/$50/custom)

2. LICENSE PURCHASE → seller's own Stripe account
   (seller-created Payment Link on their /sell page)
   Seller keeps 100% of this revenue
```

## How It Works

```
Developer runs: reposell init
        │
        ▼
┌─────────────────────────────┐
│ Generates static /sell page │
│                             │
│ - Stripe Payment Link       │
│ - Seller-created, seller-   │
│   owned, 100% seller revenue│
└─────────────────────────────┘
        │
        ▼
Developer runs: reposell publish v1.0
        │
        ▼
┌─────────────────────────────┐
│ Listing CI creates          │
│ per-release Discovery       │
│ Payment Link (reposell's    │
│ Stripe account)             │
└─────────────────────────────┘
        │
        ▼
Buyer visits listing.reposell.dev
        │
        ▼
┌─────────────────────────────┐
│ Step 1: Pay discovery       │
│ contribution ($5 default)   │
│ → reposell's Stripe         │
│                             │
│ Step 2: Purchase license    │
│ from seller's /sell page    │
│ → seller's Stripe (100%)    │
└─────────────────────────────┘
```

## Generated Files by `reposell init`

```
your-repo/
├── .github/workflows/
│   ├── reposell.yml          # CI: lint, typecheck, test, build
│   └── reposell-release.yml  # Release automation
├── sell/
│   ├── index.html            # Static /sell page with Stripe Payment Link
│   ├── styles.css
│   └── scripts.js
├── reposell.yml              # Payment config (listing opt-in, contribution amount)
├── .env                      # REPOSELL_SIGNING_KEY, STRIPE_SECRET_KEY
└── .gitignore                # .env, .reposell/purchases/
```

## Configuration (`reposell.yml`)

```yaml
listing:
  enabled: true
  contribution:
    amount: 5
    currency: USD
```

The contribution amount is the discovery fee buyers pay to reposell. The seller keeps 100% of their `/sell` price.

## Fee Model (Current)

```
Product Price:        $50.00
Listing Fee:       $5.00  (buyer-paid, on top of seller's price)
─────────────────────────────────────
Net to Distribute:    $45.00

Main Listing:     $2.50  (50% of fee)  — reserved for future use
Public Listing:   $2.50  (50% of fee)  — reserved for future use
Repository Owner:     $40.50 (remainder)
```

**Note:** Community referral economics are not yet implemented. Currently, the listing fee goes entirely to reposell. The Main/Public splits are reserved for future use.

## Local Development

```bash
# Test static site locally
npx serve sell/

# Test Stripe integration
# Uses test keys from .env (local only)
```
