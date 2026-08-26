# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.18] - 2026-08-26

### Changed
- **Listing PRs are pointer-only**: the PR carries just `repository @ release` + the `/sell` URL — zero seller-authored listing data. Listing CI now derives every listed field live from the seller's endpoints (embedded `/sell` document: identity, available release, verified Payment Link, seller-declared discovery contribution) and commits the derived registry record into the PR branch before merge
- The /sell page embeds its repository identity and the seller-configured discovery contribution so CI has a trustworthy source of truth

### Fixed
- Live /sell health check no longer reads an undefined repository field

## [0.1.17] - 2026-08-26

### Added
- **Publication opens the Listing PR automatically** when the seller opted in during init: fork → branch → `listing/<repo>-<release>.json` (+ PR payload) → PR on `EnzoVezzaro/reposell-listing` — CI verifies fail-closed, PASS auto-merges, discovery link provisions, store is listed. Failures never block the release and print retry guidance
- Listing record + file paths are derived deterministically from the verified payload

### Fixed
- The seller's /sell endpoint default is now `https://<owner>.github.io/<repo>/sell/` (was the protocol-surface path `/reposell/sell/`)

## [0.1.16] - 2026-08-26

### Fixed
- Generated pages now use **relative links** (`./sell/`, `./manifest.json`) — absolute `/reposell/*` paths 404'd on GitHub project Pages (`/<repo>/` subpath hosting). Works identically on custom domains
- `reposell init` **enables GitHub Pages for you** via `gh` (Source: GitHub Actions, idempotent) — first push deploys; CI stays least-privilege (the `administration` permission is not grantable to workflow tokens, so enablement happens at init where admin rights exist)

## [0.1.15] - 2026-08-26

### Fixed
- Generated workflow: `configure-pages` could not create the Pages site on fresh repos — enablement moved to init (see 0.1.16); workflow permissions stay minimal

## [0.1.14] - 2026-08-26

### Fixed
- **Port 5199 is now self-healing**: before launching the /sell builder, the CLI terminates any stale or foreign process squatting on the port (and retries once if a zombie reappears) — `lsof | kill` cleanup is never needed, standalone `npx @reposell/storefront-studio` includes the same guard (`@reposell/storefront-studio@0.2.2`)

## [0.1.13] - 2026-08-26

### Added
- `reposell publish` with no tag now **picks a recorded release for you** (drafts first; menu when several) and **walks through `reposell release` automatically when nothing is recorded yet**

### Fixed
- The /sell builder now opens reliably after init: cold npx installs get a 90s readiness window, and the browser also opens when the builder was already running
- Studio canvas shows the real layout again (shell wrapper preserved) — `@reposell/storefront-studio@0.2.1`

## [0.1.12] - 2026-08-26

### Added
- `reposell release` now **attaches to GitHub releases**: with a tag omitted it lists the repository's own GitHub Releases to pick from, creates one on demand if none exists, and refuses nothing silently
- Tags normalize (`reposell release 0.1.0` ↔ `v0.1.0`) so wizard-recorded pricing always matches
- Never re-asks what init collected: price/currency are **read automatically from your Payment Link** via the saved Stripe key (env/`.env`); the link itself is reused from prior records

### Fixed
- The false `⚠ build is unsigned` warning after init: the signing key is now also saved to `.env` (gitignored), and gate evaluation merges `.env` values — local runs sign truthfully

## [0.1.11] - 2026-08-26

### Changed
- Listing pitch corrected: **the seller decides the discovery contribution** buyers pay to discover the tool (buyer-paid on top of the seller's price — the seller keeps 100% of their /sell revenue)
- The /sell builder is now fully zero-configuration (`@reposell/storefront-studio@0.2`): no environment variables — it operates on `<cwd>/.reposell/storefront.json` → `sell/` by convention; all dev-only env shortcuts removed

## [0.1.10] - 2026-08-26

### Added
- The init wizard now asks **"List this tool on listing.reposell.dev?"** with the funding pitch (one-person project; buyers may add a voluntary contribution; you keep 100% of your /sell revenue — a contribution costs you nothing), then offers $5/$10/$25/$50/custom
- Choice persisted to `reposell.yml` (`listing.enabled` + `listing.contribution`, validated); `reposell listing publish` uses it as the discovery-price default
- Listing CI (reposell-listing) now **auto-merges verified Listing PRs** — PASS → squash-merge → discovery link provisioned → listed

## [0.1.9] - 2026-08-25

### Fixed
- `reposell release <tag>` no longer re-asks the price when the tag already carries a recorded offer (e.g. from the wizard) — it reuses the recorded pricing/link silently; flags still override
- The starter `/sell` page ships with a **disabled buy CTA**: checkout activates only on the deployed `/reposell/*` surface once a release is available (the Payment Link stays on record in `.reposell/storefront.json` for that hand-off)

## [0.1.8] - 2026-08-25

### Added
- The wizard **offers the Stripe secret key inline** when it needs one and none is configured: entered keys are validated, saved to `.env` (gitignored automatically), and used to read the price straight from the Payment Link — no manual price entry
- Key is only asked for when actually needed (a link was provided and none is configured); everything else proceeds without it

## [0.1.7] - 2026-08-25

### Added
- The init wizard now **auto-detects price and currency from your Stripe Payment Link** (official API) whenever a secret key is available in the environment or `.env` — no more typing the price twice; it falls back to the manual prompt otherwise

## [0.1.6] - 2026-08-25

### Added
- The init wizard now **opens the /sell builder automatically** at the end: launches `@reposell/storefront-studio` via npx against the repository (document `.reposell/storefront.json`, output `sell/`) and opens the browser at http://localhost:5199
- New `/sell builder` identity: template matches the reposell landing pages (signal green on ink, Syne/Oxanium/Outfit/Geist Mono, chamfered edges) and is fork-centric — buyers never see the source repository

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
