# Licensing Policy & Compliance

reposell ships a complete licensing framework: pick a **profile**, override any
**right**, compose machine-readable artifacts, and **audit** the whole
repository against that policy before anything is sold.

```
profile + overrides ──▶ compose ──▶ .reposell/*.json ──▶ audit ──▶ PASS / WARN / BLOCKED ──▶ sign
```

## The rights model

A license policy is a complete record of ~45 rights, grouped into 23
categories: source access, use rights, distribution, commercial rights,
modification, attribution, patents, trademark, documentation, data, binaries,
API, AI artifacts, human-vs-AI, authorization, payment, release-level
licensing, contributions, dependencies, export, warranty, termination and
compatibility. Every right has a closed set of allowed values — configuration
is declarative, never free text (except the SPDX expression and jurisdiction).

## Profiles

Fifteen presets cover the common stances (§29 of the licensing spec):

| Profile | Stance |
| --- | --- |
| `open-permissive` | MIT-style, everything granted |
| `open-permissive-no-ai` | Permissive, all AI rights denied |
| `open-permissive-ai-authorized` | Permissive, AI rights require authorization |
| `open-copyleft` | GPL-style share-alike |
| `open-copyleft-no-ai` / `-ai-authorized` | Copyleft AI variants |
| `source-available` | RSL-1.0 stance — visible, restricted, per-release |
| `source-available-commercial` | + commercial use, Stripe-backed |
| `source-available-no-ai` / `-ai-authorized` | Source-available AI variants |
| `research-only` | Education/research only, no commercial use |
| `non-commercial` | CC-BY-NC stance |
| `commercial-only` | Private source, license keys, cryptographic auth |
| `proprietary` | Full reservation, revocable commercial authorization |
| `custom` | Your composition |

## Composing

```bash
reposell license compose --profile open-permissive-no-ai --spdx "MIT OR Apache-2.0"
reposell license compose --profile source-available-commercial \
  --set ai_training=allowed-with-authorization --jurisdiction EU
```

This writes:

- `.reposell/license.json` — the canonical policy (complete, sorted, hashed)
- `.reposell/ai-policy.json` — AI rights subset
- `.reposell/commercial-policy.json` — commercial subset
- `.reposell/authorization.json` — authorization subset
- appends a human-readable policy section to `LICENSE` (never overwrites)

The policy **sha256 hash is bound into every signed release manifest** —
license, policy and release metadata travel together.

## Explaining and validating

```bash
reposell license explain     # plain-language summary + hash
reposell license validate    # schema, completeness, cross-file coherence
```

## Compatibility

```bash
reposell license compatibility GPL-3.0-only          # vs your policy SPDX
reposell license compatibility LGPL-3.0-only Apache-2.0
```

The matrix is family-based: permissive dependencies fit anywhere; strong or
network copyleft never fits a permissive project; unknown identifiers report
`unknown` — never a guess.

## Auditing the repository

```bash
reposell audit                          # human report
reposell audit --json                   # machine report
reposell audit --ci --strict            # CI gate: warnings block, exit 1 on BLOCKED
reposell audit --release v1.2.0         # bind the audit to a release
reposell audit --forbidden "GPL-3.0-only,AGPL-3.0-only"
```

The audit scans LICENSE/NOTICE files, package manifests, the dependency
lockfile, and source headers (SPDX identifiers, copyright lines), then checks:

- repository license present and recognized
- project SPDX expression valid
- LICENSE ↔ manifest consistency (mismatch = BLOCKED)
- dependency compatibility vs project license (incompatible = BLOCKED)
- copyleft detection (WARN), forbidden licenses (BLOCKED)
- missing license metadata (WARN), NOTICE presence (WARN)
- `.reposell` artifact coherence

The verdict is **PASS / WARN / BLOCKED** (`--strict` escalates warnings).
Artifacts written to `.reposell/audit/`: `report.json`, `sbom.spdx.json`
(SPDX 2.3), `sbom.cyclonedx.json` (CycloneDX 1.5) — and `signature.json`
when `REPOSELL_SIGNING_KEY` is set, so the audit result itself is signed.

## Tying schemes to releases

License schemes in `reposell.yml` reference the policy and carry their own
pricing and Stripe link per release:

```yaml
licensing:
  policy:
    profile: source-available-commercial
    spdx: LicenseRef-reposell-RSL-1.0
  schemes:
    standard:
      name: Standard
      billing: one-time
      template: rsl-1.0
    team:
      name: Team
      billing: one-time
      seats: 10
    pro-monthly:
      name: Pro
      billing: recurring
      interval: month

releases:
  definitions:
    v1.2.0:
      status: published
      offers:
        - scheme: standard
          pricing: { amount: 29, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
        - scheme: team
          pricing: { amount: 99, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
        - scheme: pro-monthly
          pricing: { amount: 9, currency: USD }
          payment: { provider: stripe, payment_link: https://buy.stripe.com/... }
```

Every offer is verified independently: amount, currency **and billing mode**
(recurring schemes must point at Stripe recurring prices with the declared
interval). One bad offer blocks the release; the others are unaffected.
