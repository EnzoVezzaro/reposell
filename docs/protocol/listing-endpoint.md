---
title: Listing & listing endpoints
---

# The `/reposell/listing/` Endpoint

Optional. The repository operates perfectly without it.

If the repository owner enables listing functionality, CI generates:

```text
/reposell/listing/
└── index.html
```

alongside a machine-readable configuration document:

```json
{
  "schema": "reposell/listing/v1",

  "enabled": true,

  "repository": "EnzoVezzaro/example-project",

  "listing": {
    "url": "https://...",
    "provider": "reposell"
  }
}
```

## Terminology: three separate concepts

The repository's commercial publication is called **Listing**. Keep the three apart:

| Concept | Meaning |
| --- | --- |
| **RepoSell Listing** | The repository's own listing configuration |
| **RepoSell Official Listing** | The official listing operated by RepoSell |
| **RepoSell Public Listing** | A community-operated listing implementation |

## Discovery

The official RepoSell Listing discovers repositories through:

```text
/reposell/manifest.json
```

- The repository does not transfer ownership.
- The listing stores only the necessary metadata.
- **The repository remains authoritative.**

## Authority separation

The repository is authoritative for:

```text
Product · Release · Price · Payment Link · License · Integrity · Health
```

A listing is authoritative only for:

```text
Discovery · Presentation · Listing commission · Listing metadata
```

This separation is deliberate and load-bearing: no listing can silently change what a repository sells, for how much, or under which license.

## Public listings — the federation model

The relationship is **not** seller → community listing directly. The **official Reposell Listing is the central listing/registry**, and community Listings federate with it:

```text
                         ┌─────────────────────────┐
                         │    SELLER REPOSITORY    │
                         │ /reposell/manifest.json │
                         │ /reposell/health        │
                         │ /reposell/sell          │
                         └────────────┬────────────┘
                                      │ publish
                                      ▼
                    ┌───────────────────────────────┐
                    │     REPOSELL LISTING OFFICIAL │
                    │ • Product registry (canonical)│
                    │ • Discovery                   │
                    │ • Verification                │
                    │ • Pricing                     │
                    │ • Release validation          │
                    │ • Settlement                  │
                    └───────────────┬───────────────┘
                                    │ verified federation
                                    ▼
                    ┌───────────────────────────────┐
                    │   REPOSELL LISTING COMMUNITY  │
                    │ • Local catalog               │
                    │ • Local discovery & UI        │
                    │ • Federated with official     │
                    └───────────────────────────────┘
```

A community Listing does **not** register products directly with itself as an independent authority. It registers **itself** with the official Listing:

```text
Community Listing
       │  "I want to become a Reposell Listing"
       ▼
Official Reposell Listing
       ├── verify listing identity
       ├── verify domain
       ├── verify software/protocol
       ├── verify configuration
       ├── establish trust
       └── authorize federation
```

Once approved, the community instance pulls its catalog from the official registry — a **federated view**, never an independent indexer bypassing the official listing.

### The canonical listing record

The official Listing's record for each product is authoritative:

```json
{
  "product": "...",
  "repository": "...",
  "release": "1.4.0",
  "sell": "https://.../reposell/sell",
  "health": "https://.../reposell/health",
  "manifest": "https://.../reposell/manifest.json",
  "price": { "amount": 5000, "currency": "USD" }
}
```

### The most important rule: the seller only knows `/sell`

Sellers do not need to know which listings display them, which community listings exist, or how federation works. They publish once to their own repository; the official Listing becomes the canonical discovery layer; community listings become federated views of it.

## Revenue model — contributions, not checkout fees

::: warning Superseded: checkout-fee splitting
Earlier drafts described a checkout-time fee split ($5 fee taken at purchase, divided 50/50 between official and community listings). **That model is superseded.** The seller keeps 100% of their `/sell` price — there is no cut at checkout.
:::

Instead, the seller declares a voluntary **Listing contribution** when opting in, and the Listing CI creates a separate Reposell Stripe Payment Link for it:

```text
Seller /sell  →  seller's Stripe    → 100% of price → seller
Contribution  →  Reposell's Stripe  → declared amount → Reposell
```

- Every release gets its own **immutable** contribution Payment Link (never deleted/replaced/reused)
- Contribution changes apply to future releases only
- Community referral economics derive from the contribution system, not from checkout splits

Full specification: [Contributions & Payment Links](./contributions).

## Verification duty

Before accepting listing pricing or configuration, any party must:

```text
Fetch configuration
        ↓
Fetch signature
        ↓
Verify signature
        ↓
Validate schema
        ↓
Validate expiration/version
        ↓
Accept configuration
```

Invalid signature → **BLOCKED**. There is no fallback percentage, no offline mode for money.
