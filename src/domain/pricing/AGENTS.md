# src/domain/pricing

## Purpose

Marketplace Pricing Endpoint verification chain (spec §20, §23).

## Ownership

Owner: src/domain/pricing (inherits ../AGENTS.md)

## Responsibilities

- `endpoint.ts` — fetch config → fetch signature → verify signature → validate schema →
  validate expiration/version → accept.

## Constraints

- ANY failure BLOCKs — community marketplaces can never silently alter economic rules.
