# reposell CLI

The core developer tool for the reposell repository-to-repository marketplace protocol. It automates repository initialization, `/sell` endpoint generation, `/marketplace` manifest creation, release management, CI/CD workflow generation, and cryptographic identity/signature operations.

## Quickstart

```bash
npm install -g reposell
cd your-repo
reposell init
```

Everything possible happens automatically. The developer should NOT have to manually maintain marketplace manifests, synchronize releases, update marketplace metadata, calculate marketplace fees, synchronize pricing, manually verify signatures, manually register every release, or manually maintain GitHub workflows.

The CLI and CI handle these tasks.

## Core Concept

A developer owns a Git repository. That repository can expose:

- `/sell` — Product sales endpoint (owner-owned, always optional)
- `/marketplace` — Marketplace integration (optional, reposell optional)

The repository remains the source of truth for its product.

The marketplace is OPTIONAL. A repository may:

- **A.** Sell through `/sell` only
- **B.** Sell through `/sell` and register `/marketplace`
- **C.** Register selected releases
- **D.** Automatically expose all future releases

## Commands

| Command | Description |
|---------|-------------|
| `reposell init` | Initialize repository with zero-config defaults |
| `reposell configure` | View/modify configuration |
| `reposell sell` | Generate `/sell` endpoint |
| `reposell marketplace enable` | Enable marketplace integration |
| `reposell marketplace disable` | Disable marketplace integration |
| `reposell marketplace register` | Register with official marketplace |
| `reposell marketplace status` | Check registration status |
| `reposell release` | Manage releases |
| `reposell verify` | Verify signatures and manifests |
| `reposell doctor` | Diagnose repository health |
| `reposell doctor --fix` | Auto-fix safe issues |

## Key Features

- **Zero-config**: All values derivable from Git/GitHub/CI are auto-derived
- **Payment abstraction**: `PaymentProvider` interface with `StripePaymentProvider` implementation
- **Git abstraction**: `GitProvider` interface with `GitHubProvider` implementation
- **Cryptographic identity**: Ed25519 keys for signing manifests and policies
- **Protocol versioning**: All public interfaces versioned (protocol: "reposell", version: "1.0")
- **CI/CD automation**: Generates GitHub Actions workflows for release detection and marketplace sync

## Payment Integration

The CLI generates payment integration using **Stripe Embedded Checkout** - no backend server required. The frontend renders Stripe's checkout UI; an edge function creates the checkout session.

## Documentation

- [CLI Reference](docs/cli-reference.md)
- [Configuration](docs/configuration.md)
- [Protocol Specification](docs/protocol.md)
- [Payment Architecture](docs/payment-architecture.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

MIT - see [LICENSE](LICENSE) for details.