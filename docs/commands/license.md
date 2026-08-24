# license

Check, choose and generate repository licenses. Runs automatically during `init`.

## Commands

### `reposell license check`

Detect the repository's license and report how it interacts with selling.

```bash
$ reposell license check
✓ License detected: MIT (SPDX: MIT)
  Selling via reposell: allowed.
```

Detection order: root `LICENSE*` / `COPYING` files → manifest `license` fields (`package.json`, `Cargo.toml`, `pyproject.toml`, `composer.json`) → GitProvider license API as cross-check.

### `reposell license use <template>`

Generate a `LICENSE` from a reposell template, filled with your details.

| Argument | Value |
| --- | --- |
| `<template>` | `rsl` — RepoSell Source License 1.0 (source-available, fork-specific, AI reservations) |

```bash
$ reposell license use rsl --holder "Enzo Vezzaro" --repo-url auto
✓ Generated LICENSE (RSL-1.0)
✓ Generated .reposell/ai-policy.json (machine-readable rights reservation)
  Holder: Enzo Vezzaro · Repo: auto-detected
! Not committed — review the diff and commit yourself.
```

Flags: `--holder <name>` (default: git config user.name), `--repo-url auto|<url>`, `--year <year>`, `--no-policy` (skip ai-policy.json), `--force` (replace an existing generated template file; never overwrites a hand-written license without it).

**Fork Licenses are not issued by the CLI.** The per-purchase Fork License is generated at listing checkout and signed by the listing's issuer key. The CLI only verifies them (`reposell verify <license-file>`).

### `reposell license keep`

Explicitly keep your existing license. Records `license: keep-existing` in `reposell.yml` so future runs stop suggesting.

## Behavior rules

- **Never overwrites silently** — generation shows a diff first; hand-written licenses require `--force`.
- Deterministic output: same inputs produce byte-identical license text, whose SHA-256 is recorded in your signed listing manifest.
- The generated `.reposell/ai-policy.json` mirrors RSL-1.0's reservations in machine-readable form (headers and robots.txt signals are served by listing endpoints, not stored in your repo).
- Unlicensed repositories cannot enable `/sell` — buyers must receive terms.
- These templates are source-available by design, not OSI open source. Don't describe RSL projects as open source.

### `reposell license compose`

Compose a complete rights policy from a profile + overrides and write the
machine-readable artifacts. See [Licensing Policy & Compliance](/guide/licensing-policy) for the full model.

```bash
$ reposell license compose --profile source-available-commercial --spdx LicenseRef-reposell-RSL-1.0
✓ Composed license policy — profile: source-available-commercial · SPDX: LicenseRef-reposell-RSL-1.0
✓ Policy hash: 9f2c… (bound into signed release manifests)
✓ Wrote .reposell/license.json
✓ Wrote .reposell/ai-policy.json
✓ Wrote .reposell/commercial-policy.json
✓ Wrote .reposell/authorization.json
✓ Appended policy section to LICENSE
```

| Flag | Value |
| --- | --- |
| `--profile` | One of the 15 profiles (see the guide) |
| `--spdx` | SPDX expression (`MIT`, `MIT OR Apache-2.0`, `LicenseRef-reposell-*`) |
| `--exception` | SPDX exception id |
| `--jurisdiction` | Jurisdiction note |
| `--set right=value` | Override any single right (repeatable) |

### `reposell license explain`

Plain-language summary of the active policy (from `.reposell/license.json` or
composed from `reposell.yml`), including the policy hash.

### `reposell license validate`

Validates the `.reposell/*` artifacts: schema, completeness (policies must be
total — no missing rights), and cross-file coherence (derived policies must be
subsets of the canonical policy).

### `reposell license compatibility <dep> [project]`

SPDX family compatibility: `compatible`, `compatible-with-conditions`,
`incompatible`, or `unknown` (unknown identifiers are never guessed).

```bash
$ reposell license compatibility GPL-3.0-only
GPL-3.0-only → MIT: incompatible
```
