# Configuration Reference

## Configuration File: `reposell.yml`

The main configuration file for the reposell CLI. All values are optional — the CLI derives sensible defaults from Git/GitHub/CI.

## Complete Example

```yaml
version: 1

product:
  name: "My Awesome Product"
  description: "A CLI tool that does amazing things"
  category: "developer-tools"
  tags:
    - cli
    - typescript
    - automation

pricing:
  amount: 5000          # In minor units (cents for USD)
  currency: "USD"
  model: "one_time"     # one_time | subscription | pay_what_you_want

releases:
  mode: "all"           # "selected" | "all"
  selected: []          # Only used when mode: "selected"
  # Example for selected mode:
  # selected:
  #   - "v1.0.0"
  #   - "v1.1.0"

payment:
  provider: "stripe"    # Only "stripe" supported currently
  payment_link: "https://buy.stripe.com/..."  # Per-release link (required for publish)

listing:
  enabled: true
  # Auto-register with official listing on release
  auto_register: true
  # Listing endpoint (auto-derived if not set)
  # endpoint: "/listing"

git:
  provider: "github"    # github | gitlab | bitbucket | gitea | forgejo
  # Auto-derived from git remote:
  # owner: ""
  # repository: ""
  # provider_repository_id: ""

signing:
  # Key management (keys never in config - use env/keychain)
  # key_id: "repo_key_2026_01"
  # algorithm: "Ed25519"
  # Private key: ${REPOSELL_SIGNING_KEY} (env var or keychain)
  # Public key: committed to config/reposell/verification-key.pub

ci:
  # GitHub Actions workflow generation
  generate_workflows: true
  # Workflow files to generate
  workflows:
    - "reposell.yml"        # Main CI: validation, manifest generation
    - "reposell-release.yml" # Release automation
  # Required secrets (documented, never in config)
  # STRIPE_SECRET_KEY
  # STRIPE_WEBHOOK_SECRET
  # REPOSELL_SIGNING_KEY
  # GITHUB_TOKEN (auto-provided by GitHub Actions)

# Advanced: override auto-derived values
# overrides:
#   repository_url: "https://github.com/owner/repo"
#   listing_endpoint: "https://custom.domain/listing"
```

## Field Reference

### `version` (integer, required)
Configuration schema version. Current: `1`.

### `product` (object)
Product metadata for listing listings.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes* | Repo name | Product display name |
| `description` | string | Yes* | First line of README | Product description |
| `category` | string | No | "uncategorized" | Listing category |
| `tags` | string[] | No | [] | Search tags |

*Required for listing registration; optional for `/sell` only.

### `pricing` (object)
Product pricing configuration.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `amount` | integer | Yes | 0 | Price in minor units (cents for USD) |
| `currency` | string | Yes | "USD" | ISO 4217 currency code |
| `model` | string | Yes | "one_time" | `one_time`, `subscription`, `pay_what_you_want` |

### `releases` (object)
Release selection mode.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `mode` | string | Yes | "all" | `selected` or `all` |
| `selected` | string[] | No* | [] | Release tags (required if mode=selected) |

### `payment` (object)
Payment provider configuration.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `provider` | string | Yes | "stripe" | Payment provider identifier |
| `payment_link` | string | Yes (to publish) | — | Stripe Payment Link URL for the release; CI verifies HTTPS + buy.stripe.com + amount/currency match |

**Secrets (NEVER in config — use environment/GitHub secrets):**
- `STRIPE_SECRET_KEY` — optional; local tooling only (`listing status` dashboard, `sell sync`). Checkout itself requires no keys.

### `listing` (object)
Listing integration settings.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | boolean | No | false | Enable `/listing` endpoint |
| `auto_register` | boolean | No | true | Auto-register on release |
| `endpoint` | string | No | auto | Custom listing endpoint |

### `git` (object)
Git provider configuration.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `provider` | string | Yes | auto | Git provider |
| `owner` | string | No | auto | Repository owner |
| `repository` | string | No | auto | Repository name |

### `signing` (object)
Cryptographic signing configuration.

**Keys NEVER in config. Use:**
- Environment variable: `REPOSELL_SIGNING_KEY` (base64-encoded private key)
- OS keychain: `reposell signing key`
- GitHub Actions secret: `REPOSELL_SIGNING_KEY`

Public key committed to: `config/reposell/verification-key.pub`

### `ci` (object)
CI/CD workflow generation.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `generate_workflows` | boolean | No | true | Generate workflows |
| `workflows` | string[] | No | both | Workflow files to generate |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes (if payment enabled) | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Yes (if payment enabled) | Stripe webhook signing secret |
| `STRIPE_PUBLISHABLE_KEY` | Yes (if payment enabled) | Stripe publishable key |
| `REPOSELL_SIGNING_KEY` | Yes (if signing enabled) | Base64-encoded Ed25519 private key |
| `GITHUB_TOKEN` | Auto | GitHub token (provided by Actions) |
| `REPOSELL_CONFIG` | No | Path to config file (default: reposell.yml) |

## Configuration Precedence

1. **Defaults** (zero-config derivation)
2. **reposell.yml** (explicit config)
3. **Environment variables** (overrides)
4. **CLI flags** (highest priority)

## Validation

```bash
# Validate configuration
reposell doctor

# Auto-fix safe issues
reposell doctor --fix
```

## Schema

JSON Schema available at: `https://reposell.dev/schemas/reposell-config-v1.json`

Validate with:
```bash
npx ajv validate -s schema.json -d reposell.yml
```