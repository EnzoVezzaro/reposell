# functions

## Purpose

Edge functions (Cloudflare Workers) supporting the reposell platform.

## Ownership

Owner: functions (inherits ../AGENTS.md)

## Structure

- `github-auth/` — GitHub OAuth token exchange worker.

## Constraints

- No secrets in code; secrets are Cloudflare secrets (`wrangler secret put`).
- Edge functions are minimal by design — no backend infrastructure beyond them.
