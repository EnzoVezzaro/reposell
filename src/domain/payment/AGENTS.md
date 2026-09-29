# src/domain/payment

## Purpose

Payment link validation and Stripe adapters behind the PaymentProvider abstraction.

## Ownership

Owner: src/domain/payment (inherits ../AGENTS.md)

## Responsibilities

- `link.ts` / `link-details.ts` — fail-closed Payment Link validation (HTTPS, host allowlist
  `buy.stripe.com`, amount/currency match against manifest).
- `stripe.ts` — Stripe REST adapter (payouts, balance, account status).
- `stripe-links.ts` — Stripe Payment Link helpers.

## Constraints

- Validation failure semantics are BLOCKED, never warn-and-continue.
- Live mode detected from `sk_live`/`rk_live` key prefixes; secrets never logged.
- Price authority: Stripe transaction is final; only immutable snapshots are recorded.
