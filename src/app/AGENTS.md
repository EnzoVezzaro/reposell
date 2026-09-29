# src/app

## Purpose

Application layer: use-case services that orchestrate domain logic for the CLI commands.

## Ownership

Owner: src/app (inherits ../../AGENTS.md)

## Responsibilities

- Services: `build-service`, `config-service`, `license-service`, `license-compose-service`, `listing-service`, `listing-announcer`, `audit-service`, `signing-service`, `validation-service`, `evaluate-release`, `marketplace-client`, `pages`, `sell-template`.

## Inputs

- Validated configuration (`src/config`), domain objects, CLI-supplied arguments.

## Outputs

- Generated artifacts (`dist/reposell/**`, manifests), service results for command formatting.

## Dependencies

- src/domain, src/config, src/utils
- .github/workflows (generated workflow artifacts)
- .github/
- docs/

## Constraints

- No CLI output/formatting here — commands format; services return typed results.
- `build-service` prefers `.reposell/storefront.json` when present (fail-open to built-in page).
- Never overwrite user files without confirmation (generated-file rules in root AGENTS.md).
