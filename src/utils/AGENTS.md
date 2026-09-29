# src/utils

## Purpose

Adapter-style helpers shared across layers: crypto, environment, git metadata.

## Ownership

Owner: src/utils (inherits ../../AGENTS.md)

## Responsibilities

- `crypto.ts` — Ed25519 primitives.
- `env.ts` / `project-env.ts` — environment reading and project-level env detection.
- `git.ts` — git metadata derivation (remote → provider/owner/repo identity).

## Dependencies

- functions/github-auth (OAuth token exchange service used by CLI auth)
- functions/

## Constraints

- Secrets are read, never stored or logged.
- Zero-config: git metadata derivation must not require manual values.
