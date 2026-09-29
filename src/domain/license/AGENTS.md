# src/domain/license

## Purpose

SPDX license detection and parsing, plus human license templates.

## Ownership

Owner: src/domain/license (inherits ../AGENTS.md)

## Responsibilities

- `detect.ts` — detect license identity from repository files.
- `spdx.ts` — SPDX expression parsing (AND/OR/WITH + parens).
- `templates.ts` — human LICENSE section templates.

## Constraints

- SPDX 2.3 vocabulary only; parsing is strict, no silent coercion.

## Dependencies

- branding/
- docs/
- tools/
