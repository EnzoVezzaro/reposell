# src/domain/release

## Purpose

Release state machine and version parsing.

## Ownership

Owner: src/domain/release (inherits ../AGENTS.md)

## Responsibilities

- `state.ts` — DRAFT → VALIDATING → BLOCKED | PUBLISHED → HEALTHY | UNHEALTHY, persisted in
  `.reposell/releases.json`; BLOCKED carries a machine-readable reason.
- `version.ts` — version/tag parsing.

## Constraints

- Isolation rule: one release's failure never mutates another release's state.
