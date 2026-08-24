# reposell CLI

## Give your agent purpose. A codebase an agent can read and understand.

[![Sponsor](https://camo.githubusercontent.com/6fecb16e765c41e46a844f1bb081c8c455885bfa045060631cced117db1e3944/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f73706f6e736f72732f456e7a6f56657a7a61726f3f6c6162656c3d53706f6e736f72266c6f676f3d476974487562)](https://github.com/sponsors/EnzoVezzaro)

[![License: MIT](https://camo.githubusercontent.com/fdf2982b9f5d7489dcf44570e714e3a15fce6253e0cc6b5aa61a075aac2ff71b/68747470733a2f2f696d672e736869656c64732e696f2f6c6963656e73652d4d49542d79656c6c6f772e737667)](https://opensource.org/licenses/MIT)

## Quickstart

```bash
npm install -g @reposell/cli
reposell init
```

Everything possible should then happen automatically. The developer should NOT have to manually maintain marketplace manifests, synchronize releases, update marketplace metadata, calculate marketplace fees, synchronize pricing, manually verify signatures, manually register every release, or manually maintain GitHub workflows.

The CLI and CI should handle these tasks.

## Installation

```bash
# Global install
npm install -g @reposell/cli

# Or from a clone
npm link

# Verify
reposell --version
```

## Core Concept

A developer owns a Git repository. That repository can expose:

- `/sell` - Product sales endpoint (owner-owned, always optional)
- `/marketplace` - Marketplace integration (optional, reposell optional)

The repository remains the source of truth for its product.

## Commands

| Command | Description |
|---------|-------------|
| `reposell init` | Initialize repository with zero-config defaults |
| `reposell configure` | View/modify configuration |
| `reposell sell` | Generate /sell endpoint |
| `reposell marketplace enable` | Enable marketplace integration |
| `reposell marketplace disable` | Disable marketplace integration |
| `reposell marketplace register` | Register with official marketplace |
| `reposell marketplace status` | Check registration status |
| `reposell release` | Manage releases |
| `reposell verify` | Verify signatures and manifests |
| `reposell doctor` | Diagnose repository health |
| `reposell doctor --fix` | Auto-fix safe issues |

## Architecture

The CLI follows clean architecture with zero-config principle:

1. **Domain** - Pure business logic, protocol schemas, identity
2. **Application** - Use cases: init, sell, marketplace, release, doctor
3. **Infrastructure** - External adapters: GitHub (repo operations), Stripe.js, Ed25519 crypto, CI generation
4. **CLI** - Command framework, argument parsing, formatted output
5. **Config** - Configuration management, Zod validation, env overrides

**Key design decisions:**

1. **Zero-Config Derivation**: All values derivable from Git/GitHub/CI are auto-derived (repo name, owner, URL, provider, releases, default metadata, marketplace endpoint)
2. **Payment Abstraction**: PaymentProvider interface with StripePaymentProvider implementation
3. **Git Abstraction**: GitProvider interface with GitHubProvider implementation
4. **Cryptographic Identity**: Ed25519 keys for signing manifests and policies
5. **Protocol Versioning**: All public interfaces versioned (protocol: "reposell", version: "1.0")

## ACC Framework

This repository follows the ACC (Agent Code Context) convention:

- `AGENTS.md` files at each functionality boundary
- `.acc/config/` for project control plane
- `.acc-memory.md` for durable agent knowledge (gitignored)
- `acc check` for validation
- `acc graph` for architecture visualization

Run `acc check` to validate the repository structure.

## Protocol

The reposell protocol version is **1.0**. All manifests include:

```json
{
  "protocol": "reposell",
  "version": "1.0"
}
```

The `/sell` endpoint is owned and operated by the repository owner. reposell does NOT own the repository. reposell does NOT require the repository to be hosted by reposell. reposell does NOT proxy the repository's `/sell` endpoint. The repository can sell independently without using reposell marketplace.

The marketplace is OPTIONAL. A repository may:

- **A.** Sell through `/sell` only
- **B.** Sell through `/sell` and register `/marketplace`
- **C.** Register selected releases
- **D.** Automatically expose all future releases

## License

MIT - see LICENSE for details.