# src/domain

## Purpose

Pure business logic of the reposell protocol — the core layer everything else depends on.

## Ownership

Owner: src/domain (inherits ../../AGENTS.md)

## Structure

- `protocol/` — versioned protocol documents
- `licensing/` — rights, policies, schemes×offers, compatibility
- `license/` — SPDX detection/parsing, license templates
- `payment/` — payment link validation, Stripe link/payout adapters
- `pricing/` — marketplace pricing endpoint verification chain
- `listing/` — listing ⇄ /sell separation (PR payload, discovery, health)
- `selling/` — sell sync fulfillment, fork provisioning
- `release/` — release state machine, version parsing
- `reciprocity/` — seller-configured reciprocity program
- `audit/` — repository scan, compliance checks, SBOMs
- `signature/` — Ed25519 signed envelopes

## Constraints

- No external service calls except behind declared adapters with injected seams.
- Deterministic output (canonical JSON) is a hard invariant.
- Never hardcode Stripe or GitHub — abstractions only (PaymentProvider, GitProvider).
