# Development

Everything you need to work on the reposell CLI itself. The codebase is TypeScript with a clean layered architecture, colocated tests and zero-config determinism as a hard rule.

## Setup

```bash
# Clone (this is the CLI workspace of the reposell monorepo)
git clone https://github.com/EnzoVezzaro/reposell.git
cd reposell

# Install dependencies (from the monorepo root)
npm install

# Build the CLI
npm run build          # or: npx tsc -p tsconfig.json
```

Requires **Node >= 18**.

## Project layout

```
src/
├── bin/          # executables: reposell.ts, reposell-listing.ts
├── cli/          # banner + CLI-only presentation helpers
├── commands/     # one file per command (init, release, verify, …)
├── app/          # application services (build, config, license, signing, …)
├── domain/       # pure business logic: protocol docs, payment, license, crypto
├── config/       # reposell.yml schema + validation
├── utils/        # git, crypto, env, guards
└── workflows/    # GitHub Actions workflow generation
```

Tests are colocated with their modules as `*.test.ts` (e.g. `src/domain/license/templates.test.ts`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile to `dist/` with `tsc` |
| `npm run test` | Run the test suite (Vitest) |
| `npm run lint` / `npm run oxlint` | Lint with oxlint (anti-slop rules included) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run docs:dev` / `docs:build` | VitePress docs (from the monorepo root) |

Run any of them from the monorepo root with `--workspaces` to cover every package, or inside `reposell/` for the CLI alone.

## Extending

- [Adding Commands](/development/adding-commands)
- [Adding Payment Providers](/development/adding-payment-providers)
- [Adding Git Providers](/development/adding-git-providers)
- [Testing](/development/testing) · [Testing the CI flow](/development/testing-ci)

## Ground rules

1. **Deterministic output** — same input, same output. No timestamps in generated artifacts.
2. **Fail closed** — ambiguity blocks; it never silently recovers.
3. **Pure domain** — `src/domain/` stays free of I/O; services own the side effects.
4. **Secrets never land** — private keys exist only in env vars and are never written, logged or committed.
