---
title: Adding Payment Providers
description: How payment provider support works and what a new provider must implement.
---

# Adding a Payment Provider

## Current State

Payment logic lives in `src/domain/payment/`:

| File | Role |
|------|------|
| `stripe.ts` | `StripePaymentProvider` — key validation, account verification via the Stripe API |
| `link.ts` | Structural Payment Link validation (spec §34) — pure URL checks |
| `stripe-links.ts` | Deep link verification against the Stripe API (spec §7, §35) — amount/currency match |

There is no shared `PaymentProvider` interface file today. Providers are structural: any class consumed by the app layer must expose the same surface as `StripePaymentProvider`.

## The Contract to Implement

From `src/domain/payment/stripe.ts`, the shape callers rely on:

```ts
export class StripePaymentProvider {
  readonly name = 'stripe';

  constructor(apiKey: string, doFetch: FetchLike = DEFAULT_FETCH) { /* … */ }

  static fromEnv(
    env: Record<string, string | undefined>,
    doFetch?: FetchLike,
  ): StripePaymentProvider { /* … */ }

  async verifyAccount(): Promise<PaymentAccountStatus> { /* … */ }
}
```

A new provider in `src/domain/payment/<name>.ts` must:

1. Expose a `readonly name` discriminator.
2. Accept the API key in the constructor and validate its shape immediately, throwing a typed error with a `readonly code` (`StripeKeyInvalidError`, `StripeKeyMissingError` are the models).
3. Provide `static fromEnv(env, doFetch?)` that reads its own environment variables and throws `…KeyMissingError` when absent.
4. Implement `verifyAccount(): Promise<PaymentAccountStatus>`-compatible status reporting (`connected`, mode, capability flags).
5. Take an injectable fetch (`FetchLike`) defaulting to global `fetch`. Never call network directly in tests.

## Validation Rules

### Structural link validation (`link.ts`)

Applies to every release regardless of provider:

- Missing or blank URL → `PaymentLinkMissingError`.
- Unparseable URL → `PaymentLinkInvalidError('not a valid URL')`.
- Non-HTTPS → `PaymentLinkInvalidError('must use HTTPS')`.
- Host not on the allowlist → `PaymentLinkInvalidError('host "…" is not a Stripe domain')`. The allowlist is `buy.stripe.com`, `checkout.stripe.com`, plus any `.stripe.com` subdomain (`STRIPE_LINK_HOSTS` / `isStripeLinkHost`).

A non-Stripe provider needs its own host allowlist added here — `validatePaymentLink` is currently Stripe-specific by design ("The system never guesses").

### Deep verification (`stripe-links.ts`)

`verifyPaymentLinkAgainstPricing({ apiKey, paymentLinkId, pricing, fetchImpl? })` checks the live link against declared pricing:

| Condition | Result |
|-----------|--------|
| No `payment_link_id` configured | `unverifiable` (structural checks still apply) |
| HTTP 404 | `not_found` |
| `active === false` | `inactive` |
| `unit_amount !== Math.round(pricing.amount * 100)` | `mismatch` with detail showing both amounts |
| Currency differs case-insensitively from manifest | `mismatch` |
| All pass | `verified` |

Amount comparison is integer cents; currency comparison is lowercase on both sides. A new provider's deep check must reproduce these semantics for its own API.

## Where Providers Are Wired

- `src/app/listing-service.ts` — calls `StripePaymentProvider.fromEnv(…)` to report account status.
- `src/app/build-service.ts` — calls `verifyPaymentLinkAgainstPricing(…)` during evaluation.
- `src/index.ts` — public exports of the provider and helpers.
- Configuration selects a provider through the `payment.provider` field in `reposell.yml` (currently `'stripe'`; see `ReleaseDefinition` written by `releaseCommand`).

Adding a provider means touching each of these call sites behind a lookup by `provider.name` — keep the branching in the app layer, not in commands.

## Test Requirements

Model: `src/domain/payment/stripe.test.ts`. Required coverage:

1. **Key handling** — missing env throws the missing-key error; malformed prefixes throw the invalid-key error; precedence if multiple env vars apply.
2. **Request shape** — fake fetch captures URL and `Authorization` header; assert both.
3. **Response mapping** — documented payload maps field-by-field to your status type.
4. **Error mapping** — non-OK responses become your typed API error carrying the upstream message.
5. **Deep checks** (if applicable) — verified path plus every failure status above, especially cent-exact amount mismatch and currency mismatch.

Use injected fakes only; the anti-slop lint rules forbid module mocking (see [/development/testing](/development/testing)).

## Security Rules

- Only `sk_test_…` keys belong in local development or CI test runs. Live keys never enter the repo, logs, or fixtures.
- Key errors must echo at most a short prefix of the provided value (`api_key.slice(0, 6)` pattern), never the full secret.
