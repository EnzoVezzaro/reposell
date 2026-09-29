# src/domain/licensing

## Purpose

The licensing framework: rights catalog, policy composition, license schemes × release offers, compatibility.

## Ownership

Owner: src/domain/licensing (inherits ../AGENTS.md)

## Responsibilities

- `rights.ts` — rights catalog (closed vocabularies).
- `policy.ts` — 15 policy profiles; compose(profile+spdx+overrides) → canonical policy + sha256 `policyHash`.
- `schemes.ts` — `licensing.schemes` × `releases[].offers[]` resolution (per-offer Stripe link).
- `compatibility.ts` — SPDX family compatibility matrix.
- `generate.ts` — `.reposell/{license,ai-policy,commercial-policy,authorization}.json` artifacts.

## Constraints

- Offers are a clean break: no legacy per-release pricing fields; every offer is validated.
- `policyHash` is embedded in release manifests; canonical JSON is deterministic.

## Dependencies

- docs/
