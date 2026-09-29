# tools/oxlint

## Purpose

Oxlint plugin assets for this project.

## Ownership

Owner: tools/oxlint (inherits ../AGENTS.md)

## Structure

- `anti-slop/` — vendored anti-slop plugin (see its contract).

## Constraints

- Wired via `oxlint.config.ts` (`jsPlugins`); lint runs with `npm run lint`.
