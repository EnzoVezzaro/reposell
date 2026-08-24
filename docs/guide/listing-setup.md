# Listing Setup

## Overview

The listing integration is **optional**. Enable it to:
- List your product on the official listing (`reposell.dev`)
- Register with public listings
- Enable automatic release syncing

## Enable Listing

```bash
reposell listing enable
```

This creates:
- `/reposell/manifest.json` — Signed manifest
- `.github/workflows/reposell-release.yml` — Release automation
- Updates `reposell.yml` with listing config

## Manifest Structure

```json
{
  "protocol": "reposell-listing",
  "version": "1.0",
  "repository": {
    "provider": "github",
    "provider_repository_id": "123456789",
    "owner": "owner",
    "repository": "repo",
    "canonical_url": "https://github.com/owner/repo"
  },
  "product": {
    "id": "prod_abc123",
    "name": "My Product",
    "description": "A great CLI tool",
    "category": "developer-tools",
    "tags": ["cli", "typescript"]
  },
  "releases": {
    "mode": "all",
    "selected": [],
    "latest": "v1.2.0",
    "all": ["v1.0.0", "v1.1.0", "v1.2.0"]
  },
  "pricing": {
    "amount": 5000,
    "currency": "USD",
    "model": "one_time"
  },
  "payment": {
    "provider": "stripe",
    "capabilities": ["one_time"]
  },
  "license": {
    "type": "repository_access",
    "delivery": "github_fork"
  },
  "listing": {
    "registered": true,
    "listing_id": "mkt_official",
    "registration_date": "2026-08-22T10:00:00Z"
  },
  "signatures": {
    "repository": "base64url...",
    "listing": "base64url...",
    "key_id": "repo_key_2026_01"
  },
  "verification": {
    "key_url": "https://github.com/owner/repo/raw/main/config/reposell/verification-key.pub",
    "algorithm": "Ed25519"
  }
}
```

## Register with Official Listing

```bash
reposell listing register
```

This:
1. Submits manifest to `reposell.dev`
2. Official listing verifies signatures
3. Indexes your product
4. Returns `listing_id`

## Check Registration Status

```bash
reposell listing status
```

Output:
```json
{
  "registered": true,
  "listing_id": "mkt_official",
  "registration_date": "2026-08-22T10:00:00Z",
  "last_verified": "2026-08-22T12:00:00Z",
  "manifest_valid": true
}
```

## Release Selection Modes

### `mode: "selected"` (Explicit)
Only listed releases are sellable:
```yaml
releases:
  mode: "selected"
  selected:
    - "v1.0.0"
    - "v1.1.0"
```

### `mode: "all"` (Automatic)
All releases sellable, new releases auto-exposed:
```yaml
releases:
  mode: "all"
```

**CI Required**: When `mode: "all"`, CI auto-updates listing on new releases.

## Release Workflow

```bash
# Create release (triggers CI)
reposell release create 1.2.0

# CI automatically:
# 1. Validates manifest
# 2. Updates listing metadata
# 3. Notifies listing
# 4. Generates signatures
```

## Disable Listing

```bash
reposell listing disable
# Options:
#   --keep-manifest  # Keep manifest, only disable CI
```

## Verify Listing

```bash
# Verify manifest signatures
reposell listing verify

# Verify pricing policy
reposell verify pricing

# Verify trust document
reposell verify trust
```

## Configuration

```yaml
listing:
  enabled: true
  auto_register: true    # Auto-register on release
  endpoint: "/listing"  # Auto-derived
```

## Verification

The listing verifies:
1. **Manifest signatures** — Ed25519 (repository + listing)
2. **Repository identity** — Canonical URL, provider ID
3. **Pricing policy** — Signed by official listing
3. **Trust document** — Key rotation chain

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Manifest validation failed" | Run `reposell verify manifest` |
| "Not registered" | Run `reposell listing register` |
| "Signature invalid" | Check `config/reposell/verification-key.pub` |
| "Not verified" | Run `reposell doctor` |