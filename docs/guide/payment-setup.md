# Payment Setup (Stripe)

## Overview

reposell uses **Stripe Payment Links** — you create one link per *paid* release in your own Stripe account, and reposell embeds and verifies it in your generated `/sell` page.

**No servers, no webhooks, no Connect platform, no edge functions.** Buyers check out on Stripe-hosted pages; card data never touches your repository or any reposell infrastructure.

Shipping a free release? Skip this page entirely — declare `pricing: { type: "free" }` in `reposell.yml` and the release ships as a repository fork. No Stripe account needed. See [Release Model](/protocol/release-model).

## One-time Stripe setup

1. Create a [Stripe account](https://stripe.com) and complete identity verification
2. Toggle **test mode** while developing

That's it — no Connect, no API keys required for checkout itself.

## Create a Payment Link per release

1. Dashboard → **Payment Links → + New**
2. Product name = your release (e.g. `my-tool v1.4.0`)
3. **One-time price**, exact amount + currency you'll declare in `reposell.yml`
4. *(Optional)* After payment → custom redirect back to your repo or `/reposell/sell/`
5. **Create link** → copy the URL (`https://buy.stripe.com/...`)

::: tip Test vs live
Links are mode-scoped. Create a test-mode link for rehearsals (fake cards, fake money); create an identical live-mode link when you launch.
:::

## Configure it in your repo

Paid release:

```yaml
# reposell.yml
release:
  version: v1.4.0

pricing:
  type: paid
  amount: 50
  currency: USD

payment:
  provider: stripe
  payment_link: https://buy.stripe.com/...
```

Free release — no Stripe, no keys, nothing:

```yaml
release:
  version: v1.5.0

pricing:
  type: free
```

Or let the CLI walk you through it:

```bash
reposell release v1.4.0
```

```text
Release: v1.4.0

Price: $50 USD

Stripe Payment Link:
> https://buy.stripe.com/...

Publish this release? [Y/n]
```

## What CI verifies before publishing

A release stays **BLOCKED** unless every check passes:

```text
✓ HTTPS            ✓ expected amount
✓ buy.stripe.com   ✓ expected currency
```

The manifest price must equal the Stripe checkout price — mismatches are never published. See [Release Model](/protocol/release-model).

## Optional: keys for local tooling only

Two features use a secret key (`STRIPE_SECRET_KEY` in `.env`, never committed):

- `reposell listing status` — live account dashboard from the terminal
- `reposell sell sync` — pull completed sales locally, issue licenses, catch refunds

They are **never** used for checkout. Details in [Payments & Keys](/guide/payments/).

## Optional: publish to the Listing (contribution)

If you want your release on [listing.reposell.dev](https://listing.reposell.dev), you declare a voluntary **contribution** to Reposell — a separate Stripe Payment Link that the Listing's CI creates in Reposell's own Stripe account:

```bash
reposell listing enable     # "Contribution to Reposell? [$5]" → $5/$10/$25/$50/custom
reposell listing publish    # opens the publication PR; CI creates the contribution link
```

Two independent flows, both yours to control:

| Flow | Stripe account | Who creates the link |
| --- | --- | --- |
| `/sell` price | seller's | seller |
| Listing contribution | Reposell's | Listing CI |

Every release keeps its own immutable contribution link — old releases stay purchasable forever. Full spec: [Contributions & Payment Links](/protocol/contributions).

## Architecture

```text
Buyer → /reposell/sell/ → verified Payment Link → Stripe Checkout
                                                    │
Fulfillment:  reposell sell sync  ←── Stripe API ────┘  (local, pull-based)
```
