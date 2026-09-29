# .github/workflows

## Purpose

CI/CD workflows for the repository.

## Ownership

Owner: .github/workflows (inherits ../AGENTS.md)

## Responsibilities

- `publish.yml` — npm publish automation.
- `deploy.yml` — GitHub Pages deployment (docs site + optional `/reposell/**` surface).

## Constraints

- Workflows validate before deploying; deployment fails closed (`.acc/config/workflows/verify.md`).
- Generated reposell workflow (`.github/workflows/reposell.yml`) writes ONLY under `/reposell/**`.
