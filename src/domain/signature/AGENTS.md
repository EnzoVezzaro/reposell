# src/domain/signature

## Purpose

Ed25519 signature envelope for manifests and reports — the repo's single signing primitive.

## Ownership

Owner: src/domain/signature (inherits root AGENTS.md)

## Responsibilities

- Build and parse signed envelopes (`envelope.ts`): payload + public key + signature.
- Verify signatures fail-closed before any manifest/report is trusted.

## Inputs

- Canonicalized document payloads; signing keys resolved from environment/keychain.

## Outputs

- Signed envelope records; verification results.

## Dependencies

- src/utils (crypto primitives)
- Root contract: ../../AGENTS.md

## Constraints

- Private keys NEVER committed to Git, npm, CI artifacts, or logs.
- Deterministic output: same input → byte-identical envelope.
