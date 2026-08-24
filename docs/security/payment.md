---
title: Payment Security
description: Why card data never touches repos — Stripe Payment Links, structural and deep link verification, test/live scoping, and fail-closed pricing.
---

# Payment Security

reposell's payment architecture is designed so that **no card data, no checkout server, and no webhook secret is ever needed**. Buyers pay on Stripe-hosted pages; your repository only ever declares *what* to buy and proves that the declared price is the charged price.

## Checkout never touches your infrastructure

Every release must declare a Stripe Payment Link. The buyer's journey:

```text
listing page → buy.stripe.com/… (Stripe-hosted) → payment confirmed by Stripe
```

Consequences of this design:

- **Card data never reaches your repo, your Pages deployment, or any reposell component.** PCI scope stays entirely with Stripe.
- **No webhooks are required for checkout.** There is no listener to spoof, no signing secret to leak, no endpoint to DDoS.
- **No checkout secrets exist.** A public listing instance needs zero Stripe credentials to let people buy.
- Your Stripe secret key is used only for local tooling (`listing status`, `sell sync`) and optional deep link verification — see [Payments](/guide/payments/) for the dashboard walkthrough.

## Layer 1: structural link validation

Before a release can be published at all, its Payment Link passes structural validation. This runs unconditionally, without credentials:

| Rule | Enforcement |
| --- | --- |
| Link present | Missing link → `PAYMENT_LINK_MISSING` — a release cannot publish without one |
| Valid URL | Unparseable → `PAYMENT_LINK_INVALID` |
| HTTPS only | `http://` → `PAYMENT_LINK_INVALID` |
| Stripe domain only | Host must be `buy.stripe.com`, `checkout.stripe.com`, or another `*.stripe.com` subdomain |

The host check uses an allowlist plus a strict `.stripe.com` suffix match — `buy.stripe.com.evil.test` does not pass, because the suffix match is against the hostname boundary. Anything else fails with `host "…" is not a Stripe domain`.

## Layer 2: deep price verification

Structural checks prove the link points at Stripe. They do not prove what it charges. That is the deep check, which queries the Stripe API directly:

```text
GET /v1/payment_links/<id>?expand[]=line_items.data.price
```

and compares the live Payment Link against the release's declared pricing:

- The link must be `active`. An inactive link reports `inactive`.
- The first line item's `unit_amount` must equal the declared amount in cents (`Math.round(amount × 100)`). Any drift reports `mismatch` with both numbers in the detail — e.g. *"Stripe charges 25.00 but manifest declares 20.00"*.
- The currency is compared case-insensitively; a mismatch names both currencies.
- A missing line item or amount is a `mismatch`, not a pass.

Possible outcomes: `verified`, `mismatch`, `inactive`, `not_found`, `api_error`, or `unverifiable`.

**Honest limitation:** the deep check runs only when both the Payment Link ID (`plink_…`) and a Stripe secret key are configured. Without credentials the outcome is `unverifiable` — the system never pretends a link was verified when it wasn't, and structural validation still applies.

## Test vs live mode scoping

Mode is derived from the key itself, not from configuration you could forget:

- Keys matching `sk_test_…` / `rk_test_…` are **test**; keys containing `_live_` are **live**. Anything not shaped like a Stripe secret key is rejected outright (`STRIPE_KEY_INVALID`) before any request is made.
- `verifyAccount()` cross-checks reality via `GET /v1/account`: the reported `livemode` flag comes from Stripe, alongside `charges_enabled` and `payouts_enabled`, so a test key pretending to be production is visible immediately in `reposell listing status`.
- Test-mode links charge nothing; live-mode links settle real money. Because the key prefix and the link live in the same Stripe account, a test-mode session cannot verify or operate on live Payment Links.

Use different keys per environment and keep `sk_live_…` out of everything except the secret store where it belongs — see [Secret Management](/security/secrets).

## Prices come from signed policy, not guesswork

Listing economics (fee floor, listing shares) live in a separately signed pricing document, verified through the full chain from [Cryptographic Security](/security/crypto):

```text
fetch envelope → validate schema → verify Ed25519 signature
  against pinned official key → check valid_until expiration → accept
```

Any stage fails → **BLOCKED**. Listing instances never fall back to hardcoded percentages, so a fee that cannot be proven is a fee that does not happen. You can run this chain yourself:

```bash
REPOSELL_OFFICIAL_VERIFY_KEY=<base64 public key> reposell verify pricing <endpoint-url>
```

## What an attacker would have to do

| Attack | Outcome |
| --- | --- |
| Swap a Payment Link to a lookalike host | Blocked — non-Stripe host rejected structurally |
| Point the manifest at someone else's link | Deep check mismatches amount/currency → flagged, not silently accepted |
| Re-price a published release after signing | Manifest hash changes → Ed25519 signature breaks ([Cryptographic Security](/security/crypto)) |
| Deactivate the link post-publication | Detected as `inactive` on next deep verification |
| Forge listing fees | Requires the official private key; instances fail closed to safe state instead |

For reporting vulnerabilities in this chain, see [Incident Response](/security/incident-response).
