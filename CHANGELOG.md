# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-08-22

### Added
- Initial repository structure with ACC framework
- Zero-config CLI foundation with composable commands
- Payment provider abstraction (PaymentProvider interface)
- StripePaymentProvider implementation
- Git provider abstraction (GitProvider interface)
- GitHubProvider implementation
- Cryptographic identity (Ed25519 key generation, signing, verification)
- Protocol versioning system (protocol: "reposell", version: "1.0")
- Repository identity model (canonical URL, provider, owner, repo, ID)
- Manifest schemas (/sell, /marketplace) versioned
- Configuration schema (reposell.yml)
- CLI commands: init, configure, sell, marketplace, release, verify, doctor
- CI/CD workflow generation (.github/workflows/reposell.yml, reposell-release.yml)
- Anti-slop Oxlint plugin (14 generic rules at error level)
- Impeccable design/UX skill
- ACC framework integration (AGENTS.md, .acc/config/, .acc-memory.md)
- Custom open-source licensing scheme
- AI contribution verification (.github/pr_allow_providers.yml)
- Payment architecture documentation (Stripe Embedded Checkout + Connect)

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Private keys NEVER committed to Git, npm, CI artifacts, or logs
- Stripe webhook signature verification mandatory
- Payment confirmation never trusted from browser
- All financial operations idempotent
- Input/output validation on all manifests

## [Unreleased]

### Planned
- `/sell` endpoint generation
- `/marketplace` manifest generation
- Release selection (selected/all mode)
- Marketplace registration workflow
- Key rotation support (trust documents)
- Signature expiration/revocation
- Public key distribution
- `reposell doctor --fix` auto-repair