---
title: Release model
---

# Release Model

## Publication requirements

A release is **not published** until all mandatory checks pass:

```text
✓ GitHub Release exists
✓ Release tag matches manifest
✓ Manifest valid
✓ Version valid
✓ Pricing defined (free or paid)
✓ License configuration valid
✓ Integrity/signature valid
```

Payment checks are **conditional on pricing type**:

```text
                release
                   │
             ┌─────┴─────┐
             │           │
           FREE         PAID
             │           │
       no Stripe      payment link
        required       required + verified
       (repository fork   against declared
        release access)   amount + currency
             │           │
             └─────┬─────┘
                   ↓
             verify manifest
                   ↓
                PUBLISH
```

- `pricing.type: "free"` → no Stripe link; the release ships as direct repository fork. Nothing payment-related to verify.
- `pricing.type: "paid"` → provider, Payment Link presence and configuration are mandatory, and the link must match the declared price/currency.

If any mandatory check fails:

```text
BLOCKED
```

Never silently degraded. Never partially published. Paid releases are never available without payment; free releases never require one.

## State machine

Each release has an independent state:

```text
DRAFT
  │
  ▼
VALIDATING
  │
  ├───────────────┐
  ▼               ▼
BLOCKED        PUBLISHED
                  │
                  ▼
             HEALTH CHECK
                  │
             ┌────┴────┐
             ▼         ▼
          HEALTHY   UNHEALTHY
             │         │
             ▼         ▼
         AVAILABLE   BLOCKED
```

## Release isolation

An unhealthy release must **never invalidate another release**:

```text
v1.0.0   PUBLISHED   HEALTHY      AVAILABLE
v1.1.0   PUBLISHED   HEALTHY      AVAILABLE
v1.2.0   PUBLISHED   UNHEALTHY    BLOCKED
v1.3.0   BLOCKED     —            BLOCKED
```

`v1.0.0` and `v1.1.0` remain purchasable. Buyers of older versions are never punished for a problem in a newer one.

## `/reposell/health.json`

Health is a first-class protocol endpoint, regenerated on every deploy:

```json
{
  "schema": "reposell/health/v1",

  "status": "healthy",

  "repository": "EnzoVezzaro/example-project",

  "release": "v1.4.0",

  "checks": {
    "manifest": "valid",
    "release": "valid",
    "payment": "valid",
    "pricing": "valid",
    "license": "valid",
    "integrity": "valid"
  }
}
```

Unhealthy state names the failing check instead of hiding it:

```json
{
  "schema": "reposell/health/v1",
  "status": "unhealthy",
  "repository": "EnzoVezzaro/example-project",
  "release": "v1.4.0",
  "checks": {
    "manifest": "valid",
    "release": "valid",
    "payment": "valid",
    "pricing": "failed",
    "license": "valid",
    "integrity": "valid"
  }
}
```

## Health vs publication

Intentionally different questions:

| | Question |
| --- | --- |
| **Publication** | Was this release successfully published? |
| **Health** | Is this published release currently valid? |

```text
PUBLISHED ≠ permanently healthy
```

A previously valid release can become unhealthy when payment configuration changes, manifests change, signatures break, license configuration breaks, or integrity verification fails.

## Failure philosophy

Never silently recover from an ambiguous state — the system always explains why:

```text
Payment Link missing (paid release)   → BLOCKED
Price mismatch                        → BLOCKED
Manifest invalid                      → BLOCKED
Signature invalid                     → BLOCKED
Health check failed                   → UNHEALTHY / BLOCKED FOR PURCHASE
Free release                          → payment checks skipped entirely
```

Run it yourself at any time:

```bash
reposell health
```

```text
RepoSell Health

✓ Manifest     ✓ Repository
✓ Release      ✓ Pricing
✓ Payment      ✓ License
✓ Signature

STATUS: HEALTHY
```
