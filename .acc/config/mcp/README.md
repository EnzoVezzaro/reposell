# MCP Bridge Definitions

This directory contains ACC bridges to external services. Bridges reference
standard MCP server configurations rather than redefining them.

## Architecture

**NO SERVER, NO DATABASE, NO DOCKER.** This project is:
- **Static frontend** (Bun + Vite + React + TypeScript + shadcn/ui + Tailwind)
- **CI automation only** (GitHub Actions)
- **Edge functions** (Vercel/Cloudflare Workers) for Stripe checkout creation
- **External services**: GitHub (repo operations), Stripe (payment via embedded checkout)

MCP bridges here are for agent tooling only - they connect to external services
that we do NOT host or manage.

## Structure

```
mcp/
├── github/
│   └── plugin.yaml
└── stripe/
    └── plugin.yaml
```

## Bridge Configuration

Each bridge defines:
- `name` - Bridge identifier
- `type` - MCP server type (stdio, http, sse)
- `command` - Command to start the server (npx for standard MCP servers)
- `args` - Command arguments
- `env` - Environment variables (use `${VAR}` for secrets)
- `tools` - Exposed tool names
- `resources` - Exposed resource URIs

## Example: GitHub Bridge

```yaml
# mcp/github/plugin.yaml
name: github
type: stdio
command: npx
args: ["-y", "@modelcontextprotocol/server-github"]
env:
  GITHUB_TOKEN: "${GITHUB_TOKEN}"
tools:
  - "github_get_repository"
  - "github_list_releases"
  - "github_get_file_contents"
  - "github_create_issue"
```

## Example: Stripe Bridge

```yaml
# mcp/stripe/plugin.yaml
name: stripe
type: stdio
command: npx
args: ["-y", "@modelcontextprotocol/server-stripe"]
env:
  STRIPE_SECRET_KEY: "${STRIPE_SECRET_KEY}"
tools:
  - "stripe_create_checkout_session"
  - "stripe_verify_webhook"
  - "stripe_get_payment_intent"
```

## Usage

Bridges are registered via `acc tools` manifest and can be invoked by
agents through the standard MCP protocol. The bridges themselves are
external dependencies managed by their respective MCP server packages.

## Security

- Never commit real API keys - use environment variables
- Use minimal permissions for each bridge
- Audit bridge tool exposure regularly