---
title: Dependency Security
description: What reposell's CLI depends on (almost nothing), how the supply chain is pinned and audited, and why minimal dependencies matter for a crypto-sensitive tool.
---

# Dependency Security

reposell is a cryptography-adjacent developer tool: it holds signing keys in its process environment and verifies the authenticity of software products. Every dependency is trusted code running with that privilege. The dependency policy follows from this — **be as close to zero as the job allows**.

## The actual dependency surface

The published CLI has a deliberately small runtime footprint:

| Package | Version | Role |
| --- | --- | --- |
| `@noble/ed25519` | `^3.1.0` | Ed25519 signing/verification — the only crypto-critical dependency |
| `yaml` | `^2.9.0` | Parsing/writing config and generated workflow files |
| `js-yaml` | `^5.3.0` | YAML parsing where legacy behavior is relied upon |
| `@types/node` | `^26.2.0` | Type declarations only — no runtime code |

That's it. Dev-only tooling (`typescript`, `oxlint`, `vitest`, `vitepress`) never ships in the package.

## Why this matters for a signing tool

1. **Smaller attack surface.** Each transitive dependency is a potential injection point sitting between an attacker and your signing key. Four direct runtime dependencies mean a short, auditable tree.
2. **No heavyweight SDKs.** Stripe and GitHub are integrated through plain HTTP with the platform's built-in `fetch` — no `stripe-node`, no Octokit, none of their transitive trees. The code talks to exactly two API endpoints (`/v1/account`, `/v1/payment_links/*`) and declares those shapes itself.
3. **Audited crypto primitives.** `@noble/ed25519` is a small, pure-JavaScript, widely reviewed implementation of one algorithm. Hashing uses Node's built-in `crypto` (SHA-256). There is no bundled OpenSSL fork and no homegrown cipher code.
4. **Reproducible behavior.** Deterministic canonical JSON and fixed PEM encodings are implemented locally, in the open, in a few hundred readable lines — not buried under layers.

## Lockfile policy

- `package-lock.json` is committed. Installs resolve to exact pinned versions regardless of the caret ranges in `package.json`.
- CI installs from the lockfile, so a build today and a build next month verify and sign byte-identically.
- Dependency updates are deliberate changes to the lockfile — visible in diffs, reviewable like any other change — not silent drift.

## Auditing

Run before upgrading anything:

```bash
npm audit          # known-vulnerability report for the resolved tree
npm outdated       # available updates
```

The project's security policy requires dependency auditing in CI and pinned versions; third-party dependency vulnerabilities themselves are out of scope of reposell's advisory process — report them upstream (see [Incident Response](/security/incident-response) for scope boundaries).

If `npm audit` flags the crypto path (`@noble/ed25519`), treat it as a signing-integrity incident, not routine maintenance: pin the current version, assess the advisory, and rotate keys if signature correctness could have been affected.

## Rules for adding dependencies

A new runtime dependency must justify itself against the alternatives:

1. Can the platform do it? (`fetch`, Node `crypto`, `URL`) — then no dependency.
2. Is it small enough to read completely? A crypto or parsing library you cannot audit in an afternoon is a liability, not a feature.
3. Does it widen what an injected script can reach? Anything evaluating strings, spawning processes, or touching the network multiplies the blast radius of a compromise.

This is why generated workflows run plain Node plus the published CLI — target repositories need no Bun/TS toolchain and pull nothing beyond the CLI's own audited tree ([Release model](/protocol/release-model)).

## Generated workflows inherit the same discipline

The CI workflow reposell generates is itself part of the supply chain, so it follows the same rules:

- It pins official actions by major tag (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`) — first-party GitHub runners only, no third-party actions in the critical path.
- It installs the published CLI from npm (`npm install -g reposell`) rather than running ad-hoc scripts with elevated permissions.
- Regeneration is deterministic: same input produces byte-identical YAML ([Release model](/protocol/release-model)), so an unexpected diff in `.github/workflows/reposell.yml` is itself a signal worth investigating.

## Reviewing dependency changes

When a lockfile diff appears in a PR, review it like code:

```bash
git diff package-lock.json | grep -E '^\+.*"version"'   # what changed versions
npm ls <package>                                        # who pulls it in
```

A crypto-sensitive upgrade (`@noble/ed25519`) deserves its own PR with the advisory linked, separate from routine tooling bumps. Mixing them makes incident triage harder later.

## Verifying what you installed

You can confirm the running CLI matches its declared identity the same way reposell verifies products:

```bash
npm ls @noble/ed25519 yaml js-yaml   # inspect the actual resolved tree
reposell verify trust                 # built artifacts match their signatures locally
```

The verification path performs zero network calls ([Cryptographic Security](/security/crypto)) — so even verifying your own install doesn't extend trust to any server.
