# src/workflows

## Purpose

Generated workflow artifacts: CI workflow YAML and the `/sell` storefront builder.

## Ownership

Owner: src/workflows (inherits ../../AGENTS.md)

## Responsibilities

- `ci.ts` — generates `.github/workflows/reposell.yml` (validate → build → health → Pages).
- `sell.ts` — scaffolds the seller storefront (`.reposell/storefront.json`, `sell/index.html`,
  `sell/styles.css`); never overwrites existing files.

## Dependencies

- src/app
- src/config
- src/utils
- .github/
- .github/workflows
- src/

(One path per line. Trailing slash on single-segment paths: acc 0.6.9 parses those only in
this form. `.github/workflows` is the generated workflow target; `src` covers layout path
references in generated scaffolding.)

## Constraints

- Generated workflow writes ONLY under `/reposell/**` (namespace rule).
- Deterministic generation: same input → byte-identical output.
