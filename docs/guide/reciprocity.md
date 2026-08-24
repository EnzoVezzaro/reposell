# Reciprocity Program

**Seller-configured, buyer-enforced.** The seller decides the Reciprocity
rules for the forks generated from purchases of their `/sell` package. The
seller's own repository does **not** automatically become subject to those
rules.

```text
SELLER publishes /sell
  ├── Price
  ├── License
  ├── Fork configuration
  └── Reciprocity Program        ← defines rules for purchased forks
        ▼
BUYER PURCHASE → NEW FORK CREATED
  ├── Purchased license
  ├── Release/version
  ├── Reciprocity manifest
  └── Dependency/provenance graph
        ▼
BUYER OWNS / OPERATES FORK
  └── if commercially successful → CONTRIBUTION
        → Original repo · Upstream deps · Contributors
```

## Configuration

```yaml
reciprocity:
  enabled: true

  threshold:
    amount: 2000000
    currency: USD
    period: annual          # annual | lifetime

  contribution:
    rate: 2                 # percent
    basis: revenue

  recipients:
    - recipient: original_repository
      share: 50
    - recipient: dependencies
      share: 30
    - recipient: contributors
      share: 10
    - recipient: reposell
      share: 10

  # Independent opt-in — see below
  apply_to_own_use: false
```

Validation rules: recipient shares must total exactly **100**, known
recipients only (`original_repository`, `dependencies`, `contributors`,
`reposell`), rate 0–100, positive threshold, `annual`/`lifetime` period.

## What it means — and what it does not

This configuration means:

> **Every purchased fork created from this `/sell` package carries this
> Reciprocity program.**

It does **not** mean:

> "The seller owes 2% of their own revenue."

Reposell Reciprocity is primarily a mechanism for making **commercially
successful purchased forks** give back to the ecosystem that made those
forks possible.

## Seller's own project

```yaml
reciprocity:
  enabled: true
  apply_to_own_use: false   # ☐ Also enable Reciprocity for my own commercial use
```

The second option is an independent decision. When enabled, the program
additionally binds the seller's own commercial use — never automatically.

## Purchased forks

`reposell sell sync` writes `REPOSELL-RECIPROCITY.json` next to every
purchase record — the program manifest bound to that fork (buyer, fork
name, source repository + release, program fingerprint). The buyer-side
computation is pure:

```text
fork revenue ≥ threshold (per period)
  → contribution = revenue × rate
  → split across recipients by share
```

## CLI

```bash
$ reposell reciprocity                       # show + validate the program
$ reposell reciprocity --revenue 2500000     # simulate a fork's contribution
  Simulation at 2500000 USD annual revenue:
    contribution (2%): 50000
      → original_repository: 25000
      → dependencies: 15000
      → contributors: 5000
      → reposell: 5000
```
