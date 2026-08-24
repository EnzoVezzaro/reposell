---
title: Payment Abstraction
description: How reposell handles payments through Stripe Payment Links — structural and deep verification, test vs live mode, and where a second provider would plug in.
---

# Payment Abstraction

Checkout never touches a server you operate. Releases are sold through **Stripe Payment Links** — one per release, created in your own Stripe dashboard, declared in `reposell.yml`, verified by CI. No webhooks, no backend, no edge functions.

## The model

```yaml
# reposell.yml
releases:
  definitions:
    v1.0.0:
      pricing:
        amount: 10
        currency: USD
      payment:
        provider: stripe
        payment_link: https://buy.stripe.com/...
        payment_link_id: plink_...   # optional, enables deep verification
```

Each release owns its price and its link. The generated `/sell` page only ever renders links that passed validation, so a buyer can only reach checkouts you declared.

## Two verification layers

### 1. Structural (`domain/payment/link.ts`)

Every publish gate runs `validatePaymentLink`. A link must:

- parse as a URL
- use HTTPS
- sit on `buy.stripe.com`, `checkout.stripe.com`, or another `*.stripe.com` host

Failures are typed: `PAYMENT_LINK_MISSING` (no link declared) or `PAYMENT_LINK_INVALID` (with the reason). A release without a structurally valid link cannot be published. As the module comment puts it: *the system never guesses*.

### 2. Deep verification (`domain/payment/stripe-links.ts`)

When two extra inputs exist — a `payment_link_id` (`plink_…`) on the release and a Stripe secret key in the environment — CI additionally calls:

```text
GET https://api.stripe.com/v1/payment_links/{id}?expand[]=line_items.data.price
```

and compares the live checkout against the manifest:

- `unit_amount` must equal `amount × 100` (rounded)
- currency is compared case-insensitively

Possible outcomes: `verified`, `mismatch` (with exact amounts), `inactive`, `not_found`, `api_error`, or `unverifiable`. Any mismatch keeps the release **BLOCKED**; `unverifiable` (no key or no link id) falls back to structural checks only — it never fails silently.

## The provider class (`domain/payment/stripe.ts`)

`StripePaymentProvider` powers the local tooling — the terminal dashboard (`reposell listing status`) and account checks — not checkout itself.

```text
StripePaymentProvider
├── constructor(apiKey)     rejects keys not matching /^(sk|rk)_(test|live)_/
├── fromEnv(env)            REPOSELL_STRIPE_SECRET_KEY ?? STRIPE_SECRET_KEY
└── verifyAccount()         GET /v1/account -> PaymentAccountStatus
```

`verifyAccount()` reports connection state, business profile, default currency, `chargesEnabled`, `payoutsEnabled`, and the mode. Key resolution follows the documented precedence chain (process environment first, then `.env`) — see [Payments & Keys](/guide/payments/).

Missing keys are a designed path, not an exception storm: `StripeKeyMissingError` produces guidance output, malformed keys are rejected with a prefix hint before any network call, and API errors degrade gracefully.

## Test vs live mode

Mode detection happens in two places:

- `classifySecretKey(key)` — any key containing `_live_` is treated as live, everything else as test
- the Stripe account payload's `livemode` field, used for the authoritative dashboard report

Practical rules:

- Develop with `sk_test_…`; the dashboard prints `Stripe (test mode)` so you always know which world you are in
- Payment Links are mode-scoped: a test-mode link charges test prices regardless of which key inspects it later
- Going live means creating a live-mode link with identical pricing and swapping the declared URL/id — no code changes, no regeneration of `/sell`
- Only the mode string ever reaches output; keys are never logged or embedded in generated files

## Adding a future provider

The protocol does not hardcode Stripe. A new provider (PayPal, Coinbase, ...) plugs in at the same seams without touching commands or services:

1. **Structural validation** — implement the equivalent of `validatePaymentLink` (scheme + host allowlist + typed errors) for the provider's checkout URLs
2. **Deep verification** — an endpoint check comparing the provider's live price against `pricing.amount`/`currency`, returning a status union like `DeepLinkResult`
3. **Account tooling** — a class named `<Provider>PaymentProvider` with key validation, env resolution, and an account-status method
4. **Transport injection** — accept a fetch-like function so tests stay offline

Releases already declare `payment.provider: stripe` as a plain string field in the schema, so per-release provider selection needs no config-format change once a second implementation lands.

## Where economics live

Listing fee splitting is deliberately outside the payment provider: `domain/pricing/endpoint.ts` verifies a separately **signed** pricing policy (fetch → schema → Ed25519 signature → expiration, failing closed at every step) and then computes deterministic splits via `splitListingFee` — fee = max(fee floor, 10% of price). Providers move money; signed policy decides how much goes where. See [Signatures](/protocol/signatures).
