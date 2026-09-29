# src/domain/reciprocity

## Purpose

Seller-configured, buyer-enforced reciprocity program.

## Ownership

Owner: src/domain/reciprocity (inherits ../AGENTS.md)

## Responsibilities

- `program.ts` — program model, strict validation, canonical fingerprint, contribution computation.

## Constraints

- Forks always carry the program; the seller's own revenue is bound only via `apply_to_own_use`.
- Fingerprint is deep-sorted canonical JSON (deterministic).
