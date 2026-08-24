---
title: Payments
description: Stripe Payment Links for checkout (one per release), plus the optional secret key powering the terminal account dashboard and sell sync — including what happens when keys are missing.
---

# Payments

**Checkout runs on Stripe Payment Links.** You create one link per release in your own Stripe dashboard; reposell embeds it in `/sell` and CI verifies the link matches the release. No servers, no webhooks, no Connect — see [Payment Setup](/guide/payment-setup) for the walkthrough.

Beyond checkout, reposell talks to payment providers through a **`PaymentProvider` abstraction** (Stripe ships first via `StripePaymentProvider`; nothing in the protocol hardcodes it). The abstraction powers the local tooling: the terminal dashboard and `sell sync` fulfillment.

## The dashboard, from your terminal

```bash
$ reposell listing status
```

One command, everything that matters:

```txt
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

The payments block is a **live account check**: the CLI calls `GET /v1/account` on Stripe with your secret key and reports connection state, charges/payouts capability and mode (test vs live).

## How your key is resolved

The provider resolves its key in this order:

1. `REPOSELL_STRIPE_SECRET_KEY` in the process environment
2. `STRIPE_SECRET_KEY` in the process environment
3. `REPOSELL_STRIPE_SECRET_KEY` in a local `.env` file
4. `STRIPE_SECRET_KEY` in a local `.env` file

`.env` files use plain `KEY=value` lines; quotes and `#` comments are supported:

```bash
# .env (never commit this file)
STRIPE_SECRET_KEY=sk_test_51YourTestKey
```

## When the key is missing

This is a designed path, not an error state:

```bash
$ reposell listing status
💳 Payments: not configured
    Set STRIPE_SECRET_KEY=sk_test_… in your environment or a local .env file.
    Test keys are safe to commit to CI secrets; never commit the key itself.
```

- Missing key → `not configured`, with guidance. Exit code stays clean.
- Malformed key (`pk_live_…`, random text) → rejected up front with a hint about expected prefixes.
- Key rejected by Stripe's API → degrades gracefully to `not configured`; nothing crashes.
- Live mode detected → explicit warning printed next to the account info.

**Key hygiene rules**, enforced by design:

- Keys are never logged, never written into generated files, never embedded in manifests.
- Only the *mode* (`test`/`live`) ever reaches output — derived from the payload, not by printing the key.
- For CI, put the key in encrypted secrets (`STRIPE_SECRET_KEY`), not in `.env`.

## Create your Stripe Payment Link

Checkout runs on **Stripe Payment Links** — you create one per release in your own Stripe account, reposell embeds and verifies it. No webhooks, no backend, no server.

In the [Stripe Dashboard](https://dashboard.stripe.com/payment-links):

1. **Payment Links → + New**
2. Add your product — name it after the release (e.g. `my-tool v1.4.0`) and set a **one-time price** with the exact amount + currency you'll declare in `reposell.yml`
3. *(Optional)* After payment → custom redirect back to your repo or `/reposell/sell/` page
4. **Create link** → copy the URL (`https://buy.stripe.com/...`)
5. Put it into your release configuration:

```yaml
release:
  version: v1.4.0

pricing:
  amount: 50
  currency: USD

payment:
  provider: stripe
  payment_link: https://buy.stripe.com/...
```

6. Push / run `reposell publish v1.4.0`. CI verifies the link matches the release before anything goes live:

```text
✓ HTTPS          ✓ expected amount
✓ buy.stripe.com ✓ expected currency
```

Any mismatch → the release stays **BLOCKED**. The generated `/sell` page only ever shows verified links.

::: tip Test vs live
Payment Links are mode-scoped, just like keys. Create the link while your dashboard is in **test mode** for end-to-end rehearsals (test cards, fake money), then create the live-mode link with identical pricing when you launch. The declared amount must match in both worlds.
:::

## Keys & the terminal dashboard

Use Stripe test keys for everything except real launches:

- `sk_test_…` keys hit Stripe's test API — fake cards, fake money, full workflow.
- The dashboard shows `Stripe (test mode)` so you always know which world you're in.
- Switching to live means swapping one env var — no code changes, no regeneration of `/sell`.

## Architecture

```txt
PaymentProvider (interface)          ← domain layer, no vendor types
   └── StripePaymentProvider         ← infrastructure adapter
         ├── key resolution          ← env → .env precedence chain
         ├── verifyAccount()         ← GET /v1/account, typed projection
         └── typed errors            ← KeyMissing / KeyInvalid / ApiError
```

Adding a second provider means implementing the same surface; commands and services stay untouched.
