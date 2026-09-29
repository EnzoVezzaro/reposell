# MCP Bridge Definitions (optional boundary)

MCP is an **optional integration boundary** for this project — not a dependency. This directory
holds dormant bridge definitions (GitHub, Stripe) for agent tooling; nothing here is active
until registered.

## Single source of truth

If a bridge is ever activated, it is registered **once**, natively in `opencode.json` under the
`mcp` key (that is the only registration point). The `*.yaml` files here are human-readable
definitions/specs — do not maintain parallel runtime configuration elsewhere.

## Security

- Never commit real API keys — use environment variables (`${VAR}` shape).
- Use minimal permissions per bridge; audit tool exposure regularly.
- The repositories' own abstractions stay authoritative: payment behind `PaymentProvider`, git
  behind `GitProvider` (see `.acc/config/standards/architecture.md`) — MCP never bypasses them.

## Files

- `github.yaml` — GitHub MCP bridge definition (dormant)
- `stripe.yaml` — Stripe MCP bridge definition (dormant)
