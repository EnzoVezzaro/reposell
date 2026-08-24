# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-23

### Added
- **Protocol engine**: `/reposell/*` static surface generator (index/manifest/health/releases/sell/marketplace), release state machine (DRAFT→PUBLISHED→BLOCKED), publication gates, Ed25519 build signing, Pages CI workflow
- **License offers**: reusable license schemes (`licensing.schemes` — one-time/recurring, interval, seats, template) bound per release through `offers[]`, each with its own Stripe Payment Link; deep verification is billing-aware (recurring price + interval); legacy per-release pricing/payment removed (clean break)
- **Licensing framework**: rights catalog (23 groups, closed vocabularies), 15 policy profiles, `license compose|explain|validate|compatibility`, machine artifacts (`.reposell/license.json`, `ai-policy.json`, `commercial-policy.json`, `authorization.json`), SPDX expression parser + family compatibility matrix, policy sha256 bound into signed release manifests
- **`reposell audit`**: full-repository compliance audit — scanner (LICENSE/NOTICE/manifests/lockfile/source headers), 10+ checks, PASS/WARN/BLOCKED verdict, `--json --ci --strict --release --forbidden`, SPDX 2.3 + CycloneDX 1.5 SBOMs, signed audit reports
- **Listing separation**: `listing publish` (PR payload `reposell-listing/v1` + live /sell health check), discovery-link metadata (purpose-bound, seller-fields structurally excluded), `sell sync` (pull-based fulfillment: purchases, refunds→revocation) + fork provisioning artifacts (`REPOSELL-PURCHASE.json`)
- **Docs site**: new landing (FaultyTerminal hero with per-character decrypt reveal, 4 exclusive theme layers with per-theme hero components, autoplay + glitch transitions, theme-author credit badges), licensing/audit/commands documentation
- **Landing kit**: ThemeSwitcher (picker + autoplay play/stop), LandingHero (4 structurally different heroes), FooterWordmark, VersionChip, per-theme CSS layers scoped by `data-theme`

### Fixed
- Theme contrast: all hardcoded palette colors in landing CSS tokenized (`--lx-*`); light themes (cartoon) no longer render dark-on-dark
- `lx-boot` pre-paint class no longer sticks on non-security themes (hero content stayed invisible)
- Embedded JSON in `/sell` escapes `</script>` (XSS vector)
- Restored missing Pages deploy workflows; broken root docs scripts
- Pre-paint font loading for all theme identities

### Changed
- Package version 0.1.0 (honest pre-1.0); footer/nav version chip reads package.json
- `reposell-listing`/`reposell-listing-public` docs landings unified with the CLI landing system

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
- Manifest schemas (/sell, /listing) versioned
- Configuration schema (reposell.yml)
- CLI commands: init, configure, sell, listing, release, verify, doctor
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
- `/listing` manifest generation
- Release selection (selected/all mode)
- Listing registration workflow
- Key rotation support (trust documents)
- Signature expiration/revocation
- Public key distribution
- `reposell doctor --fix` auto-repair