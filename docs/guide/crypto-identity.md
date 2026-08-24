---
title: Cryptographic Identity
description: Ed25519 keys in reposell — generation, manifest signing, verification, and why the private key only ever exists as an environment secret.
---

# Cryptographic Identity

Every generated file set is signed with Ed25519. The signature makes tampering loud: one changed character breaks verification. This page documents the CLI-side mechanics; the protocol view is in [Signatures](/protocol/signatures).

## Algorithm facts

| Property | Value |
|----------|-------|
| Algorithm | Ed25519 (via `@noble/ed25519`, async API) |
| Private key | 32-byte seed |
| Public key | 32 bytes, distributed as PEM (RFC 8410 SubjectPublicKeyInfo) |
| Signature | 64 bytes, encoded base64url |
| Key ID | `key_` + first 16 hex chars of SHA-256(public key) |

## Key generation

`createIdentity()` (application layer) generates a fresh keypair locally:

- **Public half** → written to `.github/reposell/verification-key.pem`. This file is safe to commit; CI and any verifier read it.
- **Private half** → printed once as base64, then gone. The CLI never writes it to disk.

```bash
$ reposell keys generate
✓ Generated Ed25519 signing identity
  Key ID: key_1a2b3c4d5e6f7a8b
  Public verification key written to: .github/reposell/verification-key.pem (safe to commit)

PRIVATE KEY — store as a GitHub Actions secret named REPOSELL_SIGNING_KEY.
It is shown once and never saved by reposell:

  <base64-seed>

  gh secret set REPOSELL_SIGNING_KEY   # then paste the line above
```

[`reposell init`](/guide/init) performs the same generation best-effort on first run.

## Where the private key lives: the environment

Signing code resolves exactly one source — the `REPOSELL_SIGNING_KEY` environment variable containing the base64-encoded 32-byte seed:

```typescript
// app/signing-service.ts
export const SIGNING_KEY_ENV = 'REPOSELL_SIGNING_KEY';
```

- Missing → `SIGNING_KEY_MISSING` with setup guidance
- Not valid base64 or wrong length (must decode to exactly 32 bytes) → `SIGNING_KEY_INVALID`

Today the resolution is strict: every command passes the **process environment** straight to `resolveSigningKey`, so export the variable in your shell or CI job:

```bash
export REPOSELL_SIGNING_KEY=<base64-seed>
```

(The process-env-first, `.env`-file-fallback resolver exists in `utils/env.ts`, but it is currently wired up for Stripe keys, not the signing key.)

For CI, store the seed as a GitHub Actions secret — the generated workflow already wires `secrets.REPOSELL_SIGNING_KEY` into the validate and build steps, so signing happens inside CI without the key ever touching the repository.

Hard rules enforced by design:

- The private key is never committed, never published, never embedded in build output, never logged.
- Only the derived *key ID* and public key ever appear in generated artifacts.

Inspect your configured identity without exposing anything:

```bash
$ reposell keys show
Private key source: REPOSELL_SIGNING_KEY (base64 seed 44 chars)
Key ID: key_1a2b3c4d5e6f7a8b
Public verification key:
-----BEGIN PUBLIC KEY-----
...
```

## What gets signed

The signature envelope (`domain/signature/envelope.ts`) signs a **set of files**, not a single document:

1. Each file is hashed: `sha256(content)` → hex
2. A digest document `{ schema, algorithm: "Ed25519", files }` is serialized as canonical JSON (keys sorted recursively, no whitespace)
3. The canonical bytes are signed with Ed25519

The result is emitted as `signature.json` next to the built files:

```json
{
  "schema": "reposell/signature/v1",
  "algorithm": "Ed25519",
  "key_id": "key_...",
  "files": {
    "index.json": "<sha256>",
    "manifest.json": "<sha256>",
    "releases/v1.0.0/manifest.json": "<sha256>"
  },
  "signature": "<base64url>"
}
```

Because hashing covers relative paths plus contents, adding, removing, renaming, or editing any signed file invalidates the envelope. Signing is deterministic: same inputs + same key = same `signature.json`.

Builds without a configured key still complete but stay unsigned — health reports mark integrity as `unsigned` rather than pretending otherwise.

## Verification

Verification recomputes everything and reports failures as a list; it never silently recovers:

```typescript
const { valid, failures } = await verifyFileSet({ files, envelope, publicKey });
```

Checks performed: algorithm and schema known, signed path set equals actual path set, every content hash matches, and the digest document verifies against the public key. From the command line:

```bash
reposell verify <manifest|trust|pricing URL>
```

The verification path has zero network calls beyond fetching the artifact itself — your machine does the math ([Security](/security/)).

## Handling compromise

Replace the key deliberately:

1. `reposell keys generate` — new identity; commit the new `verification-key.pem`
2. Update the `REPOSELL_SIGNING_KEY` secret in CI and locally
3. Push — the next CI run re-signs and republishes everything under the new key

Anything signed by the old key stops verifying against the new public key immediately, which is the point: key replacement is visible in history rather than deniable.
