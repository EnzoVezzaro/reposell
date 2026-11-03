# Command Reference

The reposell CLI ships a small set of composable commands. Everything is derived from Git and `reposell.yml` — there is no daemon, no server and no global state.

```bash
reposell <command> [args]
```

## Commands (shipped)

These are the commands actually registered in `src/bin/reposell.ts` (the CLI
dispatcher). Status here is authoritative for the shipped binary.

| Command | Description |
|---------|-------------|
| `init [--yes] [--wizard]` | Detect the repository, create `reposell.yml`, generate the CI workflow and an Ed25519 verification key |
| `license check` | Detect and explain the repository license |
| `license use rsl` | Generate an RSL-1.0 `LICENSE` + `ai-policy.json` with your info |
| `license keep` | Record that you keep your existing license |
| `license compose` | Compose a rights policy profile into `.reposell/*` artifacts |
| `license explain` | Plain-language summary of the active policy |
| `license validate` | Validate the machine-readable licensing artifacts |
| `license compatibility` | SPDX dependency compatibility check |
| `audit` | Full licensing/compliance audit — PASS / WARN / BLOCKED, SBOMs, signed report |
| `reciprocity [--revenue N]` | Show, validate and simulate the Reciprocity Program |
| `listing status` | Dashboard: repo, license, `/sell` endpoint, live Stripe account state |
| `listing publish <tag>` | Build + verify a Listing publication PR payload (writes `.reposell/listing-pr.json`) |
| `sell init [--link URL] [--name NAME]` | Scaffold the `/sell` storefront wired to a Stripe Payment Link |
| `sell create-link --price N [--currency USD]` | Create a Stripe Payment Link with the correct redirect |
| `sell sync [payment_link_id]` | Pull-based fulfillment: purchases, refunds, fork artifacts |
| `release [tag] [--price N] [--currency USD] [--link URL]` | Declare a release (interactive when flags are omitted) |
| `publish [tag]` | Run the publication gate and approve a release (manual mode) |
| `validate` | Run the full publication gate checklist |
| `build [--out dist]` | Generate the `/reposell/*` static surface |
| `health` | Health report for every configured release |
| `verify <manifest\|trust\|pricing> [url]` | CI verification entry points |
| `keys <generate\|show>` | Ed25519 signing identity management |
| `balance` | Show Stripe balance and payout status |
| `help` / `--help` / `-h` | Show usage |
| `--version` / `-v` / `version` | Print the CLI version |

## Planned / not-yet-registered commands

These names appear in older docs or the implementation tracker but are **not**
registered in `src/bin/reposell.ts` today. They are listed here only so the
status is unambiguous; do not treat them as available.

| Command | Status |
|---------|--------|
| `configure` | Planned — inspect/modify `reposell.yml` from the terminal (not implemented) |
| `doctor [--fix]` | Planned — full local audit with auto-repair (not implemented) |
| `payment setup` / `payment verify` | Planned — validate a seller Payment Link against a release (not implemented) |
| `listing enable` / `disable` / `register` / `verify` | Planned/legacy — listing registration helpers (not implemented; use `listing status` and `listing publish`) |
| `sell generate` / `validate` / `preview` | Planned/legacy — local `/sell` generation/preview (not implemented; use `build`) |


## Global options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show usage |
| `-v, --version` | Print the CLI version |

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Failure (validation, missing config, network — the report explains why) |

## Environment variables

| Variable | Description |
|----------|-------------|
| `REPOSELL_SIGNING_KEY` | Ed25519 private seed (base64) — signing builds, CI secret |
| `REPOSELL_STRIPE_SECRET_KEY` | Stripe secret key (preferred) — local tooling only |
| `STRIPE_SECRET_KEY` | Stripe secret key fallback |
| `REPOSELL_OFFICIAL_VERIFY_KEY` | Official Ed25519 public key for remote verification |

Checkout never uses secret keys — buyers go through Stripe Payment Links. See [Environment Variables](/configuration/env) for details.
