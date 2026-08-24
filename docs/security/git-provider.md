---
title: Git Provider Security
description: How reposell derives repository identity locally, the minimal permissions generated workflows request, and how tokens are handled.
---

# Git Provider Security

reposell integrates with Git hosts through a `GitProvider` abstraction (GitHub ships first; nothing in the protocol is hardcoded to it). This page documents what the integration actually does, what credentials it needs, and what it deliberately does not do.

## Zero-config identity derivation is local-only

Repository identity — provider, owner, repo name — is derived by reading your local Git configuration:

```text
git config --get remote.origin.url
```

The remote URL is parsed for `github.com` and `gitlab.com` shapes (`owner/repo`, SSH or HTTPS form), producing an identifier like `github:owner/repo`. If no remote exists, the CLI falls back to the current directory name rather than guessing at network state.

This step makes **no network calls and requires no token**. Your repository identity is computed from data already on your machine. The CLI never pushes, never clones, and never mutates your repository history.

## Read-only by default

Everything reposell does against a Git host, it does read-only:

- Manifests, releases and signatures are **built locally** and published as static files (GitHub Pages) — there is no API write path for product data.
- The generated CI workflow publishes via the official Pages actions using OIDC (`id-token: write`); no deploy token or personal access token is stored anywhere.
- Release detection keys off GitHub Release events in CI; the workflow reacts to events instead of polling with credentials.

## Minimal permissions in generated workflows

`reposell init` generates `.github/workflows/reposell.yml` with an explicit least-privilege permission block:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

| Permission | Why |
| --- | --- |
| `contents: read` | Checkout needs to read the repo. Nothing writes to it. |
| `pages: write` | Deploy the built `/reposell/*` surface to GitHub Pages. |
| `id-token: write` | OIDC federation for Pages deployment — the modern replacement for long-lived deploy keys. |

No `packages`, no `issues`, no admin scopes. The implicit Actions `GITHUB_TOKEN` (auto-provided per run, documented in [Environment Variables](/configuration/env)) is scoped by exactly this block; reposell does not create, store, or transport any token of its own.

## Token handling rules

- **Tokens are never logged.** The codebase contains no code path that prints environment values, headers, or credential material.
- **Tokens are never committed.** Generated files reference secrets symbolically — `secrets.REPOSELL_SIGNING_KEY` — so the workflow file is safe to commit while the value stays in GitHub's secret store.
- **Tokens are never embedded in artifacts.** Build output under `dist/reposell/` contains manifests and signature envelopes only; signing keys arrive as step-environment variables and are never written to disk (see [Cryptographic Security](/security/crypto)).
- The Stripe key follows the same discipline — see [Payment Security](/security/payment).

## What lives where

```text
Your machine            GitHub                    Public
─────────────           ──────                    ──────
private seed (env only)  Actions secrets            verification-key.pem
remote URL → identity    GITHUB_TOKEN (implicit,    signature.json
local git config         scoped by workflow)        manifest.json
```

Only the right-hand column is public, and everything in it is either designed to be public or verifiable against a public key.

## What reposell deliberately does not do

| Capability | Status |
| --- | --- |
| Push commits or rewrite history | Never — no write path to `contents` exists |
| Create issues, comments, or releases via API | Never — no scope requested beyond read |
| Store tokens between runs | Never — nothing persists credentials |
| Send repository identity anywhere during derivation | Never — derivation is pure local parsing |

This table doubles as a review checklist: if a future version of the CLI needs any of these, it must say so explicitly in the docs and request exactly that scope.

## Threat view

| Threat | Defense |
| --- | --- |
| Over-privileged token exfiltrated from CI | Workflow requests only `contents: read` + Pages deployment rights; implicit token expires with the run |
| Forged release publication | Publication requires verified builds; artifacts are signature-bound ([Cryptographic Security](/security/crypto)) |
| Identity spoofing (wrong owner/repo) | Derived from your own remote URL; listings verify signatures against keys pinned to that identity |
| Malicious workflow modification | Deterministic regeneration makes edits visible as diffs |

## Provider abstraction

The `GitProvider` interface keeps GitHub from becoming a protocol assumption: identity parsing already recognizes GitLab remotes, and generated workflows target GitHub Actions because that is where the first-party CI integration lives. Swapping providers means implementing the interface — not editing the security model.

## Practical guidance

1. Keep personal access tokens, if you use any alongside reposell, scoped to read-only repository access.
2. Review the `permissions:` block if you modify the generated workflow — regeneration is deterministic ([Release model](/protocol/release-model)), so manual edits live until the next generation.
3. If you believe you exposed a token or signing key, follow [Incident Response](/security/incident-response).
