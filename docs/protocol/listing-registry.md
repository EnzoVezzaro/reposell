---
title: Listing registry
---

# The Listing Registry — PR-Based Publication

The official listing repository **is the registry**. Product publication happens through pull requests and CI verification — not through an API.

This model fits Reposell especially well because the repository owner and the listing contributor are different people.

## Recommended flow

```text
REPOSITORY OWNER                LISTING OWNER / CONTRIBUTOR
GitHub Account A                GitHub Account B
      │ owns                           │ opens PR
      ▼                                ▼
  /sell endpoint    ──────►  ┌──────────────────────────────┐
                             │ REPOSELL LISTING REPOSITORY  │
                             │                              │
                             │ listings/                    │
                             │   package-name.json          │
                             └──────────────┬───────────────┘
                                            │ GitHub Actions
                                            ▼
                                     AUTOMATED VERIFICATION
                                       │              │
                                     PASS           FAIL
                                       ▼              ▼
                                 Auto-merge         Block PR
                                       │
                                       ▼
                               Published Listing
```

## The PR contains only the reference

```json
{
  "schema": "reposell-listing/v1",
  "sell": "https://alice.github.io/cool-package/sell"
}
```

The contributor does **not** provide price or product data manually. CI gets the authoritative information from `/sell` itself:

```text
PR
 │
 ▼
GET /sell/manifest.json
 │
 ├── repository        ├── price
 ├── release           ├── currency
 ├── version           ├── payment_link
 └── signature         └── health endpoint
```

## CI verification pipeline

```text
1. Validate PR schema
        ↓
2. Fetch /sell
3. Fetch manifest
4. Verify HTTPS
5. Verify GitHub repository
6. Verify release exists
7. Verify release ↔ manifest
8. Verify cryptographic signature
9. Verify listing authorization
10. Verify payment link
11. /health check
12. Validate manifest schema
13. PASS → auto-merge · listing becomes official
```

Any failure → **Block PR**, with the reason visible in CI output.

## Why this solves the identity problem

Suppose Alice (`alice/project`) owns the software and Bob wants to add it to the listing. Bob opens *PR #142: "Add alice/project"*.

Bob **cannot fake Alice's product information**, because CI never trusts the PR. It fetches `https://alice.github.io/project/sell` and verifies Alice's cryptographic authorization:

```text
Bob's PR
   │ proposes
   ▼
Alice's /sell
   │ proves ownership + authorization
   ▼
CI
   ▼
Official listing
```

GitHub-native authentication, a completely auditable publication history, zero seller-side servers, automated verification, easy moderation, almost no maintenance.

## Updates become automatic

When Alice releases `v1.5.0`, her `/sell` changes automatically — no new PR needed. A scheduled GitHub Action periodically re-verifies every existing listing:

```text
Existing listing
      ↓
GET /sell
      ↓
New release? · Manifest changed?
Payment link changed? · Health?
      ↓
Update listing index
```

Security split:

- **New repositories/products → require a PR**
- **Updates to already-authorized listings → automated**

## Final architecture

```text
                    SELLER
                      │
                      ▼
             ┌─────────────────┐
             │ GitHub Repo     │
             │ /sell · manifest│
             │ health          │
             └────────┬────────┘
                      │ public
                      ▼
             ┌─────────────────┐
             │ PR to           │
             │ Listing Repo    │
             └────────┬────────┘
                      ▼
                GitHub CI
          verification × N
                      ▼
                AUTO MERGE
                      ▼
             REPOSELL LISTING
                      │ BUY
                      ▼
                seller /sell
                      ▼
              seller's Stripe
```

::: tip Two registrations, two mechanisms — don't confuse them
- **Products** enter the registry through **PRs** (this page).
- **Community listing instances** register as federation operators with the official listing (see [The Listing Network](./listing-network)) — that handshake remains a verified federation flow, not a product PR.
:::

## The canonical deployment: `listing.reposell.dev`

The official listing lives at:

```text
https://listing.reposell.dev
```

It is a **static generated index** over every verified listing:

```text
                         listing.reposell.dev
                         OFFICIAL REPOSELL LISTING
                                  │
                         static generated index
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
          Project A            Project B            Project C
           /sell · /health      /sell · /health      /sell · /health
              │                   │                   │
              ▼                   ▼                   ▼
        Owner's GitHub       Owner's GitHub       Owner's GitHub
             Pages                Pages                Pages
```

### Publication flow

```text
Developer
   │  reposell publish
   ▼
GitHub PR → listing.reposell.dev repository
   │
   │ CI
   ├── verify repository ownership
   ├── verify manifest
   ├── verify signature
   ├── verify release
   ├── verify /sell
   ├── verify payment link
   └── verify /health
          │
          ├── FAIL → PR BLOCKED
          └── PASS → merge
                      │
                      ▼
             Generate Listing JSON
                      │
                      ▼
             listing.reposell.dev
```

### Runtime

Visitors read the generated listing data from `listing.reposell.dev`. When they open a product page (`listing.reposell.dev/foo`), the frontend **additionally performs a live request directly to the owner's `/health` endpoint**:

```text
Listing JSON                     (generated by CI)
    │  product metadata · repository · release · /sell
    │  payment information · last CI verification
    ▼
Frontend
    └────► live GET /health   ← repo owner's GitHub Pages
```

So every product page shows both facts side by side:

| Source | Knows |
| --- | --- |
| Listing JSON | what CI verified, and when |
| Live `/health` | whether it is *still* true right now |

### The principle

> **`listing.reposell.dev` discovers and verifies products; it does not host or sell the products.**

The actual `/sell` endpoint remains entirely under the repository owner's control.

## Why PR-based beats an API

| | PR + CI registry | API registration |
| --- | --- | --- |
| Authentication | GitHub-native | Custom accounts/tokens |
| Audit trail | Full git history | Application logs |
| Seller infrastructure | None | None |
| Moderation | Close/reject PRs | Admin tooling |
| Maintenance | ~zero for developers | Service uptime |


## Implementation status (2026-08-23)

The two-transaction invariant — **Listing charges only for discovery; the
seller's /sell is fully independent** — is encoded in the CLI today:

- `reposell listing publish <tag>` builds the `reposell-listing/v1` PR
  payload (`.reposell/listing-pr.json`), validates it fail-closed, and
  health-checks the live `/sell` (repository identity, release catalog,
  seller Payment Link — metadata-level, never just HTTP 200).
- Discovery-link metadata (`purpose: "discovery"`, per-release deterministic
  idempotency keys) is generated by `src/domain/listing/discovery.ts`; the
  input type has no seller fields, so a seller price or link structurally
  cannot leak into a discovery transaction.

Still open (tracked in the workspace tracker): the Listing CI workflows that
create the Listing's own Stripe objects (D16), the public listing frontend,
and buyer-side fork provisioning (`reposell sell sync`, D7).
