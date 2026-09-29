# .github

## Purpose

GitHub project configuration: CI workflows and the AI contribution declaration policy.

## Ownership

Owner: .github (inherits ../AGENTS.md)

## Structure

- `workflows/` — CI/CD workflows (see its contract).
- `pr.yml.example` / `pr_allow_providers.yml` — AI contribution declaration + provider/harness allowlist.
- `FUNDING.yml` — sponsorship links.

## Constraints

- Keep `pr_allow_providers.yml` in sync across the reposell repositories.
- Never commit secrets; workflows read them from GitHub Secrets only.
