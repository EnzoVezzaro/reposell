# Core Concepts

## Repository Ownership

The fundamental principle of reposell: **the developer owns the repository**.

- reposell does NOT own the repository
- reposell does NOT require the repository to be hosted by reposell
- reposell does NOT proxy the repository's `/sell` endpoint
- The repository can sell independently without using reposell listing

## The Two Endpoints

### `/sell` — Product Sales Endpoint
- Owner: Repository owner
- Required: No (always optional)
- Purpose: Direct sales without listing

### `/listing` — Listing Integration
- Owner: Repository owner
- Required: No (optional reposell integration)
- Purpose: Listing discovery, verification, and registration

The listing is **OPTIONAL**. A repository may:
- **A.** Sell through `/sell` only
- **B.** Sell through `/sell` and register `/listing`
- **C.** Register selected releases
- **D.** Automatically expose all future releases

## Zero-Config Principle

Whenever a value can be derived automatically, derive it.

**Never ask developers to manually enter:**
- Repository name
- Repository owner
- GitHub URL
- Current commit
- Git provider
- Release information
- Default metadata
- Listing endpoint

**Read it from Git/GitHub/CI.**

## Payment Abstraction

Checkout uses **Stripe Payment Links** — no servers, no webhooks, no SDK secrets in the buy path. The provider layer validates links structurally (HTTPS, Stripe domain) and, when a `payment_link_id` is present, deeply (amount/currency match via the Stripe API).

```typescript
// Conceptual shape — see src/domain/payment/
StripePaymentProvider
  ├── verifyAccount()                  // local tooling: resolve key, read account state
  ├── validatePaymentLink(link)        // structural checks (always)
  └── verifyLinkAgainstPricing(linkId) // deep checks (needs secret key)
```

- **StripePaymentProvider** — initial implementation
- Future: PayPal, Coinbase, etc.
- Configuration: `payment.provider: stripe`

## Git Provider Abstraction

The protocol is provider-agnostic. Everything provider-specific lives behind one interface:

```typescript
interface GitProvider {
  getRepositoryMetadata(): Promise<RepositoryMetadata>;
  getReleases(): Promise<Release[]>;
  createRelease(params: ReleaseParams): Promise<Release>;
  getFileContent(path: string, ref?: string): Promise<string>;
}
```

- **GitHubProvider** — ships first, fully supported today
- **Coming soon**: GitLab, Bitbucket, Gitea, Forgejo
- Configuration: `git.provider: github` (one line to switch once new providers land)

The same rule applies to CI: workflows are generated per platform — GitHub Actions today, more coming soon. Core logic never imports a provider directly; it talks to the interface.

## Cryptographic Identity

- **Algorithm**: Ed25519 (EdDSA over Curve25519)
- **Key size**: 32 bytes private, 32 bytes public, 64 bytes signature
- **Encoding**: base64url (no padding)
- **Deterministic**: Yes (RFC 8032)

### Key Types

| Type | Purpose | Storage |
|------|---------|---------|
| Repository keys | Sign manifests | OS keychain / env |
| Listing keys | Sign manifests | OS keychain / env |
| Official keys | Sign policies/trust | HSM / air-gapped |

### Key Rotation

- Via signed trust documents
- Chain of trust: old key signs new key
- Revocation status in trust document

## Protocol Versioning

All public interfaces versioned:
```json
{
  "protocol": "reposell",
  "version": "1.0"
}
```

- URL versioning: `/api/v1/`
- Breaking changes = new version
- Deprecation notice: 6 months

## Pure Static + CI

**No server, no database, no Docker, no edge functions.**

- Static frontend (Bun + Vite + React + TS)
- GitHub Actions CI for all automation
- Stripe Payment Links for checkout (one per release, developer-created)
- Listing fee splits per the signed pricing policy — settlement only on listing-originated sales
- `reposell.dev` as default domain for static files

## Listing Model

### Official Listing (`reposell.dev`)
- Static pricing.json, trust.json, verification-key.pub
- Static frontend on Vercel/Netlify/Cloudflare Pages
- CI verifies pricing/trust signatures

### Public Listing (Community)
- Static frontend + CI enforcement
- Fetches/verifies pricing/trust from `reposell.dev`
- Runtime trust enforcement (safe state on failure)
- CI `verify.yml` MUST PASS for deploy

## Revenue Split

From signed pricing policy (example):
```
Product Price:        $50.00
Listing Fee:       $5.00
─────────────────────────────────────
Net to Distribute:    $45.00

Main Listing:     $2.50  (50%)
Public Listing:   $2.50  (50%)
Repository Owner:     $40.50 (remainder)
```

Formula:
```
Owner = Price - Fee
Main = Fee × Main% / 100
Public = Fee × Public% / 100
```

**Current implementation:** The listing fee (discovery contribution) is paid by the buyer ON TOP of the seller's price. The seller keeps 100% of their `/sell` revenue. The contribution is a separate transaction to reposell's Stripe account. Community referral economics are not yet implemented — the `Main%` and `Public%` splits are reserved for future use.

## Security Model

1. **Input Validation** — All user input validated at boundaries
2. **Output Validation** — All generated manifests validated
3. **Cryptographic Verification** — Ed25519 signatures on all manifests
4. **Secret Management** — Keys never in config, never logged
5. **Minimal Permissions** — GitHub OAuth scopes minimized
6. **Webhook Verification** — Mandatory signature verification
7. **Price Security** — Backend calculates, immutable snapshot

## Listing Economics

Default values (from signed policy):
- Listing fee: $5.00 (fixed)
- Public listing %: 50%
- Main listing %: 50%

For $50 product:
- Repository owner: $45.00
- Main listing: $2.50
- Public listing: $2.50

**Note:** Community referral economics are not yet implemented. Currently, the listing fee (discovery contribution) goes entirely to reposell. The Main/Public splits are reserved for future use when community listings are supported.

## License Model

### Repository Access (Primary)
On successful purchase:
1. Buyer's GitHub account gets fork of repository
2. Fork includes purchased release tag
3. License record created with fork reference

### License Record
```json
{
  "license_id": "lic_abc123",
  "buyer": "github:buyer",
  "product": "prod_abc123",
  "repository": "github:owner/repo",
  "release": "v1.0.0",
  "listing": "mkt_official",
  "transaction": "txn_abc123",
  "purchased_at": "2026-08-22T10:00:00Z",
  "status": "active",
  "delivery": {
    "type": "github_fork",
    "fork_url": "https://github.com/buyer/repo"
  }
}
```

## Release Selection Modes

### `mode: "selected"`
Only explicitly listed releases are sellable:
```json
{
  "releases": {
    "mode": "selected",
    "selected": ["v1.0.0", "v1.1.0"]
  }
}
```

### `mode: "all"`
All releases (past and future) are sellable. New releases automatically become available.
```json
{
  "releases": {
    "mode": "all"
  }
}
```

**CI Automation Required**: When `mode: "all"`, CI must automatically update listing metadata on new releases.