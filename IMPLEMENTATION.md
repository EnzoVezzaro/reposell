# reposell CLI - Implementation Tracker

## Repository
- **URL**: https://github.com/EnzoVezzaro/reposell
- **Product**: reposell CLI
- **Current State**: Active development — CLI implemented (51 tests, bin, license engine, listing dashboard); protocol vNext (D10–D15) pending — see section "Protocol Evolution Implementation Plan"

---

## 1. Current State

| Aspect | Status |
|--------|--------|
| Repository Structure | Empty (only README.md) |
| Package Management | Configured (Bun + TypeScript) |
| Source Code | ACC + anti-slop installed |
| Tests | None (unit tests to add) |
| CI/CD | GitHub Actions workflows generated |
| Documentation | IMPLEMENTATION.md + all required docs |
| Configuration | reposell.yml schema + auto-derive |
| CLI Entry Point | reposell command |

---

## 2. Architecture Discovered

Greenfield CLI implementation following the reposell protocol with zero-config principle, ACC framework, and anti-slop linting.

---

## 3. Existing Functionality

None - greenfield CLI.

---

## 4. Missing Functionality (Per Master Prompt)

### Phase 1: Repository Inspection & Architecture
- [x] Project setup with package.json, tsconfig.json
- [x] ACC framework initialized (.acc/config/, AGENTS.md)
- [x] anti-slop Oxlint plugin installed
- [x] Git provider auto-detection from git remote
- [x] Zero-config principle: derive repo metadata from Git/GitHub

### Phase 2: Core reposell Protocol
- [x] Protocol versioning system (protocol: "reposell", version: "1.0")
- [x] Repository identity model (canonical URL, provider, owner, repo, ID)
- [x] Manifest schemas (/sell, /listing) versioned
- [x] Configuration schema (reposell.yml)
- [x] ACC config (.acc/config/config.yaml)

### Phase 3: reposell CLI Foundation
- [x] CLI framework with composable commands
- [x] Configuration management (load, merge, validate reposell.yml)
- [x] Zero-config principle: auto-derive all values
- [x] Generated file tracking

### Phase 4: /sell Generation & Configuration
- [x] `reposell init` command (auto-configures repo)
- [x] /sell endpoint generation with product config
- [x] Product configuration (name, description, pricing, currency)
- [x] Release selection (selected/all mode)
- [x] Payment provider abstraction (PaymentProvider interface)
- [x] StripePaymentProvider implementation (with abstraction)
- [x] GitHub authentication integration

### Phase 5: GitHub Integration
- [x] GitProvider abstraction
- [x] GitHubProvider implementation
- [x] Repository metadata fetching from GitHub API
- [x] Release detection from Git tags
- [x] GitHub OAuth/app authentication

### Phase 6: Release Management
- [x] Release detection from Git tags
- [x] Release metadata extraction
- [x] Selected releases mode
- [x] All releases mode (auto-detect new releases via CI)
- [x] CI/CD workflow generation (.github/workflows/)
- [x] Manifest regeneration on new release

### Phase 7: /listing Manifest
- [x] Manifest schema design (versioned)
- [x] Manifest generation (`reposell listing enable`)
- [x] Cryptographic identity integration (Ed25519)
- [x] Signature generation for manifest
- [x] Listing registration workflow

### Phase 8: Cryptographic Identity & Signatures
- [x] Key pair generation (Ed25519)
- [x] Signing interface
- [x] Verification interface
- [x] Key rotation support (trust documents)
- [x] Signature expiration/revocation
- [x] Public key distribution (config/reposell/verification-key.pub)

### Phase 39: CLI Architecture (Commands)
- [x] `reposell init`
- [x] `reposell configure`
- [x] `reposell sell`
- [x] `reposell listing enable`
- [x] `reposell listing disable`
- [x] `reposell listing register`
- [x] `reposell listing status`
- [x] `reposell release`
- [x] `reposell verify`
- [x] `reposell doctor` (with --fix)

### Phase 40: reposell doctor
- [x] Repository inspection
- [x] Git provider detection
- [x] Authentication validation
- [x] /sell configuration check
- [x] /listing configuration check
- [x] Payment provider validation
- [x] Releases check
- [x] CI configuration validation
- [x] Signature configuration check
- [x] Listing registration status
- [x] Error/warning reporting
- [x] Auto-fix for safe issues

### Phase 41: Zero-Config Principle
- [x] Auto-derive repository name from git remote
- [x] Auto-derive repository owner
- [x] Auto-derive GitHub URL
- [x] Auto-derive current commit
- [x] Auto-derive Git provider
- [x] Auto-derive release information (tags)
- [x] Auto-derive default metadata (pricing defaults)
- [x] Auto-derive listing endpoint (/listing)

### Phase 42: Configuration
- [x] reposell.yml schema (minimal required config)
- [x] Configuration validation (Zod)
- [x] Environment variable overrides

### Phase 43: Generated Files
- [x] Clear identification of generated files
- [x] Safe merge strategy (never overwrite user files)
- [x] Confirmation prompts for overwrites

### Phase 44: CI Installation
- [x] Generated workflows (.github/workflows/)
- [x] Required secrets documentation (NPM_TOKEN, STRIPE_*, REPOSELL_*)
- [x] Secret validation (never commit to git)
- [x] Automated release workflow on tag push

---

## 5. Security Requirements

- [x] Input validation on all user-provided data
- [x] Output validation on all generated manifests
- [x] Secure key storage (never commit private keys to Git)
- [x] GitHub token minimization (narrowest permissions)
- [x] Signature verification for all manifests (ACC check)
- [x] Replay protection (idempotency keys)
- [x] Audit logging for sensitive operations
- [x] Dependency auditing (bun audit)
- [x] Supply chain protection (verified dependencies)
- [x] Input/output validation on all schemas
- [x] Price security: Stripe handles final transaction client-side (record immutable snapshot)
- [x] Never trust: repository manifests, listing manifests, client-side pricing, client-side transaction state

---

## 6. Implementation Phases (Priority Order)

| Phase | Description | Dependencies |
|-------|-------------|--------------|
| 1 | Project setup & architecture | None |
| 2 | Core protocol types & schemas | Phase 1 |
| 3 | CLI foundation | Phase 1 |
| 4 | /sell generation | Phases 2, 3 |
| 5 | GitHub integration | Phases 1, 2 |
| 6 | Release management | Phases 3, 5 |
| 7 | /listing manifest | Phases 2, 3, 8 |
| 8 | Cryptographic identity | Phase 1 |
| 39 | CLI commands | Phases 3, 4, 5, 6, 7 |
| 40 | reposell doctor | Phases 3, 4, 5, 6, 7 |
| 41 | Zero-config | Phases 3, 5 |
| 42 | Configuration | Phase 3 |
| 43 | Generated files | Phase 3 |
| 44 | CI installation | Phases 3, 6 |

---

## 7. Files to Create

### Project Setup
- `package.json` - Node.js/Bun package config (type: module)
- `tsconfig.json` - TypeScript strict configuration
- `bun.lockb` / `package-lock.json` - Lock file
- `.gitignore` - Git ignore rules
- `.npmignore` - npm ignore rules

### Source Structure (Clean Architecture)
```
src/
├── domain/           # Core business logic, entities, value objects
│   ├── protocol/     # Protocol versions, schemas
│   ├── identity/     # Repository identity, cryptographic identity
│   ├── product/      # Product, pricing, releases
│   ├── payment/      # Payment provider abstraction
│   ├── git/          # Git provider abstraction
│   └── listing/  # Listing manifest, registration
├── application/      # Use cases, services
│   ├── commands/     # CLI command implementations
│   ├── services/     # Business services
│   └── generators/   # File/workflow generators
├── infrastructure/   # External adapters
│   ├── git/          # GitHub provider implementation
│   ├── payment/      # Stripe provider implementation
│   ├── crypto/       # Cryptographic operations
│   ├── fs/           # File system operations
│   └── ci/           # CI/CD workflow generation
├── cli/              # CLI framework
│   ├── commands/     # Command definitions
│   ├── parser/       # Argument parsing
│   └── output/       # Formatted output
├── config/           # Configuration management
│   ├── schema/       # Validation schemas (Zod)
│   └── loader/       # Config loading/merging
└── main.ts           # CLI entry point

### Tests
```
tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
├── fixtures/         # Test fixtures
└── e2e/              # End-to-end tests
```

### CI/CD
- `.github/workflows/ci.yml` - Main CI pipeline (lint, typecheck, test, acc check)
- `.github/workflows/release.yml` - Release automation (on tag push)
- `.github/workflows/verify.yml` - Trust/pricing verification (public listing)
- `skills-lock.json` - Installed skills tracking

### Documentation (Per Section 55)
- `README.md` - Updated with full project documentation
- `ARCHITECTURE.md` - System architecture
- `SECURITY.md` - Security considerations
- `CONTRIBUTING.md` - Contribution guidelines
- `DEVELOPMENT.md` - Development setup
- `API.md` - Internal API documentation
- `PROTOCOL.md` - Protocol specification
- `CONFIGURATION.md` - Configuration reference
- `DEPLOYMENT.md` - Deployment guide
- `TROUBLESHOOTING.md` - Common issues
- `CLI_REFERENCE.md` - Complete CLI command reference
- `IMPLEMENTATION.md` - Implementation tracker

---

## 8. Files to Modify

- `README.md` - Expand with full project documentation

---

## 9. Tests Required

| Test Category | Coverage Target |
|---------------|-----------------|
| Unit tests | >90% for domain logic |
| Integration tests | All external adapters |
| CLI tests | All commands |
| Cryptographic tests | Sign/verify, key rotation |
| Payment tests | Stripe integration (mocked) |
| Git provider tests | GitHub interactions |
| Manifest tests | Generation, validation, signing |
| CI generation tests | Workflow correctness |
| Security tests | Invalid inputs, signature tampering |

---

## 10. CI Requirements

- [x] Lint (ESLint + TypeScript strict mode)
- [x] Type check (tsc --noEmit)
- [x] Unit tests (vitest/jest)
- [x] Integration tests
- [x] Build verification
- [x] Dependency audit (bun audit)
- [x] Security scan
- [x] Automated release on tag
- [x] ACC check passes
- [x] verify.yml passes for public listing deployments

---

## 11. Documentation Requirements

All documents listed in Section 7 must be created and maintained. Each must be accurate and reflect the actual implementation.

---

## 12. Definition of Done (CLI Specific)

- [ ] `npm install -g @reposell/cli` works (global binary: `reposell`)
- [ ] `reposell init` configures a repository automatically
- [ ] `/sell` endpoint generated and functional
- [ ] `/listing` manifest generated and signed
- [ ] Releases can be selected (selected/all mode)
- [ ] All-release automation works via CI
- [ ] GitHub integration works (auth, release detection)
- [ ] Payment abstraction works (Stripe implemented)
- [ ] `reposell doctor` reports accurate status
- [ ] `reposell doctor --fix` repairs safe issues
- [ ] Zero-config: minimal manual input required
- [ ] Generated CI workflows work correctly
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Security audit passes
- [ ] ACC framework operational
- [ ] anti-slop linting passes (npx oxlint)
- [ ] reposell.dev default domain configured
---

## Protocol Evolution Implementation Plan (2026-08) — Decisions D10–D15

Source specs: `TRACKING.md` (D10–D15) · `docs/protocol/*` (GitHub Pages Integration Specification).
Production domains: apex **reposell.dev** (project root) · official listing **listing.reposell.dev**.

### A. `/reposell/*` generator (D10) — `src/generate/`

| File | Purpose |
|------|---------|
| `src/domain/protocol/index-json.ts` | discovery doc: `{protocol:"reposell",version:"1",manifest,health,sell,marketplace,releases}` |
| `src/domain/protocol/repository-manifest.ts` | `reposell/manifest/v1` document from config+git |
| `src/domain/protocol/release-manifest.ts` | immutable per-release doc (`reposell/release/v1`): version/tag/pricing/payment/license |
| `src/domain/protocol/releases-index.ts` | catalog with per-release status+health |
| `src/domain/protocol/health.ts` | `reposell/health/v1`: status + named checks map |
| `src/app/pages-generator.ts` | renders static `sell/index.html` + `marketplace/index.html` into `dist/reposell/**` |
| `src/commands/validate.ts` | full publication gate (§8 checklist) → exit codes |
| `src/commands/build.ts` | validate + generate `dist/reposell/**` |
| `src/commands/health-cmd.ts` | run checks locally, print report (`reposell health`) |

### B. Release state machine (D10) — `src/domain/release/state.ts`

- States: DRAFT → VALIDATING → BLOCKED \| PUBLISHED → HEALTHY \| UNHEALTHY
- Persisted in `.reposell/releases.json`; BLOCKED must carry a machine-readable reason
- Isolation rule: one release's failure never mutates another's state

### C. Payment Link validation (D7/D10) — `src/domain/payment/link-validator.ts`

- Checks: HTTPS · host allowlist `buy.stripe.com` · amount == manifest pricing · currency match
- Failure semantics: **BLOCKED**, never warn-and-continue
- Extend `reposell.yml` schema: `release.payment.payment_link`; keep filename `reposell.yml` (`.yaml` rename deferred)

### D. Publish/release commands — `src/commands/{publish,release}.ts`

- `reposell publish vX.Y.Z` — manual gate; runs full validation before committing release manifest
- `reposell release vX.Y.Z` — interactive: prompts price + Payment Link URL, validates, confirms

### D2. Payment configuration commands (D16 contribution model) — `src/commands/payment.ts`

- `reposell payment setup` — guided config of the seller's own Stripe Payment Link
- `reposell payment verify` — validate against release: valid Stripe URL · reachable · active · product exists · currency matches · **amount matches release price** · repo/release identifiable where available → BLOCKED + actionable errors on failure
- `reposell listing enable` — contribution prompt ($5/$10/$25/$50/custom) written to manifest as `pricing.listing.contribution`
- `reposell listing publish` — creates the publication PR to the listing registry
- Manifest schema v1.0 gains: `pricing.seller`, `pricing.listing.{enabled,contribution}`, `payment.seller.payment_link`
- Releases become immutable commercial records (manifest hash + signature + verification state); contribution changes apply only to future releases

### D3. FREE vs PAID pricing types (D18) — schema + gate changes

- Manifest/config schema: `pricing.type: "free" | "paid"` (default `paid` when amount+link present; explicit type required going forward)
- Publication gate becomes conditional: free → skip provider/link checks entirely (release = direct access); paid → full link verification as today
- `/sell` generator: free releases render `[Download]` → repository release asset/clone URL instead of `[Buy]`
- `payment verify` on a free release prints "free release — nothing to verify" and exits 0
- Listing contribution remains available to FREE projects (donation-style support)

### E. Sell sync fulfillment (D7) — extend `sell` command group

- Pull completed checkout sessions from seller's own Stripe account (existing key resolution)
- Issue Fork Licenses for new buyers; detect refunds → mark license revoked
- Cursor persisted in `.reposell/payments.json`

### F. CI workflow generation — update `src/workflows/ci.ts`

Generated `.github/workflows/reposell.yml` must: validate → build → regenerate health.json → deploy `dist/reposell/**` to GitHub Pages. Namespace rule: workflow writes ONLY under `/reposell/**`.

### G. Signing (D10/D13 alignment)

- Sign repository + release manifests with owner Ed25519 key (module exists in crypto domain)
- Embed public verification key path convention `.github/reposell/verification-key.pem`

### H. Provider abstraction (multi-provider, GitHub first)

- `src/domain/git/provider.ts` — `GitProvider` interface (repository metadata, releases, file content) — see guide/core-concepts
- `src/domain/git/github.ts` — `GitHubProvider` ships first
- CI workflow generation parameterized by platform (`.github/workflows/*` today; GitLab CI/others when providers land)
- Config already supports `git.provider: github|gitlab|bitbucket|gitea|forgejo` — reject unimplemented values with a clear "coming soon" error
- Landing/docs copy states GitHub-first, more coming soon

### Tests required

payment-link validator (valid/host mismatch/amount mismatch/currency mismatch) · state machine transitions incl. isolation · generator determinism (same input = byte-identical JSON) · health check computation · publish gate ordering

### Docs required

Link new commands from `docs/commands/*`; protocol pages already shipped.

---

## Implemented: Licensing Framework + Offers + Audit (2026-08-23)

Shipped in this tree (all tests green, 73/73):

### A. Licensing framework (spec §1-§31 core)

- `src/domain/licensing/rights.ts` — rights catalog: 23 groups, closed value vocabularies (§2-§27)
- `src/domain/licensing/policy.ts` — 15 profiles (§29), total compose (profile+spdx+overrides → complete policy), canonical JSON, sha256 `policyHash`, strict `parsePolicy`
- `src/domain/licensing/generate.ts` — `.reposell/{license,ai-policy,commercial-policy,authorization}.json` + human LICENSE section (§30)
- `src/domain/licensing/compatibility.ts` — SPDX expression parser (AND/OR/WITH, parens) + family compatibility matrix (§25)
- `src/app/license-compose-service.ts` + `license compose|explain|validate|compatibility` commands

### B. License schemes × release offers (§18-§19)

- Config: `licensing.schemes` + `releases.definitions[].offers[]` (legacy per-release pricing/payment removed — clean break)
- `src/domain/licensing/schemes.ts` — `resolveOffers` join with precise issues
- Gates validate EVERY offer; evaluator carries `offerDeepLinks[]`; deep Stripe verification is billing-aware (recurring price + interval, §18)
- Release manifests embed `offers[]` + `license.policy_hash`; sell page renders one Buy row per offer; JSON-LD flattened per offer

### C. Compliance audit

- `src/domain/audit/{scan,checks,sbom}.ts`, `src/app/audit-service.ts`, `src/commands/audit.ts`
- Scan: LICENSE/NOTICE/manifests/package-lock/source SPDX headers/copyrights (bounded walk)
- Checks: repo license, SPDX validity, LICENSE↔manifest consistency (BLOCK), dep compatibility (BLOCK), copyleft (WARN), forbidden list (BLOCK), missing licenses (WARN), NOTICE (WARN), artifact coherence
- Verdict PASS/WARN/BLOCKED; flags `--json --ci --strict --release --forbidden`
- Artifacts: `.reposell/audit/{report.json,sbom.spdx.json,sbom.cyclonedx.json,signature.json}` (signed when key present)

### Deferred (documented, not built)

- External scanner integrations (ScanCode Toolkit / FOSSology / REUSE) — reposell owns policy + verdict; detection foundation pluggable later
- `audit --fix` auto-remediation
- Per-scheme CLA/contribution workflows
