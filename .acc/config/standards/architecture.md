# architecture.md — Project Architecture Standard

The reposell CLI follows clean architecture with these layers:

## Layer 1: Domain (Pure Business Logic)
- **Zero external dependencies**
- **Entities**: RepositoryIdentity, Product, Release, Pricing, CryptographicIdentity
- **Abstractions**: PaymentProvider interface, GitProvider interface
- **No IoC containers, no frameworks** - plain TypeScript

## Layer 2: Application (Use Cases & Services)
- **Depends only on domain**
- **Services**: InitService, SellService, MarketplaceService, ReleaseService, DoctorService
- **Commands**: reposell init, reposell sell, reposell marketplace, reposell release, reposell doctor
- **Generators**: File/workflow generators

## Layer 3: Infrastructure (External Adapters)
- **Implements domain interfaces**
- **GitHubProvider**: GitHub REST/GraphQL API
- **StripePaymentProvider**: Stripe Checkout + Webhooks
- **Ed25519Crypto**: TweetNaCl/libsodium
- **FileSystemAdapter**: Node.js fs/promises
- **CI Generator**: GitHub Actions workflow generation

## Layer 4: CLI (Command Framework)
- **Thin wrapper** over application services
- **Parser**: Custom argument parser (minimal deps)
- **Commands**: Composable, single-responsibility
- **Output**: Structured (JSON) + Human-readable

## Layer 5: Config (Configuration Management)
- **Schema**: Zod for validation
- **Sources**: reposell.yml + environment variables
- **Merging**: Deep merge with precedence
- **Defaults**: Zero-config auto-derivation

## Data Flow

```
User Command
     │
     ▼
CLI Parser → Command Handler
     │
     ▼
Application Service
     │
    ├──▶ Domain Entities
    │
    ▼
Infrastructure Adapters
     │
    ├──▶ GitHub API
    ├──▶ Stripe API
    ├──▶ Crypto
    └──▶ File System
     │
     ▼
Generated Files / API Calls
```

## Key Design Decisions

### 1. Zero-Config Derivation
All repository metadata derived from Git/GitHub/CI automatically:
- Repository owner, name, URL from git remote
- Git provider from remote hostname
- Current commit from `git rev-parse HEAD`
- Releases from Git tags matching `v*`
- Default branch from git symbolic-ref

### 2. Payment Abstraction
```typescript
// Config-driven provider selection
payment:
  provider: stripe  // Future: paypal, coinbase, etc.
```
Provider instantiated via factory pattern.

### 3. Git Abstraction
```typescript
// Config-driven provider selection
git:
  provider: github  // Future: gitlab, bitbucket, gitea
```

### 4. Cryptographic Identity
- Ed25519 for signing (fast, small keys, no patents)
- Keys stored in OS keychain / env vars (never in repo)
- Public keys distributed via manifests
- Key rotation via signed trust documents

### 5. Protocol Versioning
All generated manifests include:
```json
{
  "protocol": "reposell",
  "version": "1.0",
  "schema": "https://reposell.dev/schemas/sell-v1.json"
}
```

## Extension Points

| Extension Point | Mechanism |
|-----------------|-----------|
| New payment provider | Implement `PaymentProvider` interface |
| New Git provider | Implement `GitProvider` interface |
| New command | Add to `src/cli/commands/` |
| New workflow template | Add to `src/infrastructure/ci/templates/` |
| New manifest schema | Add to `src/domain/protocol/schemas/` |

## Security Boundaries

- Private keys NEVER in memory longer than needed
- No secret logging (structured logging with redaction)
- Webhook signature verification mandatory
- Input validation on all user-provided data
- Output validation on all generated manifests

## Testing

- **Unit tests**: >90% coverage for domain logic
- **Integration tests**: All infrastructure adapters
- **Contract tests**: Protocol schemas
- **CLI tests**: All commands
- **E2E tests**: Critical user flows

## Anti-Patterns

- **YAML Frontmatter**: `ACC` does not parse frontmatter (hard invariant)
- **Competing Instruction Standards**: `AGENTS.md` is primary; no `CLAUDE.md`/`CURSOR.md`/`CODEX.md`
- **Putting Memory in `AGENTS.md`**: Architectural = `AGENTS.md`, orientational = `.acc-memory.md`
- **Declaring Inferred Facts**: Never write a dependency or owner based on an `ACC` suggestion without review