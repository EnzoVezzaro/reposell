---
title: Initialize Repository
description: What `reposell init` actually does — zero-config derivation from Git, the files it writes, and its never-overwrite guarantees.
---

# `reposell init`

`reposell init` prepares the current directory for selling. It takes no flags — everything that can be derived from Git is derived, and everything it writes is either new or confined to the reposell namespace.

```bash
cd your-repo
reposell init
```

## What it detects

First, the CLI inspects your Git remote:

```bash
git config --get remote.origin.url
```

Both SSH (`git@github.com:owner/repo.git`) and HTTPS (`https://github.com/owner/repo.git`) forms are parsed. From the URL it derives:

- **provider** — `github` or `gitlab`
- **owner** / **repo** — with a `.git` suffix stripped
- **repository id** — `github:owner/repo`

If there is no usable remote, init falls back to the directory name as the repo, `unknown` as the owner, and `github` as the provider. You are never asked to type any of these values.

## What it creates

### 1. `reposell.yml` (only if missing)

```yaml
# reposell configuration
version: 1
product:
  name: <repo-name>
releases:
  mode: manual
  definitions: {}
sell:
  enabled: true
listing:
  enabled: false
```

The product name comes from your repository name. Releases start in `manual` mode (nothing is public until you run `reposell publish <tag>`) with an empty definitions map. If `reposell.yml` already exists, init leaves it untouched — the output says `• reposell.yml already exists`.

### 2. `.github/workflows/reposell.yml` (always written)

A single deterministic workflow covering push to `main`/`master`, GitHub Release publications, and manual dispatch. Its pipeline:

1. checkout → setup-node (Node 20) → `npm install -g @reposell/cli`
2. `reposell validate` — full publication gate checklist
3. `reposell build --out dist` — generates the `/reposell/*` static surface and signs it when `REPOSELL_SIGNING_KEY` is present
4. deploy `dist/reposell` to GitHub Pages

The workflow requests only `contents: read`, `pages: write`, `id-token: write`, and reads a single secret (`REPOSELL_SIGNING_KEY`) from Actions secrets. Checkout needs no keys — buyers go through Stripe Payment Links. This is the one file init regenerates on every run; nothing outside `.github/workflows/reposell.yml` is ever touched.

### 3. `.github/reposell/verification-key.pem` (best effort)

Init generates a fresh Ed25519 identity and writes the **public** half here — this file is safe to commit. The private seed is printed once in base64 and never stored by the CLI:

```text
PRIVATE KEY — add as secret REPOSELL_SIGNING_KEY (shown once, never stored):
  <base64-seed>
```

Add it as a GitHub Actions secret so CI can sign builds. If identity generation fails at init time, the step is skipped silently — `reposell keys generate` performs the same operation explicitly.

Because each run generates a new identity, prefer `reposell keys generate` when you intentionally want to replace a key; re-running plain `init` will overwrite the committed verification key.

### 4. License check

Init runs license detection and appends the result to its report (missing/unrecognized licenses are flagged, not fixed). See [License Checks & Templates](/licensing/).

## Idempotency rules

| Path | Re-run behavior |
|------|-----------------|
| `reposell.yml` | Never overwritten |
| `.github/workflows/reposell.yml` | Regenerated (deterministic content) |
| `.github/reposell/verification-key.pem` | Overwritten with a fresh public key |
| Anything else | Not touched |

## Example session

```bash
$ reposell init
<banner>
✓ Detected github repository: owner/repo
✓ Created reposell.yml (zero-config defaults)
✓ Generated .github/workflows/reposell.yml (validate → build → GitHub Pages)
✓ Wrote public verification key to .github/reposell/verification-key.pem (safe to commit)

PRIVATE KEY — add as secret REPOSELL_SIGNING_KEY (shown once, never stored):
  <base64-seed>

Next:
1. Create a Stripe Payment Link for your release
2. reposell release v0.1.0 --price 10 --link https://buy.stripe.com/…
3. reposell publish v0.1.0
4. git push — CI validates, signs, builds and deploys /reposell/*
```

Note what init does *not* do: no manifest or sell page is generated yet. Those are produced deterministically by `reposell build` during CI. Full command reference: [/commands/init](/commands/init).

## Next steps

- [Payment Setup](/guide/payment-setup) — create the Stripe Payment Link
- [Configuration Schema](/configuration/schema) — every field `reposell.yml` accepts
- [Environment Variables](/configuration/env) — where `REPOSELL_SIGNING_KEY` lives
