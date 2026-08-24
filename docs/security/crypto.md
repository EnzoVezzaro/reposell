---
title: Cryptographic Security
description: How reposell signs and verifies manifests with Ed25519 — canonical JSON, key formats, key IDs and the fail-closed verification flow.
---

# Cryptographic Security

Every artifact that matters in reposell is bound by an **Ed25519 signature**. This page documents exactly how signing works in the CLI: which bytes get signed, how keys are represented, and why verification fails closed. For the protocol-level model, see [Signatures](/protocol/signatures).

## The primitive

reposell uses Ed25519 via [`@noble/ed25519`](https://www.npmjs.com/package/@noble/ed25519) (async API) for signing, and Node's built-in `crypto` module for SHA-256 digests. Ed25519 gives fast signatures, small keys (32 bytes), and deterministic signing — the same input and key always produce the same signature, which keeps builds reproducible.

## Key format

An Ed25519 identity is a **32-byte private seed**. The public key is derived from it; it cannot exist without it, but the reverse is impossible.

| Representation | Encoding | Where it lives |
| --- | --- | --- |
| Private seed | Base64 string | `REPOSELL_SIGNING_KEY` environment variable — never on disk |
| Public key | SPKI PEM (`-----BEGIN PUBLIC KEY-----`) | `.github/reposell/verification-key.pem` — safe to commit |
| Public key | Base64 | `REPOSELL_OFFICIAL_VERIFY_KEY` for pinned official pricing verification |
| Signatures | Base64url | Inside `signature.json` |

The PEM wrappers are fixed RFC 8410 encodings: the public key uses a constant SubjectPublicKeyInfo prefix, the private seed a PKCS#8 prefix. The parser rejects anything that is not exactly one of these two shapes — a RSA or EC PEM will not silently load.

Key generation happens locally (`reposell init`). The generation path returns the base64 private seed and public PEM to the caller; only the public half is ever written to the filesystem.

## Key IDs

Every signature envelope carries a `key_id`:

```text
key_<first 16 hex chars of SHA-256(public key)>
```

Verifiers can therefore tell *which* key produced a signature without trusting any metadata. If you rotate keys, old and new artifacts are distinguishable by their `key_id` alone.

## What is signed: canonical JSON of a digest document

The CLI does not sign raw files. It signs a **digest document**:

1. Every file in the generated set is hashed: `SHA-256(content)`, hex-encoded, keyed by its relative path.
2. A document is built containing `{ algorithm, files, schema }` — where `files` maps each path to its hash.
3. That document is serialized with **canonical JSON** and signed with Ed25519.

The resulting `signature.json` envelope contains:

```json
{
  "schema": "<signature schema version>",
  "algorithm": "Ed25519",
  "key_id": "key_…",
  "files": { "manifest.json": "<sha256 hex>", … },
  "signature": "<base64url>"
}
```

## Why canonicalization matters

A signature is computed over **bytes**, not over the idea of a JSON object. Two serializations of the same data — different key order, extra whitespace, a trailing newline — produce different bytes and would break verification arbitrarily depending on who wrote the file last.

Canonical JSON removes the ambiguity:

- Object keys are sorted recursively, everywhere in the tree.
- Arrays keep their order (order is meaningful).
- No whitespace between tokens.
- `undefined` values are dropped, not serialized as `null`.

Same data in, same bytes out — always. Signing and verification both serialize through this one function, so there is no "writer's dialect". If a manifest is edited after signing — even one character — its hash changes, the digest document changes, and the signature breaks loudly.

## Verification flow

Verification replays the exact signing procedure and compares:

1. **Algorithm check** — anything other than `Ed25519` is rejected.
2. **Schema check** — an unrecognized envelope schema is rejected.
3. **File-set equality** — the set of paths in the envelope must exactly match the set of files being verified. Added or removed files fail here.
4. **Hash comparison** — every file's recomputed SHA-256 must equal the hash declared in the envelope.
5. **Signature check** — Ed25519 verification of the digest document against the supplied public key.

Each failed check produces a named reason in a failures list. Nothing is recovered silently and no step is skipped: a missing signature is a failure, an unverifiable signature is a failure, and **no verification key provided** is itself a failure — verification without a pinned key refuses to run rather than defaulting to "trust".

The same chain guards economics: the official pricing policy is fetched, schema-validated, signature-checked against the pinned official key, and then checked for `valid_until` expiration — fetch → schema → signature → expiration, and any failure BLOCKs. See [Payment Security](/security/payment) and `/security/index.md`'s safe-state rules.

## Verification has zero network calls

The core verification path — hash files, rebuild the digest document, verify the signature — performs no network requests. Given files, an envelope, and a public key, your machine does the math. Network fetching happens before verification (getting the documents); trust decisions happen after it, locally.

## Where the private key lives

The signing service resolves the private seed exclusively from the `REPOSELL_SIGNING_KEY` environment variable:

- Missing or empty → the operation aborts with `SIGNING_KEY_MISSING`.
- Not valid base64, or not exactly 32 bytes → `SIGNING_KEY_INVALID`.
- The seed is held in memory for the duration of signing and **never written to disk, logs, or build output**.

CI receives it as a GitHub Actions secret reference (`secrets.REPOSELL_SIGNING_KEY`) injected into the step environment — see [Secret Management](/security/secrets).

## Rotating keys

Rotation is designed into the protocol as **signed trust documents**: the current key signs its successor, so anyone can verify the full chain of custody without rewriting history (see [Signatures](/protocol/signatures)). Trust-document automation is protocol-designed and landing in the CLI; today you can already rotate by generating a new identity, replacing the distributed `verification-key.pem`, and re-signing — verifiers will see the new `key_id`. For the full playbook, see [Incident Response](/security/incident-response).

## Verify it yourself

```bash
reposell verify trust     # dist/reposell/** against its signature.json and your pinned key
reposell verify pricing <endpoint-url>
```

Both commands print explicit failure reasons instead of exiting ambiguously. See [verify](/commands/verify).
