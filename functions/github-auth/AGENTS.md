# functions/github-auth

## Purpose

Cloudflare Worker: exchanges a GitHub OAuth authorization code for a user access token
(`POST /exchange`) so the CLI can authenticate without exposing the client secret.

## Ownership

Owner: functions/github-auth (inherits ../AGENTS.md)

## Responsibilities

- `worker.js` — OAuth code→token exchange; `wrangler.toml` — deploy config.

## Constraints

- `GITHUB_CLIENT_SECRET` lives only as a Cloudflare secret — never in code, logs, or the browser.
- Minimal permissions; narrow CORS; no user data retention.
