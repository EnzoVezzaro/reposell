# src

## Purpose

The reposell CLI source tree, organized as clean architecture (see `.acc/config/standards/architecture.md`).

## Ownership

Owner: src (inherits root AGENTS.md)

## Structure

- `app/` — application services (use-case orchestration)
- `bin/` — executable entry points (`reposell`, `reposell-marketplace`)
- `cli/` — CLI framework glue (banner, prompts)
- `commands/` — command implementations
- `config/` — configuration schema/loading (Zod)
- `domain/` — pure business logic (protocol, licensing, payment, listing, …)
- `utils/` — adapter-style helpers (crypto, env, git)
- `workflows/` — generated workflow artifacts (CI YAML, /sell builder)
- `index.ts` — public programmatic SDK entry

## Constraints

- Layering: domain → application → cli/config; domain stays free of external services.
- Zero-config principle: derive from Git/GitHub/CI, never hardcode.
- Tests are co-located (`*.test.ts`); run `npm test`. See `.acc/config/standards/testing.md`.
