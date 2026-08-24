---
title: Contributions & payment links
---

# Listing Contributions & Immutable Payment Links

There are **two completely independent payment flows** — and one iron rule about Stripe links.

```text
A) SELLER /sell                    B) LISTING CONTRIBUTION
seller's own Stripe account        Reposell's Stripe account
seller-created Payment Link        Listing-CI-generated Payment Link
100% of sale → seller              voluntary amount → Reposell
```

The Listing does not sell or own anyone's software — it is the discovery/catalogue layer. If the seller opts into publication, they declare a **contribution** they want to give Reposell, and the Listing CI creates a separate Stripe Payment Link for it.

## The fundamental rule

**Every release published to the listing has its own immutable Listing Payment Link.**

Payment links must NEVER be:

- deleted because a new release appears
- replaced or reused for another release
- modified to represent another release
- deactivated merely because a newer release exists

```text
v1.0.0   $40 · contribution $5  · Link A ─┐
v1.1.0   $50 · contribution $10 · Link B ├─ ALL remain valid & purchasable
v1.2.0   $50 · contribution $10 · Link C ─┘
```

Old releases remain purchasable forever. Do not dynamically construct payment URLs — always use the generated verified link from the release record.

## Releases are immutable commercial records

A published release records — and never mutates:

```text
repository identity · release identity/version/tag/commit
seller price + currency · seller /sell URL
Listing contribution amount + currency
Listing Stripe Payment Link · payment provider
publication timestamp · manifest hash · signature · verification state
```

If the seller changes price or contribution, that applies to a **new** release/publication event. Historical releases are never rewritten:

```text
v1.0.0 → contribution $5     stays $5 forever
v1.1.0 → contribution $10    new link, new record
```

Resubmitting the same release with a different contribution does NOT silently mutate the record — an explicit new revision policy applies.

## Seller manifest

The manifest carries both values independently:

```json
{
  "schema": "reposell.manifest",
  "schema_version": "1.0",
  "repository": { "provider": "github", "owner": "owner", "name": "project" },
  "release": { "version": "1.2.0", "tag": "v1.2.0", "commit": "..." },
  "pricing": {
    "seller":   { "amount": 50, "currency": "USD" },
    "listing": {
      "enabled": true,
      "contribution": { "amount": 10, "currency": "USD" }
    }
  },
  "payment": {
    "seller": { "provider": "stripe", "payment_link": "https://buy.stripe.com/..." }
  },
  "endpoints": { "sell": "...", "health": "..." }
}
```

## CLI workflow

```bash
reposell payment setup      # configure your own Stripe Payment Link
reposell payment verify     # validate it against the release
```

`payment verify` checks: valid Stripe link URL · reachable · active · product exists · currency matches · **amount matches the release price** · repository/release identifiable where available. Failure → BLOCKED with actionable errors. The seller never gives Reposell their Stripe secret key.

```bash
reposell listing enable     # asks: "Contribution to Reposell? [$5]"
                            # options: $5/$10/$25/$50/custom — written to manifest
reposell listing publish    # creates the publication PR
```

## Listing CI — where automation gets good

```text
PR opened
  ↓ validate identity · manifest · signature · release
  ↓ validate seller /sell · seller Stripe link · /health
  ↓ read Listing contribution
  ↓ CREATE Reposell Stripe Product + Price + Payment Link
  ↓ verify the created link
  ↓ generate release record → commit to PR
merge → live on listing.reposell.dev
```

The generated release record embeds full provenance:

```json
{
  "release": { "version": "1.2.0", "price": { "amount": 50, "currency": "USD" } },
  "listing": {
    "contribution": { "amount": 10, "currency": "USD" },
    "payment": {
      "provider": "stripe",
      "payment_link": "https://buy.stripe.com/...",
      "stripe_product_id": "...",
      "stripe_price_id": "...",
      "created_at": "..."
    }
  }
}
```

### Idempotency is mandatory

CI reruns, network retries and duplicate workflow executions must NOT create duplicate Stripe objects. Before creating, CI searches by deterministic identifiers (repository · release · manifest hash · contribution · publication ID) and resolves to the existing commercial record when found. Same release ⇒ same Listing payment record, always.

### Key isolation

`REPOSELL_STRIPE_SECRET_KEY` lives **only** in the official Listing repository's GitHub Actions secrets. Never exposed to seller repositories, seller CI, PR logs, generated JSON, browser code, or Git. No Reposell backend exists — Actions talks to Stripe directly.

## Health is dynamic — links are not

CI checks `/health` during publication; the frontend may check at runtime. But health status **never** touches historical payment links: a project going temporarily unhealthy must not delete its Listing Payment Link.

## Static data structure

```text
listing/
  repositories/
    owner/
      project/
        manifest.json
        releases/
          v1.0.0.json
          v1.1.0.json
          v1.2.0.json
```

Each release JSON contains its own identity, price, seller link, contribution, Listing Payment Link, verification metadata and signature/hash. The frontend consumes static files — no runtime Reposell API.

## Frontend distinction

Make the two options visually obvious:

```text
BUY FROM SELLER            → seller's /sell (their Stripe)
SUPPORT REPOSELL / BUY
THROUGH LISTING            → Listing contribution Payment Link
```

Never imply that Reposell owns or sells the software.

## Community listings

Same protocol: community listings verify independently against signed manifests, are directories only, and must never modify seller prices/release identities/seller links, replace official payment links, impersonate the official listing, or create official Reposell payment links.

## Auditability

Every publication reconstructs from Git history: who submitted, which repository/release, declared price + contribution, generated link, creation timestamp, verified manifest hash + signature, and which CI checks passed. The PR itself is part of the audit trail.

## Free releases and contributions

Pricing type is independent of listing participation:

- `pricing.type: "free"` → no seller Payment Link, no payment verification. The release ships as direct access.
- A free project can still declare a Listing **contribution** (donation-style support for the protocol) — the Listing CI creates that contribution link exactly as it would for paid releases.
- Paid releases always carry the seller Payment Link, verified against amount + currency before publication.

## In one sentence

**The seller owns and creates their `/sell` Stripe link; if they opt into the official listing they declare a contribution amount, and the Listing's CI automatically creates the separate Reposell Stripe Payment Link during the publication PR — one immutable link per release, forever.**
