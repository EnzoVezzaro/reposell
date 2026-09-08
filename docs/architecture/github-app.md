# GitHub Identity & Delivery — Architecture

## Overview

Buyer identity on the official RepoSell flow is handled by **WorkOS AuthKit**
(hosted GitHub OAuth), not by a raw GitHub App OAuth in the browser. The
purchase flow lives entirely in the static listing frontend and each seller's
`/sell` storefront; the only server-side piece is the Cloudflare Worker at
`access.reposell.dev`, which exchanges the AuthKit code, stores a session, and
verifies RepoSell's discovery contribution. Fork delivery is **manual**: after
payment the buyer forks the seller's repo on GitHub.

## Identity provider (WorkOS AuthKit)

Sales products to RepoSell are configured per-environment:

```
Test (WORKOS_CLIENT_ID / WORKOS_API_KEY that must match):
  client_id: client_01M1YMB9FT96Z7D4H06ACT1ENA
  api_key:   sk_test_…   (WorkOS test-mode API key)
Prod:
  client_id: client_01M1YMB9WVA7QDDESCVR3NZPN0
  api_key:   sk_…   (WorkOS production API key)
```

The API keys live only in the gitignored `functions/access/.env.worker.*`
files and Cloudflare Worker secrets — never in the repository.

Callback: `https://access.reposell.dev/api/auth/callback` (register in the
WorkOS dashboard). Never mix a test client id with a prod key.

### Flow

```
Listing /sell storefront
    │  GET /api/auth/login?redirect_uri=<page>   (PKCE; state in KV)
    ▼
access.reposell.dev ──► WorkOS /user_management/authorize
                              ▼
                        GitHub consent (email + GitHub handle)
                              ▼
   User returns to /api/auth/callback  (code exchange → JWT)
        │ Set-Cookie: reposell_workos_session (HttpOnly, SameSite=None, Secure)
        ▼
   302 → original page, now signed in
```

The session JWT is verified per-request against WorkOS's JWKS (RS256, cached
in KV). The worker also extracts the buyer's GitHub handle for the flow.

## The RepoSell GitHub App (audit feature only)

The GitHub App below is **no longer used for purchase/fork**. It remains the
credential mechanism for the repo-audit checker feature on the docs site
(`HomeAudit.vue` + `functions/github-auth/worker.js`).

```
App:       reposell (https://github.com/apps/reposell)
Owner:     @EnzoVezzaro
App ID:    4728638
Client ID: Iv23lidhennqrdpdFUAT
```

Permissions (read-only): profile, email addresses, repository metadata/contents.

## Delivery (manual fork)

Payment → fork is a manual, seller-controlled action; there is no server-side
auto-fork. Buyers never hand a personal-access token to the browser.

```
Buyer pays (Stripe Payment Link on listing or /sell)
    │
    ▼
Buyer signed in via WorkOS → storefront confirms (server-verified) contribution
    │
    ▼
"Fork {owner}/{repo} on GitHub ↗"  →  github.com/{owner}/{repo}/fork
    │
    ├─ public repo: fork immediately
    └─ private repo: seller grants the buyer read access first, then buyer forks
```

Per-repo behavior: sellers set `listing.private: true` (and optionally
`listing.access`) in `reposell.yml`; the `/sell` storefront then shows the
private-repo fork note. The storefront defaults to the official
`https://access.reposell.dev` backend.

## Security model

1. **Fork after payment, never before** — the storefront only shows the fork
   action once the worker confirms the buyer has paid.
2. **Client secrets never in the browser** — the AuthKit code exchange and all
   secrets live only in the `access.reposell.dev` Worker.
3. **No buyer tokens in the browser** — GitHub access for delivery is manual
   (owner-granted on GitHub), so nothing to steal client-side.
4. **Key separation** — the worker holds only RepoSell's own Stripe key, never a
   seller's `/sell` Stripe key.
5. **Per-origin allowlist** — cross-origin calls to the worker require the
   seller's `/sell` origin in `ALLOWED_ORIGINS`; register each seller's origin.

## Serverless worker — exchange/verify (reference)

```typescript
// access.reposell.dev (functions/access worker)
const res = await fetch('https://api.workos.com/user_management/authenticate', {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.WORKOS_API_KEY}` },
  body: JSON.stringify({ client_id: env.WORKOS_CLIENT_ID, code }),
});
// verify returned JWT with WorkOS JWKS; set session cookie; redirect.
```