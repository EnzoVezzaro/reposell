# src/domain/selling

## Purpose

Seller-side fulfillment: `sell sync` and fork provisioning artifacts.

## Ownership

Owner: src/domain/selling (inherits ../AGENTS.md)

## Responsibilities

- `sync.ts` — pull checkout sessions → purchase records → refund revocation (seller key only).
- `provision.ts` — REPOSELL-PURCHASE.json / REPOSELL-RECIPROCITY.json with deterministic
  fingerprints binding buyer+repo+release+scheme+session.

## Constraints

- Seller Stripe key only; buyer data minimization; revocation is authoritative on refund.
