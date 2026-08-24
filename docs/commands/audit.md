# audit

Full-repository licensing and compliance audit: scan → understand rights →
apply policy → **PASS / WARN / BLOCKED** → sign the result.

```bash
$ reposell audit
✓ Audit verdict: PASS
  Scanned 214 files · 86 dependencies
  ✓ Repository license file: LICENSE detected as MIT.
  ✓ Project SPDX expression: "MIT" is a valid SPDX expression.
  ✓ LICENSE / manifest consistency: Manifest license matches detected file license (MIT).
  ✓ Dependency license compatibility vs project: All declared dependency licenses are compatible.
  ! Dependencies without license metadata: 3 dependency(ies) declare no license — verify before distribution. — mystery, left-pad
  ! NOTICE / attribution artifacts: No NOTICE file — required when redistributing...
  ✓ Report signed (.reposell/audit/signature.json)
  Artifacts: .reposell/audit/report.json, .reposell/audit/sbom.spdx.json, .reposell/audit/sbom.cyclonedx.json
```

## Flags

| Flag | Effect |
| --- | --- |
| `--json` | Machine-readable report on stdout |
| `--ci` | Exit code `1` when the verdict is BLOCKED (CI gate) |
| `--strict` | Escalate warnings to blocked |
| `--release <tag>` | Bind the audit report to a release |
| `--forbidden "A,B"` | Licenses that must never appear in dependencies |

## What is scanned

- `LICENSE*` / `COPYING*` / `NOTICE*` files (text classification via the same detector as `license check`)
- `package.json`, `Cargo.toml`, `pyproject.toml` — declared license fields
- `package-lock.json` — the full dependency graph with per-package licenses
- Source files — `SPDX-License-Identifier:` headers and copyright lines (bounded scan)

## Checks

| Check | PASS | WARN | BLOCKED |
| --- | --- | --- | --- |
| Repository license file | recognized | unrecognized text | missing |
| Project SPDX expression | valid | absent | invalid |
| LICENSE ↔ manifest consistency | match | — | mismatch |
| Dependency compatibility | all fit | — | any incompatible |
| Copyleft dependencies | none | present | — |
| Forbidden licenses | none present | — | any hit |
| Missing license metadata | — | any | — |
| NOTICE / attribution | present | missing | — |
| `.reposell` artifacts | coherent | missing | incoherent |

## Artifacts

Written to `.reposell/audit/`:

- `report.json` — the full machine report
- `sbom.spdx.json` — SPDX 2.3 SBOM
- `sbom.cyclonedx.json` — CycloneDX 1.5 SBOM
- `signature.json` — Ed25519 signature over the set (when `REPOSELL_SIGNING_KEY` is configured)

## CI usage

```yaml
- name: License compliance gate
  run: reposell audit --ci --strict --release "${{ github.ref_name }}"
  env:
    REPOSELL_SIGNING_KEY: ${{ secrets.REPOSELL_SIGNING_KEY }}
```
