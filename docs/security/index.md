---
title: Security
description: The reposell security model — Ed25519 signatures, local-only keys, signed policies and safe-state failures.
---

# Security

Security is not a feature of reposell. It is the reason reposell exists — every part of the protocol is designed so that **trust comes from cryptography you can verify**, never from promises.

## The model in one sentence

> Every important claim is a signed document, every signature is verifiable against a public key you control or can pin, and every failure mode fails closed.

## What is signed

| Artifact | Signed by | Verified by |
| --- | --- | --- |
| `/listing` manifest | Seller's Ed25519 key | Any listing, any buyer |
| Pricing policy | Official listing key | Every listing instance on startup |
| Trust document (key rotation) | Current official key | Anyone verifying history |
| Licenses | Listing key | Buyers and sellers |
| Stripe & GitHub webhooks | Provider HMAC signatures | Your deployment |

If a manifest is edited after signing — even one character — the signature breaks loudly. There is no silent tampering.

## Key management rules

These are hard constraints baked into the CLI, not guidelines:

- **Private keys never leave your machine's trust boundary.** They are never committed to Git, published to npm, embedded in CI artifacts, or written to logs.
- `reposell init` generates your Ed25519 keypair locally. You can bring your own.
- Rotation happens through **signed trust documents**: the current key signs its successor, so anyone can verify the full chain of custody — no history rewriting.
- Public listing instances must mount the **official verification key** at `config/reposell/verification-key.pub`. Startup fails closed without it.

## Failing safely

Listing instances are designed to refuse, not guess:

- If the official pricing policy cannot be fetched **and verified**, the instance enters **safe state** and stops processing purchases. It never falls back to hardcoded percentages — a fee that can't be proven is a fee that doesn't happen.
- All financial operations are idempotent, so retries during partial failures can never double-charge or double-issue.
- Settlement reports reconcile every split per purchase: owner, main listing, public operator.

## Threat model highlights

| Threat | Defense |
| --- | --- |
| Manifest tampering | Ed25519 signature over canonical JSON body |
| Fake products | Signatures checked against pinned official key before listing |
| Fee manipulation mid-flight | Fees live only inside separately signed pricing policies |
| Rogue listing instance | Instance holds no discretion — policy is signed, math is deterministic |
| Key compromise | Rotation via signed trust documents preserves verifiable history |
| Supply-chain drift | CI regenerates workflows deterministically; same input = same output |

## Verify it yourself

You do not have to take any of this on faith:

1. Fetch any product manifest from its `/reposell/manifest.json`.
2. Fetch the seller's public key from their repository.
3. Run `reposell verify <manifest>` — the CLI checks the canonical form and signature locally.

The verification code path has zero network calls. Your machine does the math.

The same signature system also binds license records — owner, release, commit SHA, AI policy — into the signed manifest. See [Licensing](../licensing/) for how fork-specific licenses and machine-readable AI reservations hook into this.
