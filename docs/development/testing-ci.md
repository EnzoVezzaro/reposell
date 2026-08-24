---
title: Testing the CI flow
---

# Testing the Listing CI Flow

The architecture is **PR → GitHub Actions → generated data → merge**. So we test it as a real PR workflow, entirely against Stripe **Test Mode** first. Three levels, plus one golden test.

::: tip Serving path
All seller protocol files are served under `/reposell/*` on the seller's own GitHub Pages, and the registry mirrors verified records under `listing/repositories/**`. Fixtures and assertions below use those paths.
:::

## 1. Local CI testing with `act`

```bash
brew install act
act pull_request --secret-file .secrets.test
```

`.secrets.test` (never committed):

```ini
REPOSELL_STRIPE_SECRET_KEY=sk_test_...
```

**Never use a live `sk_live_` key with `act`.**

This catches early: YAML errors · shell errors · missing env vars · manifest parsing · JSON generation · signature verification · Stripe API calls · idempotency problems.

## 2. Real PR tests against a fixture repository

Create a dedicated fixtures repository:

```text
fixtures/
├── valid/
├── invalid-signature/
├── invalid-sell-link/
├── missing-payment-link/
├── invalid-price/
├── unhealthy/
├── old-release/
├── duplicate-release/
└── changed-contribution/
```

Open actual PRs from a test seller repo into a test listing repo:

```text
test seller repo ──PR──► test listing repo ──► GitHub Actions
                                              ├── verification
                                              ├── Stripe Test Mode
                                              └── generated JSON
```

That is the real end-to-end environment.

## 3. Stripe Test Mode

Listing repo → Settings → Secrets and variables → Actions → new repository secret:

```text
REPOSELL_STRIPE_SECRET_KEY = sk_test_...
```

CI then creates **real Stripe test objects** (Product → Price → Payment Link) that you can actually open and pay with test cards. Nothing can charge real customers in test mode.

## 4. The complete publication test

Test release `v0.1.0` with a seller test Payment Link:

```bash
reposell payment verify      # ✓ link active · amount/currency match release
reposell listing publish     # opens the PR
```

The PR check run must show every step green:

```text
✓ Repository verified        ✓ /health verified
✓ Manifest verified          ✓ Listing contribution verified
✓ Signature verified         ✓ Stripe Product created
✓ Release verified           ✓ Stripe Price created
✓ /sell verified             ✓ Listing Payment Link created + verified
✓ Seller Payment Link OK     ✓ Listing JSON + release record generated
```

## 5. Idempotency (mandatory integration test)

Run the same CI twice on the same release:

```text
MUST NOT:                          MUST:
v0.1.0                             v0.1.0
 ├─ Stripe Link A                   └─ Stripe Link A  ✓ (reused)
 ├─ Stripe Link B  ❌
 └─ Stripe Link C  ❌
```

Second execution must detect existing Stripe objects via deterministic identifiers (repository · release · manifest hash · contribution · publication ID) and reuse them.

## 6. Immutable release model

Publish `v0.1.0` ($50, contribution $5) → Link A. Then publish `v0.2.0` ($60, contribution $10) → Link B.

Assert: **Link A still active, untouched** · Link B active · both releases purchasable. No CI run may ever modify Link A.

## 7. Deliberate negative tests

| Fixture | Expected |
| --- | --- |
| Invalid signature | ❌ BLOCKED |
| Missing seller payment_link | ❌ BLOCKED |
| Manifest $50 vs Stripe link $40 | ❌ BLOCKED |
| `/sell` returns 404 | ❌ BLOCKED |
| `/health` failing | ❌ BLOCKED |
| Contribution `-10` | ❌ BLOCKED |
| Duplicate release already published | ❌ BLOCKED |
| Retry of the *same* publication | ✓ PASS — reuse existing verified record |

That last pair is critical: distinguish **retrying the same publication** (idempotent pass) from **attempting to mutate an immutable release** (block).

## 8. Verify the generated output is serverless

After merge, assert the static structure exists:

```text
listing/repositories/owner/repo/
├── manifest.json
└── releases/
    ├── v0.1.0.json
    └── v0.2.0.json
```

Then load those files in the frontend **without any Reposell API**. If it renders, the architecture is genuinely serverless.

## 9. Dedicated workflows

```text
.github/workflows/
├── listing.yml          # the verification pipeline
├── listing-tests.yml    # manifest · signature · health · payment validation ·
│                        # Stripe integration · idempotency · immutability · schema
└── release-tests.yml
```

Stripe integration suites run only when `STRIPE_TEST_MODE=true`.

## The golden end-to-end test

One test proves the entire economic/discovery loop without a Reposell backend:

```text
Seller repo → create release → reposell CLI → Listing PR
→ Listing CI: verify seller · /sell · seller Stripe link
→ create Reposell Stripe link → generate release JSON
→ merge PR → Listing frontend displays release
→ Buy → Stripe Test Checkout ✓
```
