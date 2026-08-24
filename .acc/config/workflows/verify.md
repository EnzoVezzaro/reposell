# verify.md — CI Verification & Runtime Trust Enforcement

This workflow ensures that all generated artifacts and runtime configurations
are verified against the official reposell trust and pricing policy.

## Verification Steps

1. **Fetch official trust metadata** from `https://reposell.dev/trust.json`
2. **Verify official signatures** (Ed25519) on trust document
3. **Fetch pricing policy** from `https://reposell.dev/pricing.json`
4. **Verify pricing-policy signature** using trust document keys
5. **Validate pricing policy** (fees, percentages, accounting test)
6. **Verify listing identity** (match registered listing_id)
7. **Validate listing registration** (active status, correct endpoint)
8. **Validate protocol compatibility** (version match)
9. **Run application tests** (critical user flows)
10. **Build** (typecheck, lint, build)
11. **Deploy** - ONLY if all above pass

## Safe State Enforcement

If ANY verification step fails:
- **Deployment MUST FAIL** - no automatic fallback
- **Runtime MUST enter safe state** on startup if policy cannot be validated
- **NO fallback percentages** (e.g., MUST NOT assume 50/50)
- **NO silently continuing with stale or invalid trust data**
- **Alert operator immediately** via logs

## Accounting Test (Mandatory)

For a $50 product with $5 fee and 50/50 split:
- Repository owner: $45
- Main listing: $2.50
- Public listing: $2.50

All implementations MUST pass this test at unit, integration, API, and E2E levels.

## CI Workflow Reference

See `.github/workflows/verify.yml` for the enforced verification pipeline.