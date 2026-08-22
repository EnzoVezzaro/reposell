# reposell CLI

## Purpose

The reposell CLI is the core developer tool for the reposell repository-to-repository marketplace protocol. It automates repository initialization, `/sell` endpoint generation, `/marketplace` manifest creation, release management, CI/CD workflow generation, and cryptographic identity/signature operations.

## Responsibilities

- Initialize repositories with zero-config defaults (`reposell init`)
- Generate `/sell` endpoint configuration with payment provider abstraction
- Generate `/marketplace` manifest with cryptographic signatures
- Manage release selection (selected/all modes) with CI automation
- Generate GitHub Actions workflows for release detection and marketplace sync
- Provide `reposell doctor` for diagnostics and auto-repair
- Implement PaymentProvider interface with StripePaymentProvider
- Implement GitProvider interface with GitHubProvider
- Handle cryptographic identity (Ed25519 keys, signing, verification, rotation)

## Ownership

Owner: src/cli

## Inputs

- Git repository metadata (auto-derived)
- GitHub repository metadata via GitHub API
- User configuration from `reposell.yml`
- Payment provider credentials (Stripe keys via environment)
- Cryptographic signing keys (via environment/keychain)

## Outputs

- `/sell` endpoint configuration
- `/marketplace/manifest.json` with signatures
- `.github/workflows/reposell.yml` and `reposell-release.yml`
- `reposell.yml` configuration file
- Cryptographic key pairs and public keys
- Diagnostic reports (`reposell doctor`)

## Dependencies

- # Domain layer (to be implemented)
- # Application layer (to be implemented)
- # Infrastructure layer (to be implemented)
- # CLI layer (to be implemented)
- # Config layer (to be implemented)

## Constraints

- Zero-config principle: derive all values from Git/GitHub/CI automatically
- Never hardcode Stripe - use PaymentProvider abstraction
- Never hardcode GitHub - use GitProvider abstraction
- Private keys NEVER committed to Git, npm, CI artifacts, or logs
- All generated files clearly identified, never overwrite user files without confirmation
- Protocol versioning on all public interfaces
- Deterministic output: same input = same output

## Architecture

The CLI follows clean architecture with these layers:

1. **Domain** - Pure business logic: protocol schemas, identity, product, payment, git, marketplace abstractions
2. **Application** - Use cases: commands, services (init, sell, marketplace, release, doctor), generators (workflows, manifests, config)
3. **Infrastructure** - External adapters: GitHub API, Stripe API, Ed25519 crypto, filesystem, CI workflow generation
4. **CLI** - Command framework: parser, command definitions, formatted output
5. **Config** - Configuration management: schema validation (Zod), loading, merging, environment overrides

Commands are composable: `init`, `configure`, `sell`, `marketplace enable|disable|register|status`, `release`, `verify`, `doctor`.

## Workflows

- See `.acc/config/workflows/feature.md` for the standard feature workflow.
- See `.acc/config/workflows/release.md` for the release automation workflow.