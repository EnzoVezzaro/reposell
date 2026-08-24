---
title: Installation
description: Install the reposell CLI globally with npm, verify the install, or build it from source inside the npm-workspaces monorepo.
---

# Installation

## Requirements

| Requirement | Version | Why |
|-------------|---------|-----|
| Node.js | >= 18 | The CLI ships as an ES module (`"type": "module"`) and targets modern Node |
| npm | bundled with Node | Used for the global install |
| Git | any recent version | Repository metadata is derived from your `origin` remote |

The monorepo enforces `"engines": { "node": ">=18.0.0" }`, and the generated CI workflow pins Node 20. If you develop with Bun, the published CLI still runs on Node — target repositories need no Bun/TS toolchain.

## Global install

```bash
npm install -g @reposell/cli
```

This installs two executables (declared in the package `bin` field):

| Binary | Purpose |
|--------|---------|
| `reposell` | The main CLI (`init`, `release`, `publish`, `build`, `validate`, ...) |
| `reposell-listing` | Listing-side tooling for listing operators |

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

Running `reposell` with no arguments prints the same output. Note: there is currently no `--version` flag — the parser treats it as an unknown command. Track [the issue tracker](https://github.com/EnzoVezzaro/reposell/issues) for progress.

## Next step

Head to [Quick Start](/guide/quick-start) and run `reposell init` inside your repository.

## Build from source

The reposell ecosystem lives in a single npm-workspaces repository with three packages:

```
reposell-all/
├── reposell/                 # the CLI (this package)
├── reposell-listing/         # official listing instance
└── reposell-listing-public/  # community listing instance
```

Clone and build:

```bash
git clone https://github.com/EnzoVezzaro/reposell.git
cd reposell

# workspace-aware install at the ecosystem root also works:
#   npm install   (from the parent directory)

npm run build      # tsc -> dist/
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
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
