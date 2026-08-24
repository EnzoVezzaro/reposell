---
title: /sell endpoint
---

# The `/reposell/sell/` Endpoint

The direct seller interface. It belongs entirely to the repository owner.

```text
https://owner.github.io/project/reposell/sell/
```

## What it does

The page is fully static. It reads:

```text
/reposell/manifest.json
/reposell/releases/index.json
```

and presents the available releases with real prices and health states:

```text
Example Project

v1.4.0   $50 USD   ✓ healthy    [Buy]
v1.3.0   $35 USD   ✓ healthy    [Buy]
v1.2.0   free      ✓ healthy    [Fork]
v1.1.0   $25 USD   ✗ blocked    —
```

Paid releases render a **[Buy]** CTA to their verified Payment Link. Free releases (`pricing.type: "free"`) render **[Fork]** pointing at the repository release — no Stripe involved. Blocked releases are never purchasable from this page — no exceptions.

## Direct sale flow

```text
Buyer
  │
  ▼
/reposell/sell/
  │
  ▼
Select release
  │
  ▼
Verified Stripe Payment Link
  │
  ▼
Stripe Checkout
```

RepoSell does not process the payment. Card data goes straight to Stripe; the repository's Pages site never touches it.

## Stripe integration model

RepoSell does not operate a Stripe server. The developer creates their own Stripe Payment Link, and RepoSell receives that link as configuration (see [Manifest schema](./manifest-schema#configuration-source)).

## Payment link validation

A release cannot be published without a Payment Link:

```text
Payment Link missing → BLOCKED
```

CI validates before publishing:

```text
✓ HTTPS
✓ Stripe domain
✓ Expected provider
✓ Expected amount
✓ Expected currency
✓ Expected product/release metadata where available
```

If verification cannot establish the relationship between link and release: **BLOCKED**. It never guesses.

## Price authority

The release manifest is the RepoSell commercial declaration. Stripe is the payment execution authority. Therefore RepoSell must ensure:

```text
Manifest price == Stripe checkout price
```

If they differ: **BLOCKED**.

## UI requirements

The generated page should feel like a product page, not documentation:

- shadcn/ui primitives, subtle motion, animated hero
- Release cards and pricing cards per version
- Health indicators per release
- License information and repository identity
- One clear checkout CTA per available release

## Agent knowledge UI

Every generated page exposes structured information alongside the visual UI:

```text
HTML
   ├── Human UI
   └── Structured metadata
          ├── JSON-LD
          ├── manifest.json
          └── release metadata
```

Agents should be able to answer — without scraping visuals:

```text
What is this? · Which repository? · Which release?
How much? · Which license? · Is it healthy?
Can it be purchased? · Where is checkout?
```


## Offers (multi-license releases)

When a release declares multiple license schemes, the sell page renders one
purchase row **per offer** — each with the scheme name, billing cadence
(`one-time`, `per-month`/`per-year`), seat count and its own verified Buy
link. Blocked releases never render offer rows. The embedded
`reposell/sell-page/v1` JSON and the JSON-LD `Offer` list include every offer,
so agents and listing CI see the same commercial facts humans do.
