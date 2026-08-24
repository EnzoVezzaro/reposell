---
title: Clean Architecture
description: The reposell CLI layer model — domain, application, commands, config, utils, workflows — and the deterministic-output principle that ties them together.
---

# Clean Architecture

The CLI follows a layered design. Dependencies point in one direction: entry points toward pure logic, never the reverse. Pure modules stay testable without mocks; I/O lives at the edges.

## Layer map

```
src/
├── bin/          executables: reposell, reposell-listing
├── cli/          presentation: banner rendering
├── commands/     one module per command (init, release, publish, ...)
├── app/          application services: build, config, signing, license, listing
├── domain/       pure business logic: protocol docs, signature, payment, pricing, license, release
├── config/       reposell.yml schema + validation
├── utils/        crypto, env, git, guards
└── workflows/    GitHub Actions workflow generation
```

### Domain (`src/domain`)

Pure logic with no filesystem or process dependencies:

- `protocol/documents.ts` — every generated document (repo manifest, release manifest, health, listing, protocol index) and its schema constant
- `signature/envelope.ts` — sign/verify a set of files via SHA-256 digests + Ed25519
- `payment/link.ts`, `payment/stripe-links.ts`, `payment/stripe.ts` — Payment Link validation and Stripe account checks
- `pricing/endpoint.ts` — signed pricing policy verification and fee splitting
- `license/detect.ts`, `license/spdx.ts`, `license/templates.ts` — license detection and RSL templates
- `release/state.ts`, `release/version.ts` — release state machine and version comparison

Where a domain module must touch the network, the transport is injected (`FetchLike`, clock parameters), so tests run offline.

### Application (`src/app`)

Use cases orchestrating domain + infrastructure:

- `build-service.ts` — load config → evaluate each release → render deterministic documents → sign → write `<out>/reposell/**`
- `config-service.ts` — read/write `reposell.yml`, mutate single fields while preserving comments (via the yaml Document model)
- `signing-service.ts` — resolve `REPOSELL_SIGNING_KEY`, create identities, sign/verify builds
- `evaluate-release.ts`, `validation-service.ts`, `health` — per-release gate evaluation (§10 isolation: one unhealthy release never invalidates another)
- `pages.ts` — HTML rendering for the `/sell` landing surface

### Commands (`src/commands`) and CLI (`src/cli`, `src/bin`)

Commands are thin: parse arguments, call an application service, render a report. `src/bin/reposell.ts` owns the argument parser and maps exit codes; `src/cli/banner.ts` owns output formatting. Adding a command means adding one module plus one switch case — no layer below changes.

### Config (`src/config`)

The `reposell.yml` schema lives here as TypeScript types plus `validateConfig(value)`. Validation **returns issues instead of throwing**, so callers can print precise BLOCKED states. See [Configuration Schema](/configuration/schema).

### Utils (`src/utils`)

- `crypto.ts` — Ed25519 primitives, canonical JSON, SHA-256, PEM wrappers ([Cryptographic Identity](/guide/crypto-identity))
- `env.ts` — environment resolution: process env first, then `.env` file
- `git.ts` — remote URL parsing ([Git Abstraction](/guide/git-abstraction))
- `guards.ts` — shared runtime checks

### Workflows (`src/workflows`)

`ci.ts` renders the GitHub Actions workflow as data, then serializes it deterministically. The generator writes exactly one path — `.github/workflows/reposell.yml`.

## Deterministic output

**Same input = same output** is enforced mechanically, not aspirationally:

- `canonicalJSON` sorts object keys recursively, keeps array order, emits no whitespace
- Documents are serialized with `JSON.stringify(value, null, 2)` and sorted file paths
- YAML generation uses `sortMapEntries: false` so key order is stable
- `signFileSet` sorts paths before hashing, so signatures are reproducible byte-for-byte

Consequences you can rely on: CI regenerations produce zero-diff commits, and `signature.json` verifies against any faithful rebuild of the same inputs.

## Failure philosophy

Modules fail closed with typed errors carrying machine-readable codes — `CONFIG_NOT_FOUND`, `CONFIG_INVALID`, `STRIPE_KEY_MISSING`, `PAYMENT_LINK_MISSING`, `SIGNING_KEY_MISSING`. Nothing guesses: an unverifiable Payment Link is `unverifiable`, not assumed valid; a missing key degrades to `not configured` rather than crashing. Writes are namespace-isolated — build output goes only to `<out>/reposell/**`, workflow generation only to `.github/workflows/reposell.yml` ([Security](/security/) covers the threat model this enables).

## Where to look next

- [Payment Abstraction](/guide/payment-abstraction) — the provider boundary in `domain/payment`
- [Git Abstraction](/guide/git-abstraction) — remote derivation in `utils/git`
- [Testing the CI Flow](/development/testing-ci) — how the layers are exercised end to end
