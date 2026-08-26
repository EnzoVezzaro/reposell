# GitHub App Integration — Architecture

## Overview

Replace personal access token (PAT) flows with a **RepoSell GitHub App** that handles both repository checking and purchase/fork workflows. One authorization supports both surfaces.

## GitHub App Configuration

```
App:       reposell (https://github.com/apps/reposell)
Owner:     @EnzoVezzaro
App ID:    4728638
Client ID: Iv23lidhennqrdpdFUAT
```

### Permissions

**Account** (read-only):
- Profile
- Email addresses

**Repository** (read-only):
- Metadata
- Contents

**Repository** (for purchase/fork only):
- Administration (fork endpoint specific — minimum required)

## Architecture Layers

### Browser Layer (serverless)

No RepoSell server needed. The browser communicates directly with GitHub.

```
RepoSell browser
    │
    ├──────────────► GitHub API
    │               /user
    │               /user/repos
    │               /repos/:owner/:repo
    │
    └──────────────► Stripe (Payment Links)
```

**Responsibilities:**
- GitHub OAuth login
- Account identification
- Repository listing and selection
- Public/private repo verification
- Pre-purchase validation

### Trusted Fulfillment Layer

Payment → fork must NOT happen in the browser. The buyer controls the browser, so browser-reported payment is not trustworthy.

```
Stripe checkout completed
    │
    ▼
Purchase artifact (signed)
    │
    ▼
Trusted fulfillment (serverless function or GitHub Action)
    │
    ▼
GitHub App → Fork seller repo → buyer account
    │
    ▼
Purchase/license recorded
```

**Options for trusted fulfillment:**
1. **Stripe webhook → serverless function** (Cloudflare Worker, Vercel Edge Function)
2. **GitHub Action** triggered by a signed purchase artifact
3. **Stripe webhook → GitHub Action dispatch** (hybrid)

## OAuth Flow

### Authorization

```
GitHub App OAuth
    │
    ├─► User clicks "Connect GitHub"
    │
    ├─► Redirect to GitHub
    │   https://github.com/login/oauth/authorize
    │     ?client_id=Iv23lidhennqrdpdFUAT
    │     &scope=read:user user:email repo
    │     &redirect_uri=https://listing.reposell.dev/auth/callback
    │
    ├─► GitHub redirects back with code
    │
    ├─► Exchange code for access token
    │   POST https://github.com/login/oauth/access_token
    │     ?client_id=Iv23lidhennqrdpdFUAT
    │     &client_secret=<SECRET>
    │     &code=<CODE>
    │
    └─► Store token in session (httpOnly cookie or encrypted localStorage)
```

### Token Exchange — The Server Problem

GitHub OAuth requires a **client_secret** to exchange the authorization code for an access token. This secret MUST NOT be in browser code.

**Solution: Thin token exchange endpoint**

A minimal serverless function (or GitHub Pages edge function) that:
1. Receives the OAuth code
2. Exchanges it with GitHub using the client_secret
3. Returns the access token to the browser
4. Does NOT store the token server-side

```
Browser                    Token Exchange              GitHub
  │                            │                          │
  ├──── code ─────────────────►│                          │
  │                            ├──── code + secret ──────►│
  │                            │◄─── access_token ────────┤
  │◄─── access_token ──────────┤                          │
  │                            │                          │
```

This is ~20 lines of serverless code. The secret is ONLY in the serverless function, never in the browser.

### Shared Identity Across Domains

Both `reposell.dev` and `listing.reposell.dev` use the same GitHub App. The access token is stored client-side and shared:

```
reposell.dev                    listing.reposell.dev
    │                                │
    ├──── GitHub OAuth ─────────────►│
    │     (same client_id)           │
    │                                │
    └──► Same access token ◄─────────┘
         (stored in localStorage
          or shared cookie domain)
```

Since both sites are under `reposell.dev` (subdomains), a shared cookie or cross-origin localStorage approach works.

## Repository Picker

After GitHub authorization, query the user's repositories:

```typescript
interface GitHubRepo {
  owner: string;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}

// Fetch user's repos
const repos = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

The UI shows:

```
GitHub account
@enzovezzaro                              ✓

Repository
[ Search repositories... ]

┌─────────────────────────────────┐
│ reposell-example         public │
├─────────────────────────────────┤
│ private-project        private │
├─────────────────────────────────┤
│ another-project        private │
└─────────────────────────────────┘
```

## Purchase Flow

### For listing.reposell.dev

```
Open listing
    │
    ├── Is GitHub connected?
    │   ┌──┴──┐
    │  no    yes
    │  │      │
    │  ▼      ▼
    │ Login   continue
    │  │      │
    │  └──┬───┘
    │     ▼
    │  Select/confirm GitHub destination
    │     ↓
    │  Stripe payment
    │     ↓
    │  Trusted fulfillment
    │     ↓
    │  Fork seller repo → buyer GitHub
    │     ↓
    │  Purchase/license recorded
```

### For reposell.dev (repo checker)

```
Connect GitHub
    ↓
GitHub account (@enzovezzaro)
    ↓
Fetch accessible repos
    ↓
Repository selector
    ↓
Select repo
    ↓
Audit repository
```

## Security Model

1. **Fork after payment, never before**
   ```
   GitHub login
       ↓
   verify buyer identity
       ↓
   verify fork destination
       ↓
   Stripe checkout
       ↓
   payment confirmed (webhook)
       ↓
   fork
   ```

2. **Client secret never in browser** — only in the thin token exchange function

3. **Access token scoped** — minimal permissions, user can revoke

4. **Fork is a trusted action** — must happen server-side with the GitHub App's installation token, not the user's token

## Implementation Phases

### Phase 1: Browser Layer
- [ ] Token exchange serverless function
- [ ] GitHub OAuth login component
- [ ] Repository picker component
- [ ] Cross-domain identity sharing

### Phase 2: Purchase Integration
- [ ] Update listing purchase CTA with GitHub auth flow
- [ ] Update sell page with GitHub auth flow
- [ ] Stripe checkout with GitHub identity metadata

### Phase 3: Trusted Fulfillment
- [ ] Fulfillment serverless function (Stripe webhook → GitHub fork)
- [ ] Purchase artifact signing
- [ ] License generation and delivery

### Phase 4: Repository Checker
- [ ] Update reposell.dev repo audit UI
- [ ] Replace PAT flow with GitHub App flow
- [ ] Repository selector for audit

## Serverless Function — Token Exchange

Minimal Cloudflare Worker / Vercel Edge Function:

```typescript
// ~20 lines
export default async function handler(req: Request): Promise<Response> {
  const { code } = await req.json();

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: 'Iv23lidhennqrdpdFUAT',
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await res.json();
  return Response.json({ access_token: data.access_token });
}
```

## Serverless Function — Fulfillment

Triggered by Stripe webhook on `checkout.session.completed`:

```typescript
export default async function handler(req: Request): Promise<Response> {
  const event = await verifyStripeWebhook(req);

  const { seller_repo, buyer_github, release, scheme } = event.metadata;

  // Use GitHub App installation token to fork
  const installationToken = await getInstallationToken(seller_repo);
  const fork = await fetch(`https://api.github.com/repos/${seller_repo}/forks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${installationToken}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      name: seller_repo.split('/')[1],
      default_branch_only: false,
    }),
  });

  // Generate license and attach to fork
  // ...

  return Response.json({ ok: true, fork: fork.html_url });
}
```
