# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-08-25

### Added
- `reposell init` is now a guided wizard (TTY): product name → license policy → Stripe Payment Link → first draft release → signing-key storage via `gh secret set`, ending with a status/next-steps summary and a READY gate check
- `/sell builder` — runs automatically at the end of the init wizard (also standalone: `reposell sell init [--link URL] [--name NAME]`); scaffolds an editable storefront (`sell/index.html`, `styles.css`, `scripts.js`) with the wizard's Stripe Payment Link wired into every buy CTA, plus `.reposell/storefront.json` for the Studio; never overwrites existing files
- Sell template uses the reposell landing identity (signal green on ink, Syne/Oxanium/Outfit/Geist Mono, chamfered edges) and is fork-centric — buyers get a fork of the signed release and the page never exposes the source repository
- `init --wizard` forces the wizard without a TTY; `init --yes` keeps CI/non-interactive behavior explicit
- New buffered prompt engine (`src/cli/prompts.ts`) — piped/scripted answers are queued FIFO, so early input is never lost

### Fixed
- ASCII banner redrawn on a strict grid — the "R" mark no longer renders as misaligned noise
- `reposell init` config template now includes `licensing.schemes` (reuses `renderDefaultYml`), so fresh repos pass publication gates instead of failing with "licensing.schemes is not configured"
- `reposell license use rsl --holder …` was rejected with `unknown flag: rsl` — flavor positional now parsed
- Wizard degrades gracefully when stdin ends early: scaffolding completes and the transcript reports what was skipped

## [0.1.4] - 2026-08-24

### Fixed
- JS syntax errors in FaultyTerminal plain-JS script (TS annotations removed from .js file)
- Theme header/menu now follows the selected theme — appearance re-applied on every theme switch via MutationObserver
- Silent jurisdiction defaults removed from legal text — `[JURISDICTION]` stays literal until the owner sets it explicitly
- LICENSE governing law set to template default (Delaware, USA)
- Package name corrected to `reposell` (matches bin command)
- LICENSE/package.json alignment (custom reposell license, not MIT)
- Removed unused `isCanonicalObject` export from crypto utils
- Removed unreferenced `src/utils/guards.ts`
- `git.ts` fallback now uses `cwd` parameter instead of `process.cwd()`
- Added `--version`/`-v` flag to CLI
- `@ts-expect-error` for optional `reposell-storefront-core` dynamic import
- Removed stale monorepo workspace references from root package.json

## [0.1.3] - 2026-08-24

### Fixed
- LICENSE governing law corrected (Dominican Republic → Delaware, USA)
- Package.json import paths for Pages build
- Regenerated stale lockfile

## [0.1.2] - 2026-08-24

### Changed
- Vendored `branding/` into the repo for GitHub Pages builds (self-contained imports)
- Single Pages deploy workflow (docs landing + optional `/reposell/*` protocol surface)
- Corrected repo model in docs — three independent repositories, not a monorepo

### Fixed
- Stale install command in IMPLEMENTATION.md
- README command table reflects the real CLI surface

## [0.1.1] - 2026-08-24

### Added
- **Reciprocity Program**: seller-configured, buyer-enforced — purchased forks carry the program manifest
- `storefront.json` wiring in `buildSite`
- npm publish preparation (`@reposell/cli`)
- GitHub Sponsors support link

### Changed
- Icon-only navbar on CLI docs (`siteTitle: false`, page titles unchanged)

## [0.1.0] - 2026-08-23

### Added
- **Protocol engine**: `/reposell/*` static surface generator, release state machine, publication gates, Ed25519 build signing, Pages CI workflow
- **License offers**: reusable license schemes bound per release through `offers[]`, each with its own Stripe Payment Link
- **Licensing framework**: rights catalog, 15 policy profiles, `license compose|explain|validate|compatibility`, machine artifacts, SPDX expression parser
- **`reposell audit`**: full-repository compliance audit — PASS/WARN/BLOCKED, SBOMs, signed audit reports
- **Listing separation**: `listing publish`, `sell sync`, fork provisioning artifacts
- **Docs site**: new landing (FaultyTerminal hero, 4 theme layers, autoplay + glitch transitions)
- Payment provider abstraction (`PaymentProvider` interface with `StripePaymentProvider`)
- Git provider abstraction (`GitProvider` interface with `GitHubProvider`)
- Cryptographic identity (Ed25519 keys, signing, verification)
- CLI commands: init, license, listing, release, publish, validate, build, health, verify, keys

### Fixed
- Theme contrast: all hardcoded palette colors tokenized
- `lx-boot` pre-paint class no longer sticks on non-security themes
- Embedded JSON in `/sell` escapes `</script>` (XSS vector)
- Restored missing Pages deploy workflows

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
- CI/CD workflow generation (.github/workflows/reposell.yml, reposell-release.yml)
- Anti-slop Oxlint plugin (14 generic rules at error level)
- ACC framework integration (AGENTS.md, .acc/config/, .acc-memory.md)
- Custom open-source licensing scheme
