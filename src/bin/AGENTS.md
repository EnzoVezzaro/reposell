# src/bin

## Purpose

Executable entry points wired to the command implementations.

## Ownership

Owner: src/bin (inherits ../../AGENTS.md)

## Responsibilities

- `reposell.ts` — main CLI binary.
- `reposell-marketplace.ts` — marketplace CLI binary.

## Dependencies

- src/commands, src/cli

## Constraints

- Thin wiring only — no business logic in entry points.
- Bins are name-matched in package.json so `npx @reposell/cli` works.
