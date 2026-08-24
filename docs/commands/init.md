---
title: reposell init
description: Zero-config repository setup — config, CI workflow and signing identity in one command.
---

# reposell init

Set up a repository for selling. No flags — everything is derived from Git and safe defaults.

```bash
reposell init
```

## What it does

1. **Detects the repository** — parses `git config --get remote.origin.url` (SSH and HTTPS forms) for provider, owner and repo name. Falls back to the directory name when no remote exists.
2. **Creates `reposell.yml`** with zero-config defaults — only if the file does not exist yet; your configuration is never overwritten:

   ```yaml
   # reposell configuration
   version: 1
   product:
     name: your-repo
   releases:
     mode: manual
     definitions: {}
   sell:
     enabled: true
   listing:
     enabled: false
   ```

3. **Runs the license check** and explains how the detected license interacts with selling.
4. **Generates `.github/workflows/reposell.yml`** — the validate → build → GitHub Pages pipeline that CI runs on every push.
5. **Creates an Ed25519 signing identity** (best effort):
   - Public key → `.github/reposell/verification-key.pem` — safe to commit.
   - Private seed → printed **once** to the terminal, never written to disk. Add it as the `REPOSELL_SIGNING_KEY` secret in GitHub Actions.
   - If generation fails, `reposell keys generate` retries later.

## Example

```bash
$ reposell init
✓ Detected github repository: you/your-repo
✓ Created reposell.yml (zero-config defaults)
✓ Generated .github/workflows/reposell.yml (validate → build → GitHub Pages)
✓ Wrote public verification key to .github/reposell/verification-key.pem (safe to commit)

PRIVATE KEY — add as secret REPOSELL_SIGNING_KEY (shown once, never stored):
  <base64 seed>

Next:
1. Create a Stripe Payment Link for your release
2. reposell release v0.1.0 --price 10 --link https://buy.stripe.com/…
3. reposell publish v0.1.0
4. git push — CI validates, signs, builds and deploys /reposell/*
```

## Files created

```
your-repo/
├── .github/
│   ├── workflows/reposell.yml            # CI: validate → build → deploy
│   └── reposell/verification-key.pem     # Ed25519 public key (commit me)
└── reposell.yml                          # Configuration (only if missing)
```

## Notes

- **Idempotent**: running `init` twice never overwrites `reposell.yml`; the workflow file is regenerated to match the installed CLI version.
- **No network calls**: everything is derived locally from Git.
- Private keys are never committed, logged or stored — see [Security → Secrets](/security/secrets).

## Related

- [Quick Start](/guide/quick-start)
- [`reposell keys`](/commands/)
- [reposell.yml schema](/configuration/schema)
