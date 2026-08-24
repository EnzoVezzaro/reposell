# Configuration Schema

## JSON Schema

The complete JSON Schema for `reposell.yml` is available at:
`https://reposell.dev/schemas/reposell-config-v1.json`

## Schema Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "reposell Configuration",
  "type": "object",
  "required": ["version"],
  "properties": {
    "version": { "type": "integer", "const": 1 },
    "product": { "$ref": "#/$defs/product" },
    "pricing": { "$ref": "#/$defs/pricing" },
    "releases": { "$ref": "#/$defs/releases" },
    "payment": { "$ref": "#/$defs/payment" },
    "listing": { "$ref": "#/$defs/listing" },
    "git": { "$ref": "#/$defs/git" },
    "signing": { "$ref": "#/$defs/signing" },
    "ci": { "$ref": "#/$defs/ci" },
    "overrides": { "$ref": "#/$defs/overrides" }
  },
  "$defs": {
    "product": {
      "type": "object",
      "required": ["name", "description"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "description": { "type": "string", "minLength": 1 },
        "category": { "type": "string", "default": "uncategorized" },
        "tags": { "type": "array", "items": { "type": "string" }, "default": [] }
      }
    },
    "pricing": {
      "type": "object",
      "required": ["amount", "currency", "model"],
      "properties": {
        "amount": { "type": "integer", "minimum": 0 },
        "currency": { "type": "string", "pattern": "^[A-Z]{3}$", "default": "USD" },
        "model": { "type": "string", "enum": ["one_time", "subscription", "pay_what_you_want"], "default": "one_time" }
      }
    },
    "releases": {
      "type": "object",
      "required": ["mode"],
      "properties": {
        "mode": { "type": "string", "enum": ["selected", "all"], "default": "all" },
        "selected": { "type": "array", "items": { "type": "string" }, "default": [] }
      }
    },
    "payment": {
      "type": "object",
      "required": ["provider"],
      "properties": {
        "provider": { "type": "string", "default": "stripe" }
      }
    },
    "listing": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "auto_register": { "type": "boolean", "default": true },
        "endpoint": { "type": "string" }
      }
    },
    "git": {
      "type": "object",
      "required": ["provider"],
      "properties": {
        "provider": { "type": "string", "enum": ["github", "gitlab", "bitbucket", "gitea", "forgejo"], "default": "github" },
        "owner": { "type": "string" },
        "repository": { "type": "string" }
      }
    },
    "signing": {
      "type": "object",
      "properties": {
        "key_id": { "type": "string" },
        "algorithm": { "type": "string", "const": "Ed25519" }
      }
    },
    "ci": {
      "type": "object",
      "properties": {
        "generate_workflows": { "type": "boolean", "default": true },
        "workflows": { "type": "array", "items": { "type": "string" }, "default": ["reposell.yml", "reposell-release.yml"] }
      }
    },
    "overrides": {
      "type": "object",
      "properties": {
        "repository_url": { "type": "string", "format": "uri" },
        "listing_endpoint": { "type": "string", "format": "uri" }
      }
    }
  }
}
```

## Validation

```bash
# Install ajv-cli
npm install -g ajv-cli

# Validate
npx ajv validate -s https://reposell.dev/schemas/reposell-config-v1.json -d reposell.yml
```

## Schema Versioning

- Schema version tracked in `version` field
- Breaking changes = new schema version
- Old schemas maintained for compatibility
- Migration guide provided for upgrades

## Licensing & Offers (current)

The commercial model is scheme-based: reusable **license schemes** are bound
per release through **offers**, each carrying its own pricing and Stripe
Payment Link (one-time or recurring).

```yaml
licensing:
  policy:
    profile: source-available-commercial   # 15 profiles, or custom
    spdx: LicenseRef-reposell-RSL-1.0      # SPDX expression
    overrides:                             # any right, validated value
      ai_training: allowed-with-authorization
  schemes:
    standard:
      name: Standard
      billing: one-time          # one-time | recurring
      template: rsl-1.0          # license instrument issued at checkout
    team:
      name: Team
      billing: one-time
      seats: 10
    pro-monthly:
      name: Pro
      billing: recurring         # recurring requires interval
      interval: month            # month | year

releases:
  definitions:
    v1.2.0:
      status: published
      offers:                    # one offer per scheme; own link each
        - scheme: standard
          pricing: { amount: 29, currency: USD }
          payment:
            provider: stripe
            payment_link: https://buy.stripe.com/...
            payment_link_id: plink_...   # enables deep verification
        - scheme: pro-monthly
          pricing: { amount: 9, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
```

Rules enforced by the validator and the publication gates:

- every `offer.scheme` must exist in `licensing.schemes`; duplicates per release are rejected
- `billing: recurring` requires `interval` (`month` | `year`); `interval` on one-time schemes is an error
- every offer independently passes the price/currency/provider/link gates — one bad offer blocks the release
- deep Stripe verification checks amount, currency **and billing mode** (a recurring scheme must point at a recurring price with the declared interval)
- the license policy sha256 (from `reposell license compose`) is bound into every signed release manifest
