---
title: Signatures
---

# Signatures

RepoSell uses cryptographic signatures to establish authenticity. The architecture uses **digital signatures (Ed25519)** — not reversible encryption — for this purpose.

## Key model

```text
Private signing key                Public verification key
(exclusively controlled            (safe to publish,
 by the signing party)              embedded in CI)
        │                                  │
        ▼                                  │
Sign configuration                         │
        │                                  │
        ▼                                  ▼
signature.json  ──────────────────► verify(signature, payload, public_key)
```

- The **private signing key** must never appear in: GitHub, GitHub Actions, repositories, npm packages, public listings, frontend code, or CLI distributions.
- The **public verification key** is safe to distribute and is embedded automatically into generated CI configuration:

```text
.github/reposell/
    verification-key.pem
```

CI can then perform verification without possessing any secret:

```text
verify(signature, manifest, public_key)
```

## What gets signed

| Artifact | Signed by |
| --- | --- |
| Repository manifests & release manifests | Repository owner's key |
| Listing pricing policy | Official RepoSell key |
| Trust documents (key rotation) | Official RepoSell key |

## Verification flow

Before trusting any signed configuration:

```text
Fetch configuration
        ↓
Fetch signature
        ↓
Verify signature
        ↓
Validate schema
        ↓
Validate expiration/version
        ↓
Accept configuration
```

Invalid at any step → **BLOCKED**.

## Trust domains

GitHub, Stripe, GitHub Pages, the repository, the official listing and public listings are separate trust domains. No component implicitly trusts another. A listing verifies this chain before presenting anything as purchasable:

```text
Repository identity → Manifest → Release → Signature → Health → Payment configuration
```

## Public listing guarantees

Community listings must verify official configuration with the published verification key. They must never be able to:

- forge RepoSell pricing configuration
- forge official signatures
- impersonate the official listing
- modify repository releases or pricing

## Key rotation

Keys rotate through signed trust documents, so history stays verifiable even after keys change. See [Security — Cryptographic Security](/security/crypto) for threat-model detail.
