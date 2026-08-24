---
title: reposell release
description: Declare a release — price, currency and Stripe Payment Link, with interactive fallback.
---

# reposell release

Declare a release and its commercial terms. Flags first, interactive prompts as fallback; the result is written to `reposell.yml` as a **draft** and the publication gates are reported immediately.

```bash
reposell release <tag> [--price N] [--currency USD] [--link URL] [--link-id plink_…]
```

## Arguments & flags

| Argument / flag | Description |
|-----------------|-------------|
| `<tag>` | Release tag, e.g. `v1.4.0` (required) |
| `--price N` | One-time price for this release |
| `--currency USD` | ISO currency code (stored uppercase) |
| `--link URL` | Stripe Payment Link (`https://buy.stripe.com/…`) |
| `--link-id plink_…` | Stripe Payment Link id — enables deep verification against the Stripe API |

Omitted values are prompted for interactively.

## What it does

1. Creates `reposell.yml` from defaults if the repository is not initialized yet.
2. Writes the release definition as a **draft** under `releases.definitions.<tag>`:

   ```yaml
   releases:
     mode: manual
     definitions:
       v1.4.0:
         status: draft
         pricing:
           amount: 50
           currency: USD
         payment:
           provider: stripe
           payment_link: https://buy.stripe.com/…
   ```

3. Evaluates the repository and prints which publication gates still fail — a draft never reaches the public surface until every gate passes.

## Example

```bash
$ reposell release v1.4.0 --price 50 --currency USD --link https://buy.stripe.com/test_xxx
✓ Release v1.4.0 declared (draft)
  ✗ GitHub release v1.4.0 not found — create it with `gh release create v1.4.0`
  ✗ Payment Link not deep-verified (add --link-id to verify amount/currency via Stripe API)
  ✓ Manifest schema valid
Run `reposell validate` for the full gate report.
```

## Pricing is per-release

There is no global product price. Each release carries its own immutable commercial configuration — `v1.0.0` at $10 stays $10 after `v2.0.0` ships at $50. See [Release Model](/protocol/release-model).

## Related

- [`reposell publish`](/commands/)
- [`reposell validate`](/commands/)
- [Payment Setup (Stripe)](/guide/payment-setup)
