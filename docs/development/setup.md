---
title: Development Setup
description: Set up a local development environment for the reposell CLI.
---

# Development Setup

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | >= 18.0.0 (enforced by `engines` in both root and workspace `package.json`) |
| npm | 10.x (declared via `packageManager: npm@10.0.0`) |
| Git | Any recent version; the CLI shells out to `git` |

TypeScript, oxlint, and Vitest are installed as devDependencies of the `reposell` workspace — nothing global is required.

## Repository Layout

The project is an npm-workspaces monorepo:

```text
reposell-all/
├── package.json              # root: workspaces + fan-out scripts
├── reposell/                 # the CLI (this package)
│   ├── src/
│   ├── tsconfig.json
│   ├── oxlint.config.ts
│   └── docs/
├── reposell-listing/
└── reposell-community-listing/
```

## Install

Install once from the monorepo root — this links all three workspaces:

```bash
git clone https://github.com/EnzoVezzaro/reposell.git
cd reposell-all
npm install
```

## Build

The CLI compiles with plain `tsc`. Output goes to `reposell/dist/`; both binaries declared in `package.json` (`dist/bin/reposell.js`, `dist/bin/reposell-listing.js`) land there:

```bash
# from the monorepo root
npm run build -w reposell

# or from reposell/
npm run build
```

There is no root-level `build` script — builds are per-workspace.

Run the local binary after building:

```bash
node reposell/dist/bin/reposell.js help
```

## Scripts

Root scripts fan out to every workspace with `--workspaces`. Per-workspace scripts do the actual work.

| Task | From monorepo root | From `reposell/` |
|------|--------------------|------------------|
| Lint | `npm run lint` | `npm run lint` (runs `oxlint`) |
| Typecheck | `npm run typecheck` | `npm run typecheck` (`tsc --noEmit`) |
| Test | `npm run test` | `npm run test` (`vitest run`) |
| Watch tests | — | `npm run test:watch` |
| Build | — | `npm run build` |
| Docs dev server | `npm run docs:dev:cli` | `npm run docs:dev` |

Run a task for one workspace from the root:

```bash
npm run test -w reposell
```

## TypeScript Configuration

`reposell/tsconfig.json` targets ES2022 with `NodeNext` module resolution (the package is `"type": "module"` — imports use `.js` extensions). Strictness is beyond the default `strict: true`:

| Flag | Effect |
|------|--------|
| `strict` | All strict-mode checks |
| `noUncheckedIndexedAccess` | Index access returns `T \| undefined` — expect explicit guards |
| `noImplicitOverride` | `override` keyword required on overrides |
| `noPropertyAccessFromIndexSignature` | Env-style records need bracket access (`env['KEY']`) |

Output options: `declaration`, `declarationMap`, and `sourceMap` are on; `outDir` is `./dist`, `rootDir` is `./src`.

Test files are excluded from compilation (`"exclude": ["node_modules", "dist", "**/*.test.ts"]`). They still typecheck through Vitest's own transform, and `tsc --noEmit` covers them because `include` is `src/**/*` — the exclusion applies to emit.

## Linting

Linting is [oxlint](https://oxc.rs) with the config in `reposell/oxlint.config.ts`:

```bash
npm run lint        # from reposell/ — same as npm run oxlint
```

Notable configuration:

- Generated/vendor directories (`dist`, `node_modules`, docs caches, agent folders) are ignored via `ignorePatterns`.
- A custom `anti-slop` JS plugin is loaded from `tools/oxlint/anti-slop/index.ts`.
- Anti-slop rules are all `error`, including `no-module-mocking`, `no-object-parameters`, `no-chained-type-assertions`, and `require-safety-comment-for-type-assertion`. Code that violates these will not pass CI — see [/development/testing](/development/testing) for how this shapes test style.

## Verify Your Setup

From `reposell/`:

```bash
npm run typecheck && npm run lint && npm run test
```

All three must pass before opening a PR. CI runs the same checks — see [/development/testing-ci](/development/testing-ci).
