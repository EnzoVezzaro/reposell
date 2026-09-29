# tools/oxlint/anti-slop

## Purpose

Vendored copy of the anti-slop Oxlint plugin (dmmulroy/anti-slop, MIT) rejecting
low-evidence TypeScript/JavaScript patterns.

## Ownership

Owner: tools/oxlint/anti-slop — VENDORED third-party code.

## Structure

- `rules/` — the generic rule set.
- `shared/` — shared analysis helpers.
- `effect/` — Effect-specific rules (active only when `effect` is a dependency).
- `index.ts` — plugin entry.

## Constraints

- VENDORED: do not hand-edit rules to change behavior for one call site. Sync with upstream via
  the `install-anti-slop` skill; local deviations must be documented in `.acc-memory.md`.
- Rule configuration lives in `oxlint.config.ts` only (see `.acc/config/skills/anti-slop.md`).
