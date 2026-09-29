# src/domain/audit

## Purpose

Compliance audit: repository scan, license/dependency checks, SBOM generation.

## Ownership

Owner: src/domain/audit (inherits ../AGENTS.md)

## Responsibilities

- `scan.ts` — bounded walk over LICENSE/NOTICE/manifests/lockfiles/headers.
- `checks.ts` — compatibility, copyleft, forbidden, NOTICE coherence checks.
- `sbom.ts` — SPDX 2.3 + CycloneDX 1.5 SBOMs.

## Outputs

- Verdict PASS/WARN/BLOCKED; artifacts under `.reposell/audit/` (signed when key present).

## Constraints

- Fail-closed on BLOCK-class findings; verdicts carry machine-readable reasons.
