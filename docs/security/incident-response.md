---
title: Incident Response
description: What to do when a signing key or Stripe secret leaks, how signature expiry and revocation work, and how to report vulnerabilities.
---

# Incident Response

This page is the operational playbook for the worst days: a leaked signing key, an exposed Stripe secret, or a vulnerability you found in reposell itself. The reporting process follows the project's [Security Policy](https://github.com/EnzoVezzaro/reposell/security/advisories) (`SECURITY.md`).

## Reporting a vulnerability

**Do not open a public GitHub issue.**

1. Email **security@reposell.dev**, or
2. Use GitHub Security Advisories — the "Report a vulnerability" tab on the repository.

Commitment: acknowledgment within **48 hours**, detailed response within **7 days**, advisory and patch targeted for **day 14**. Supported versions are 1.x; anything below 1.0 is unsupported.

In scope: the `reposell` CLI package, generated code and workflows, and the protocol implementations (`/sell`, `/listing`). Out of scope: third-party dependency bugs (report upstream), user configuration files, infrastructure not managed by this project.

## Detecting compromise early

Rotation works best when you notice fast. Practical detection habits:

- **Enable secret scanning** (with push protection) on every repo that carries reposell workflows — it catches the most common leak, a seed pasted into a commit.
- **Watch `key_id` values** on artifacts you consume from others. An unannounced `key_id` change is either a rotation or an impersonation; both deserve a question.
- **Re-verify periodically**: `reposell verify trust` locally re-checks your published build against your pinned key with zero network calls ([Cryptographic Security](/security/crypto)).
- **Audit CI logs** after any workflow change: Actions masks secret values in logs by default, but a script that prints its environment defeats that — keep build steps to the generated workflow's explicit commands.

## Scenario 1: your signing key leaked

`REPOSELL_SIGNING_KEY` grants full authority to sign manifests as you. If it appears in a commit, log, screenshot, CI artifact, or shared file — treat it as compromised.

### Immediate containment

1. **Stop publishing with the compromised key.** Anything signed after compromise is unverifiable in spirit even if the math still passes.
2. **Generate a new identity** locally ([Secret Management](/security/secrets)):

   ```bash
   openssl genpkey -algorithm Ed25519 -out new_private_key.pem
   openssl pkey -in new_private_key.pem -outform DER | base64
   ```

3. **Replace the distributed verification key**: commit the new public PEM at `.github/reposell/verification-key.pem` and update any pinned copies (e.g. `REPOSELL_OFFICIAL_VERIFY_KEY` holders for official pricing).
4. **Re-sign and republish**: set `REPOSELL_SIGNING_KEY` to the new seed, rebuild, redeploy. New artifacts carry the new `key_id`.
5. **Announce the rotation** through a channel buyers can verify — a signed note in the repo, release notes, or a trust document once automation lands.

### How verification detects the switch

Every envelope records `key_id` — `key_` + 16 hex chars of SHA-256 of the public key. Verifiers comparing artifacts signed before and after rotation see different key IDs immediately; nothing pretends continuity ([Cryptographic Security](/security/crypto)).

### Rotation in the protocol

Key rotation is designed into the protocol as **signed trust documents**: the current key signs its successor, producing a verifiable chain of custody with no history rewriting (see [Signatures](/protocol/signatures)). This is protocol-designed; trust-document automation in the CLI is landing. Until then, the manual procedure above achieves the same end state — old artifacts stay attributable to the old key via its `key_id`, new artifacts to the new one.

### Revocation semantics

- Pricing policies carry an optional `valid_until` timestamp; expired configurations fail the expiration stage and are **BLOCKED** — implemented today.
- Manifest envelopes have no embedded expiry field yet. Revocation of a specific artifact currently means rotating the key and repinning the verification key; per-artifact revocation lists are protocol territory, not yet CLI code.
- Listing instances fail closed regardless: if official pricing cannot be fetched *and verified*, they enter safe state and stop processing purchases.

## Scenario 2: your Stripe secret key leaked

1. **Roll the key** in the Stripe dashboard (test keys in test mode, live keys in live mode) — revocation is immediate on Stripe's side.
2. Update the value in GitHub Actions secrets and any local `.env` ([Secret Management](/security/secrets)).
3. **Buyers were never at risk from this key alone**: checkout runs on Payment Links hosted by Stripe, which do not use your secret key ([Payment Security](/security/payment)). The exposed key affects your tooling and deep link verification, not card data.
4. Re-run `reposell listing status` to confirm the new key connects and reports the expected mode (`livemode` comes from Stripe's account response, so mode confusion surfaces immediately).

Scope-limiting by design: keep `sk_test_…` in development and CI, reserve `sk_live_…` for the environments that truly need it — mode is derived from the key prefix, so mixing them up is visible rather than silent.

## Scenario 3: a tampered manifest surfaced

If a published manifest fails verification:

```bash
reposell verify trust        # built files vs signature.json under your pinned key
reposell verify manifest     # config + publication gates
```

Any failure prints explicit reasons and BLOCKs. Do not "fix" the manifest by hand — re-sign from a known-good source after establishing what changed. A signature mismatch over content you did not edit is a supply-chain incident: rotate keys first, investigate second.

## Post-incident checklist

- [ ] Compromised material revoked or rotated (key(s), Stripe secrets).
- [ ] Verification key repinned wherever consumers hold it.
- [ ] Fresh builds re-signed and republished; `key_id` change announced.
- [ ] Leak vector closed — history rewrite or `git filter-repo` if the secret was committed; secret scanning enabled going forward.
- [ ] If reposell itself was at fault, reported per the process above so a fix and advisory can ship.
