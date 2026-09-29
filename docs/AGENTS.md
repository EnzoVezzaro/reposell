# docs

## Purpose

The VitePress product documentation site (guides, commands, configuration, security) with the
custom brand theme.

## Ownership

Owner: docs (inherits ../AGENTS.md)

## Structure

- `.vitepress/` — site config + theme (see its contract).
- Content areas: `guide/`, `commands/`, `configuration/`, `development/`, `security/`,
  `architecture/`, `auth/`, `why/`, `PRODUCT.md`.
- Generated: `.vitepress/dist`, `.vitepress/cache` (never edited by hand).

## Commands

- `npm run docs:dev` / `docs:build` / `docs:preview` (scripts in `package.json`).

## Constraints

- Docs reflect reality — update alongside behavior changes (Definition of Done, root AGENTS.md).
- UI changes are verified with ego lite (`.acc/config/standards/testing.md`).
