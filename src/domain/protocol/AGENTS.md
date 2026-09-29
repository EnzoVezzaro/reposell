# src/domain/protocol

## Purpose

Versioned protocol documents (`reposell/manifest/v1`, `reposell/release/v1`, health, releases index).

## Ownership

Owner: src/domain/protocol (inherits ../AGENTS.md)

## Responsibilities

- `documents.ts` — protocol document builders/parsers with schema versioning.

## Constraints

- All public documents carry `protocol` + `version`; deterministic canonical JSON.
- Protocol evolution follows the D10–D15 decisions in IMPLEMENTATION.md.
