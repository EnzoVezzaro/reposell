# Zero-Config Derivation

## Philosophy

Whenever a value can be derived automatically, derive it.

**Only ask the developer for information that genuinely cannot be inferred.**

## Auto-Derived Values

| Value | Source |
|-------|--------|
| Repository owner | Git remote origin / GitHub API |
| Repository name | Git remote origin / GitHub API |
| Repository URL | Git remote origin |
| Git provider | Git remote hostname |
| Current commit | `git rev-parse HEAD` |
| Releases | Git tags matching `v*` |
| Default branch | `git symbolic-ref refs/remotes/origin/HEAD` |
| Package name | package.json / Cargo.toml / pyproject.toml |

## What You Still Configure

Only configure what **cannot** be derived:

```yaml
# reposell.yml - minimal required
version: 1

product:
  name: "My Product"           # Required for listing
  description: "Description"   # Required for listing
  category: "developer-tools"  # Optional
  tags: ["cli", "typescript"]  # Optional

pricing:
  amount: 5000                 # In minor units (cents)
  currency: "USD"
  model: "one_time"            # one_time | subscription | pay_what_you_want

releases:
  mode: "all"                  # "selected" | "all"
  selected: []                 # Only if mode: "selected"

payment:
  provider: "stripe"

listing:
  enabled: true
  auto_register: true

git:
  provider: "github"

signing:
  # Keys NEVER in config - use env/keychain
  # Private key: ${REPOSELL_SIGNING_KEY}
  # Public key: committed to config/reposell/verification-key.pub

ci:
  generate_workflows: true
  workflows:
    - "reposell.yml"
    - "reposell-release.yml"
```

## What You Never Configure

❌ **Never in config:**
- Private keys (use env/keychain)
- Stripe secret keys (GitHub Actions secrets)
- Webhook secrets (not used - no webhooks)
- GitHub tokens (CI provides `GITHUB_TOKEN`)
- Repository metadata (auto-derived)
- Release lists (auto-detected from tags)

## Configuration Precedence

1. **Defaults** (zero-config derivation)
2. **reposell.yml** (explicit config)
3. **Environment variables** (overrides)
4. **CLI flags** (highest priority)

## Configuration File Discovery

Commands look for config in order:
1. `--config` flag
2. `REPOSELL_CONFIG` env var
3. `reposell.yml` in current directory
4. `reposell.yml` in parent directories
5. `.reposell.yml` in home directory

## Validation

```bash
# Validate configuration
reposell doctor

# Auto-fix safe issues
reposell doctor --fix
```

## Schema

JSON Schema: `https://reposell.dev/schemas/reposell-config-v1.json`

Validate with:
```bash
npx ajv validate -s schema.json -d reposell.yml
```