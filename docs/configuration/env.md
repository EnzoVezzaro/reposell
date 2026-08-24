# Environment Variables

Environment variables carry secrets and environment-specific settings. `reposell.yml` never holds secrets.

## Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REPOSELL_SIGNING_KEY` | For signed builds | Base64-encoded Ed25519 private seed (32 bytes). Resolved strictly from the process environment / CI secrets — never from `.env` files |
| `REPOSELL_STRIPE_SECRET_KEY` | Optional | Stripe secret key (preferred form). Local tooling (`listing status`, deep link verification) — checkout itself uses Payment Links, no keys needed |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key fallback (used when the `REPOSELL_` form is absent) |
| `REPOSELL_OFFICIAL_VERIFY_KEY` | For remote verification | Official Ed25519 public key used by `reposell verify pricing` / trust checks |

The GitHub Actions token is provided implicitly by the generated workflow's `permissions:` block — you don't need to manage a `GITHUB_TOKEN` yourself.

## GitHub Actions secrets

Add these in repository settings → Secrets and variables → Actions:

| Secret | Value | Required |
|--------|-------|----------|
| `REPOSELL_SIGNING_KEY` | Base64 Ed25519 private seed | For signed builds |
| `STRIPE_SECRET_KEY` | `sk_test_...` / `sk_live_...` | Optional (local tooling / deep verification) |

Checkout requires **no keys** — buyers go through your Stripe Payment Links.

## Local development

Stripe keys can live in a gitignored `.env` at the repository root:

```bash
# .env (gitignored)
STRIPE_SECRET_KEY=sk_test_...
```

The signing key is deliberately **not** read from `.env` — it comes only from the real environment, so it cannot leak through Dotenv-style file loading:

```bash
export REPOSELL_SIGNING_KEY=<base64 seed>
```

**Never commit `.env` to Git.**

## Generating a signing key

The CLI generates keys for you:

```bash
reposell keys generate   # prints the private seed once, writes the public PEM
```

Or with OpenSSL:

```bash
openssl genpkey -algorithm Ed25519 -out private_key.pem
openssl pkey -in private_key.pem -outform DER | base64
```

## OS keychain (storage guidance)

The CLI does not read OS keychains. If you prefer them over shell profiles, store the seed there and inject it into the environment yourself:

```bash
# macOS example
export REPOSELL_SIGNING_KEY="$(security find-generic-password -a "$USER" -s reposell-signing-key -w)"
```

## Security best practices

1. **Never commit secrets** to Git
2. **Use different keys** for test/live environments
3. **Rotate keys periodically** (every 90 days recommended)
4. **Use minimal permissions** for CI
5. **Audit access** regularly
