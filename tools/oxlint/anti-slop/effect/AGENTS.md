# tools/oxlint/anti-slop/effect

## Purpose

Effect-specific anti-slop rules, activated only when `effect` is a direct dependency.

## Ownership

Owner: tools/oxlint/anti-slop — VENDORED third-party code (see ../AGENTS.md).

## Structure

- `rules/` — Effect rule modules.
- `index.ts` — Effect plugin entry.

## Constraints

- Vendored; `effect` is not currently a dependency of this project, so this tree is dormant.
