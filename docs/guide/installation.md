---
title: Installation
description: Install the reposell CLI globally with npm, verify the install, or build it from source.
---

# Installation

## Requirements

| Requirement | Version | Why |
|-------------|---------|-----|
| Node.js | >= 18 | The CLI ships as an ES module (`"type": "module"`) and targets modern Node |
| npm | bundled with Node | Used for the global install |
| Git | any recent version | Repository metadata is derived from your `origin` remote |

The CLI enforces `"engines": { "node": ">=18.0.0" }`, and the generated CI workflow pins Node 20. If you develop with Bun, the published CLI still runs on Node — target repositories need no Bun/TS toolchain.

## Global install

```bash
npm install -g @reposell/cli
```

> **Package vs command:** the npm package is **`@reposell/cli`** (published from the
> `@reposell` org); the command it installs is **`reposell`**. Zero-install:
> `npx @reposell/cli <command>`.

This installs three executables (declared in the package `bin` field):

| Binary | Purpose |
|--------|---------|
| `reposell` | The main CLI (`init`, `release`, `publish`, `build`, `validate`, `audit`, ...) |
| `cli` | Alias of `reposell` — lets `npx @reposell/cli` resolve unambiguously |
| `reposell-marketplace` | Marketplace-side tooling consuming `/reposell/*` endpoints |

## Verify the install

```bash
reposell help
```

You should see the ASCII banner followed by the usage summary:

```text
usage: reposell <command> [args]

  init                        Set up a repository for selling
  license check               Detect and explain the repository license
  listing status              Dashboard: repo, license, /sell endpoint, payments
  release <tag> [--price N] [--currency USD] [--link URL] [--link-id plink_…]
  publish <tag>               Approve publication after gates pass (manual mode)
  validate                    Run the full publication gate checklist
  build [--out dist]          Generate the /reposell/* static surface
  ...
```

Running `reposell` with no arguments prints the same output. `reposell version` (or `-v`) prints the CLI version.

## Next step

Head to [Quick Start](/guide/quick-start) and run `reposell init` inside your repository.

## Build from source

The reposell ecosystem is **three independent Git repositories** (plus local
tooling folders) — not a monorepo. Each repo versions, builds and deploys on
its own:

```
github.com/EnzoVezzaro/reposell                  # the CLI (this package — npm: @reposell/cli)
github.com/EnzoVezzaro/reposell-listing          # official listing instance (registry + CI)
github.com/EnzoVezzaro/reposell-community-listing   # community listing frontend
```

Local development may also keep sibling tooling folders alongside them
(`storefront-core/` — document schema + renderer, npm: `@reposell/storefront-core`;
`storefront-studio/` — visual /sell builder, npm: `@reposell/storefront-studio`,
built on GrapesJS). Those are optional and not required to build the CLI;
the Studio runs from anywhere with `npx @reposell/storefront-studio`
(`reposell init` launches it automatically at the end).

Clone and build the CLI:

```bash
git clone https://github.com/EnzoVezzaro/reposell.git
cd reposell

npm install       # dependencies (no workspace root needed)
npm run build     # tsc -> dist/
npm run lint      # oxlint
npm run typecheck # tsc --noEmit
npm test           # vitest run
```

To use your local build as the global `reposell` command:

```bash
cd reposell
npm link
reposell help
```

`npm link` points the global binary at `dist/bin/reposell.js`, so rebuild after changing source.

## Updating

```bash
npm update -g reposell
```

Generated artifacts are versioned independently of the CLI: `reposell.yml` carries a `version` field (currently `1`), and every generated document declares its schema. Upgrading the CLI never mutates your configuration format without a migration path.
