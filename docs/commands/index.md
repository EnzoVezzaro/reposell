# Command Reference

The reposell CLI ships a small set of composable commands. Everything is derived from Git and `reposell.yml` — there is no daemon, no server and no global state.

```bash
reposell <command> [args]
```

## Commands (shipped)

| Command | Description |
|---------|-------------|
| `init` | Detect the repository, create `reposell.yml`, generate the CI workflow and an Ed25519 verification key |
| `license check` | Detect and explain the repository license |
| `license use rsl` | Generate an RSL-1.0 `LICENSE` + `ai-policy.json` with your info |
| `license keep` | Record that you keep your existing license |
| `license compose` | Compose a rights policy profile into `.reposell/*` artifacts |
| `license explain` | Plain-language summary of the active policy |
| `license validate` | Validate the machine-readable licensing artifacts |
| `license compatibility` | SPDX dependency compatibility check |
| `audit` | Full licensing/compliance audit — PASS / WARN / BLOCKED, SBOMs, signed report |
| `listing status` | Dashboard: repo, license, `/sell` endpoint, live Stripe account state |
| `release <tag>` | Declare a release (price, currency, Payment Link — interactive when flags are omitted) |
| `publish <tag>` | Run the publication gate and approve a release (manual mode) |
| `validate` | Run the full publication gate checklist |
| `build [--out dist]` | Generate the `/reposell/*` static surface |
| `health` | Health report for every configured release |
| `verify <manifest\|trust\|pricing> [url]` | CI verification entry points |
| `keys <generate\|show>` | Ed25519 signing identity management |
| `help` | Show usage |

## Planned commands

These are specified in the protocol and land in upcoming releases:

| Command | Purpose |
|---------|---------|
| `configure` | Inspect and modify `reposell.yml` from the terminal |
| `sell` | Generate and preview the `/sell` page locally |
| `doctor` | Full local audit with `--fix` for safe repairs |
| `payment setup` / `payment verify` | Validate a seller Payment Link against a release |

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
