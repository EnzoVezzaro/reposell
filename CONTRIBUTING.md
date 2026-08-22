# Contributing to reposell CLI

Thank you for contributing to the reposell ecosystem! This document outlines the process for contributing to the reposell CLI.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18+
- Bun 1.0+ (recommended) or npm
- Git
- A GitHub account

### Development Setup

```bash
# Clone the repository
git clone https://github.com/EnzoVezzaro/reposell.git
cd reposell

# Install dependencies
bun install

# Run tests
bun test

# Run linting
bun run lint

# Type check
bun run typecheck

# Build
bun run build
```

## Development Workflow

### 1. Fork and Branch

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/reposell.git
cd reposell

# Create a feature branch
git checkout -b feat/your-feature-name
```

### 2. Make Changes

Follow the project's coding standards:

- **TypeScript strict mode** - No `any`, no implicit any
- **Anti-slop rules** - Run `bun run lint` (Oxlint + anti-slop plugin)
- **ACC compliance** - Run `acc check` to validate architecture contracts
- **Conventional commits** - Use format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

### 3. Test Your Changes

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/unit/commands/init.test.ts

# Run with coverage
bun test --coverage
```

### 4. Validate Architecture

```bash
# Check ACC contracts
acc check

# View architecture graph
acc graph

# Check for drift
cat ACC_WARN.md
```

### 5. AI Contribution Declaration (Optional but Encouraged)

If you use AI assistance, add `.github/pr.yml` to your PR:

```yaml
harness: opencode
provider: google
model: gemini-2.5-flash
```

CI will verify against the allowlist in `.github/pr_allow_providers.yml`.

### 6. Submit Pull Request

- Ensure all checks pass
- Write a clear PR description
- Reference any related issues
- Link to the implementation tracker if applicable

## Coding Standards

### TypeScript

- Use `type` over `interface` for simple shapes
- Prefer `const` assertions (`as const`) over type widening
- Use `satisfies` for configuration validation
- Never use `any` - use `unknown` with proper narrowing
- Enable all anti-slop rules (configured in `oxlint.config.ts`)

### Architecture

Follow the clean architecture layers:

```
src/
├── domain/           # Pure business logic, no external deps
├── application/      # Use cases, orchestration
├── infrastructure/   # External adapters (GitHub, Stripe, FS, Crypto)
├── cli/             # CLI framework, commands
└── config/          # Configuration loading/validation
```

### Testing

- Unit tests for domain logic (>90% coverage)
- Integration tests for infrastructure adapters
- CLI tests for all commands
- Contract tests for protocol schemas

### Documentation

Update relevant documentation:

- `README.md` - User-facing documentation
- `ARCHITECTURE.md` - System architecture
- `CLI_REFERENCE.md` - Command reference
- `IMPLEMENTATION.md` - Implementation tracker
- Code comments for complex logic

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `security`

Example:
```
feat(cli): add reposell doctor --fix command

Implements automatic repair of safe configuration issues
detected by reposell doctor. Adds --fix flag that resolves
missing CI workflows and standard configuration files.

Closes #123
```

## Pull Request Requirements

- [ ] All tests pass
- [ ] Lint passes (`bun run lint`)
- [ ] Type check passes (`bun run typecheck`)
- [ ] ACC check passes (`acc check`)
- [ ] No ACC0xx violations introduced
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for non-trivial changes)
- [ ] `.github/pr.yml` added if AI was used

## Release Process

Releases are automated via GitHub Actions on tag push:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

By contributing, you agree that your contributions will be licensed under the [reposell CLI License](LICENSE).