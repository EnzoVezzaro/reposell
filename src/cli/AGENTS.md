# src/cli

## Purpose

CLI framework glue: terminal banner and interactive prompts.

## Ownership

Owner: src/cli

(The root contract claims the same owner for the project; this contract narrows it to this
directory.)

## Responsibilities

- `banner.ts` — startup banner/output framing.
- `prompts.ts` — interactive prompts (init wizard, confirmations).

## Dependencies

- src/utils

## Constraints

- Command logic lives in `src/commands/`, not here.
- Prompts must never echo secrets (keys, tokens).
