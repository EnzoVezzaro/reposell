---
title: Manifest schema
---

# Manifest Schema

## `/reposell/manifest.json`

The canonical machine-readable RepoSell document. It allows:

- RepoSell Listing to discover the repository
- RepoSell CLI to validate the repository
- Public listings to discover the product
- Agents to understand the product
- CI to validate configuration
- Users to inspect release and pricing information

```json
{
  "schema": "reposell/manifest/v1",

  "repository": {
    "provider": "github",
    "owner": "EnzoVezzaro",
    "name": "example-project",
    "url": "https://github.com/EnzoVezzaro/example-project"
  },

  "product": {
    "name": "Example Project",
    "description": "Example software product"
  },

  "releases": {
    "mode": "manual",
    "index": "/reposell/releases/index.json"
  },

  "sell": {
    "enabled": true,
    "url": "/reposell/sell/"
  },

  "listing": {
    "enabled": true,
    "url": "/reposell/listing/"
  },

  "health": {
    "url": "/reposell/health.json"
  },

  "protocol": {
    "version": "1.0"
  }
}
```

The path `/reposell/manifest.json` must be stable across the lifetime of the repository.

## Release manifest

Each release has its own **immutable commercial configuration**:

```json
{
  "schema": "reposell/release/v1",

  "repository": "EnzoVezzaro/example-project",

  "release": {
    "version": "v1.4.0",
    "tag": "v1.4.0"
  },

  "pricing": {
    "type": "paid",
    "amount": 50,
    "currency": "USD"
  },

  "payment": {
    "provider": "stripe",
    "payment_link": "https://buy.stripe.com/..."
  },

  "license": {
    "type": "reposell"
  }
}
```

### Free releases

A free release declares `type: "free"` and needs **no Stripe link at all**:

```json
{
  "pricing": { "type": "free" }
}
```

The publication gate skips payment verification entirely — the release ships as a repository fork — clone it, fork it, own it. Paid releases declare `type: "paid"` with amount + currency + a verified Payment Link. This lets the listing represent free, paid and donation-supported projects without forcing Stripe into every release.

### The release determines the price

There is no global product price. Each release declares its own:

```text
v1.0.0 → $10
v1.1.0 → $15
v1.2.0 → $25
v2.0.0 → $50
```

Older releases stay purchasable at their historical prices — a release's commercial identity is frozen at publication.

## Releases index

`/reposell/releases/index.json` is the catalog every release registers itself in:

```json
{
  "schema": "reposell/releases/v1",

  "releases": [
    { "version": "v1.4.0", "price": 50, "currency": "USD", "status": "available", "health": "healthy" },
    { "version": "v1.3.0", "price": 35, "currency": "USD", "status": "available", "health": "healthy" },
    { "version": "v1.2.0", "price": 25, "currency": "USD", "status": "blocked",  "health": "unhealthy" }
  ]
}
```

Statuses map one-to-one onto the [release state model](./release-model).

## Configuration source

The developer maintains release configuration in `reposell.yml`:

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

CI transforms this into the generated manifests — the YAML is the human-editable source of truth, the JSON under `/reposell/*` is the wire contract.


## Release offers (licensing schemes)

Each release manifest carries the offers that were live for that release —
the immutable record of which license schemes, at which prices, pointing at
which verified Payment Links (spec §19):

```json
{
  "schema": "reposell/release/v1",
  "pricing": { "amount": 29, "currency": "USD" },
  "payment": { "provider": "stripe", "payment_link": "https://buy.stripe.com/..." },
  "offers": [
    {
      "scheme": "standard",
      "name": "Standard",
      "billing": "one-time",
      "pricing": { "amount": 29, "currency": "USD" },
      "payment": { "provider": "stripe", "payment_link": "https://buy.stripe.com/..." }
    },
    {
      "scheme": "pro-monthly",
      "name": "Pro",
      "billing": "recurring",
      "interval": "month",
      "pricing": { "amount": 9, "currency": "USD" },
      "payment": { "provider": "stripe", "payment_link": "https://buy.stripe.com/..." }
    }
  ],
  "license": {
    "type": "reposell",
    "policy_hash": "9f2c…64"
  }
}
```

`license.policy_hash` is the sha256 of the canonical `.reposell/license.json`
composed by `reposell license compose` — signature coverage extends to the
license policy automatically.
