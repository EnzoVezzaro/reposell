# reposell listing

Manage listing integration.

```bash
reposell listing <command> [options]
```

## Subcommands

### `reposell listing enable`
Enable listing integration.

```bash
reposell listing enable
```

**Actions:**
1. Creates `/reposell/manifest.json`
2. Signs manifest with repository key
3. Registers with official listing (if configured)
4. Updates CI workflows for release automation

### `reposell listing disable`
Disable listing integration.

```bash
reposell listing disable [options]
```

| Option | Description |
|--------|-------------|
| `--keep-manifest` | Keep manifest file, only disable CI |

### `reposell listing register`
Register with official listing.

```bash
reposell listing register [options]
```

| Option | Description |
|--------|-------------|
| `--listing <url>` | Listing API URL (default: official) |
| `--force` | Re-register if already registered |

### `reposell listing status`
Check listing registration status.

```bash
reposell listing status [options]
```

**Output:**
```json
{
  "registered": true,
  "listing_id": "mkt_official",
  "registration_date": "2026-08-22T10:00:00Z",
  "last_verified": "2026-08-22T12:00:00Z",
  "manifest_valid": true
}
```

### `reposell listing verify`
Verify listing manifest signatures.

```bash
reposell listing verify [options]
```

| Option | Description |
|--------|-------------|
| `--manifest <path>` | Manifest file to verify |
| `--key <path>` | Public key file |

## Examples

```bash
# Enable listing
reposell listing enable

# Register with official listing
reposell listing register

# Check status
reposell listing status

# Verify signatures
reposell listing verify

# Disable (keep manifest)
reposell listing disable --keep-manifest
```

## Manifest Structure

```json
{
  "protocol": "reposell-listing",
  "version": "1.0",
  "repository": { ... },
  "product": { ... },
  "releases": { "mode": "all" },
  "pricing": { "amount": 5000, "currency": "USD" },
  "payment": { "provider": "stripe" },
  "license": { "type": "repository_access", "delivery": "github_fork" },
  "listing": { "registered": true, "listing_id": "mkt_official" },
  "signatures": { "repository": "...", "listing": "...", "key_id": "..." },
  "verification": { "key_url": "...", "algorithm": "Ed25519" }
}
```