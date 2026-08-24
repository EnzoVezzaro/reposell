---
title: Secret Management
description: Every reposell environment variable, which ones are secret, how .env and GitHub Actions secrets interact, and what is safe to commit.
---

# Secret Management

reposell needs exactly one true secret to do its most sensitive job — signing — and optionally a Stripe key for local tooling. Everything else is public material or plain configuration. This page lists every variable, where it may live, and the hard rules about what never touches Git, npm, CI artifacts, or logs.

## The variables

| Variable | Secret? | Purpose |
| --- | --- | --- |
| `REPOSELL_SIGNING_KEY` | **Yes** | Base64 Ed25519 private seed (exactly 32 bytes). Required for `reposell build`/signing. |
| `STRIPE_SECRET_KEY` | **Yes** | Stripe secret key (`sk_test_…` / `sk_live_…`). Local tooling and deep link verification only. |
| `REPOSELL_STRIPE_SECRET_KEY` | **Yes** | reposell-prefixed alias, checked before `STRIPE_SECRET_KEY`. Same rules apply. |
| `REPOSELL_OFFICIAL_VERIFY_KEY` | No | Base64 **public** key used to pin official pricing verification (`reposell verify pricing`). |
| `REPOSELL_REGISTRY_URL` | No | Listing registry endpoint override. |
| `REPOSELL_CONFIG` | No | Path to your config file (default `reposell.yml`). |

Full reference: [Environment Variables](/configuration/env).

## Resolution order

Values resolve with process environment first, `.env` file second:

1. Process environment (CI secrets, shell exports)
2. Local `.env` file in the working directory

`.env` files use plain `KEY=value` lines; quoted values and `#` comment lines are supported. Because the process environment wins, a CI run is unaffected by any stray local `.env`.

## The signing key's lifecycle

The private seed exists in exactly two places:

- **Your secret store** (OS keychain, password manager, Actions secret).
- **Process memory**, for the duration of a signing operation.

Hard constraints enforced by the CLI:

- The seed arrives via `REPOSELL_SIGNING_KEY` and is **never written to disk** — not to build output, not to config, not to caches.
- Missing/empty → abort with `SIGNING_KEY_MISSING`. Malformed → `SIGNING_KEY_INVALID`. It never proceeds with a default or derived key.
- Nothing logs it. Generated artifacts under `dist/reposell/` contain manifests and `signature.json` only.

Generate a fresh identity locally (see [Cryptographic Security](/security/crypto) for the format):

```bash
openssl genpkey -algorithm Ed25519 -out private_key.pem
openssl pkey -in private_key.pem -outform DER | base64
```

Store the output in your OS keychain rather than a plaintext file when possible:

```bash
# macOS
security add-generic-password -a "$USER" -s "reposell-signing-key" -w "<base64 seed>"
```

## GitHub Actions

Add these as repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `REPOSELL_SIGNING_KEY` | Base64 Ed25519 private seed |
| `STRIPE_SECRET_KEY` | `sk_test_…` recommended; `sk_live_…` only if you run live tooling from CI |

The generated workflow references them symbolically:

```yaml
env:
  REPOSELL_SIGNING_KEY: ${{ secrets.REPOSELL_SIGNING_KEY }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

The workflow file itself contains no secret material and is safe to commit. Values are injected into the step environment at run time and inherit the workflow's least-privilege permissions (see [Git Provider Security](/security/git-provider)).

Checkout requires **no keys at all** — buyers go through Payment Links ([Payment Security](/security/payment)).

## `.env` handling

A local `.env` is convenient for development; treat it as a secret file:

```bash
# .env — never commit this file
STRIPE_SECRET_KEY=sk_test_51…
REPOSELL_SIGNING_KEY=<base64 seed>
```

Keep it out of version control (gitignore it) and out of shared artifact storage. If you prefer zero files, export the variables in your shell profile or retrieve them from the keychain on demand.

## What is safe to commit

| Artifact | Safe? | Why |
| --- | --- | --- |
| `.github/reposell/verification-key.pem` | Yes | Public verification key (SPKI PEM) |
| Public key as base64 | Yes | Public half of the pair |
| `signature.json`, manifest.json | Yes | Signed content — tamper-evident by design |
| `key_id` values | Yes | Derived from the public key's hash |
| Private seed in any encoding | **Never** | Full signing authority |
| Stripe secret keys | **Never** | Account access |

If a private value ever lands in a commit, package, or CI log, treat it as compromised and follow [Incident Response](/security/incident-response).

## Quick audit checklist

- [ ] `REPOSELL_SIGNING_KEY` exists only in a secret store and CI secrets.
- [ ] `.env` is gitignored and absent from CI workspaces and Docker images.
- [ ] Test and live Stripe keys are different keys, stored separately.
- [ ] `git log -p -- '*.pem' 'signature.json'` shows only public material.
- [ ] Published npm package and build artifacts contain no env dumps.
