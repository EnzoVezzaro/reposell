# src/domain/listing

## Purpose

Listing ⇄ /sell separation: listing PR payloads, discovery records, health checks.

## Ownership

Owner: src/domain/listing (inherits ../AGENTS.md)

## Responsibilities

- `pr.ts` — listing publication PR payload (build/validate fail-closed).
- `discovery.ts` — discovery-side pricing/records (immutable per release).
- `health.ts` — live `/sell` health checks.

## Constraints

- HARD INVARIANT: the listing charges only for discovery; seller `/sell` stays fully
  independent. Seller link changed/missing → BLOCKED (spec §19 negatives are tested).
