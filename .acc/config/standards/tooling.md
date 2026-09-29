# tooling.md — Tooling Standard

What runs, who owns its configuration, and how a new tool is admitted. This repository keeps its
tool surface deliberately small; the point of this standard is to keep it that way and to stop the
same setting from being asserted in four files.

## One home per setting

| Setting | Owned by | Never duplicated in |
|---------|----------|---------------------|
| Build, test, lint, docs commands | `package.json` → `scripts` | docs, contracts, `DEVELOPMENT.md` |
| TypeScript compiler options | `tsconfig.json` | any document — link to the flag name |
| Lint rules and severities | `oxlint.config.ts` | a standard or contract |
| ACC configuration | `.acc/config/config.yaml` | `.accignore`, a contract |
| ACC plugin directory | `.acc/config/tools/` | — |
| CI behaviour | `.github/workflows/*.yml` | `workflows/release.md` |
| Agent permissions | `opencode.json` + `.opencode/agents/*.md` | `DEVELOPMENT.md` prose |

A document that needs to state a command writes `npm test`, not the expanded `vitest run`. When
the script changes, the document stays true.

## The command surface

Ten scripts, and these are the only entry points:

| Command | Does |
|---------|------|
| `npm run build` | `tsc` → `dist/` (tests excluded) |
| `npm test` | full Vitest suite, single run |
| `npm run test:watch` | Vitest in watch mode, for local iteration |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Oxlint with the vendored anti-slop plugin |
| `npm run docs:dev` / `docs:build` / `docs:preview` | VitePress site |
| `npm run acc:check` | `acc check` under npm, for environments without a global `acc` |

`acc tools` regenerates this list from `package.json`; when the two disagree, `package.json` is
right and this table is stale. `npm run oxlint` is an alias of `lint` and is not a distinct tool.

## The chain

```
tsc --noEmit ──► types        ─┐
oxlint        ──► anti-slop    ─┼──► all must pass before a change is presented as done
vitest run    ──► behaviour    ─┤
acc check     ──► contracts    ─┘
```

Order matters only for cost: typecheck is the cheapest way to find a broken build, so run it
first. A failure anywhere is fixed, never worked around.

**CI runs lint, typecheck, test, and build** (`.github/workflows/publish.yml`). It does **not**
currently run `acc check`, so the architecture gate is enforced by discipline rather than by CI.
Closing that gap is a deliberate change to the workflow, not an accident — until it is closed,
`acc check` is a reviewer's responsibility.

## The anti-slop plugin

`tools/oxlint/anti-slop/` is **vendored third-party code** with its own `AGENTS.md` contracts. It
is wired in as a JS plugin from `oxlint.config.ts` and configured there. It is not our code to
refactor: report an issue upstream, and do not edit it in place.

It is a **declared dependency area**, so ACC scans it deliberately — `.accignore` does not
exclude it, and ACC does not read `.accignore` at all (only `config.yaml` → `ignore`). The one
exclusion is in `oxlint.config.ts`, which stops the plugin from linting itself.

## ACC as a tool

The `acc` CLI is the context and validation layer, not a runtime. Core commands are offline and
deterministic: same repository + same flags = byte-identical output, no API key, no network. The
AI-backed commands (`acc engine`, `acc review`) are opt-in, token-gated, and never required — a
missing `OPENCODE_API_KEY` degrades them cleanly and changes nothing else.

Configuration is `.acc/config/config.yaml`. Two things to know about it, both recorded in the
file itself: unknown keys are silently dropped (the loader keeps only its known key set, so a
misspelled key is inert rather than an error), and a `templates:` key is not recognised, which is
why the templates directory works by convention alone.

## MCP

`.acc/config/mcp/` holds **dormant** bridge definitions for GitHub and Stripe. Nothing there is
registered or active. If a bridge is ever enabled it is registered once, natively, under `mcp` in
`opencode.json` — the `*.yaml` files are documentation, not a second runtime configuration.

## Admitting a new tool

Requires a human decision, and a stated reason. The bar is deliberately high:

1. **A script**, not a global binary — it must work from a clean clone with `npm ci`.
2. **No runtime dependency** unless the change is explicitly about the dependency surface
   (`standards/security.md`). Dev-dependencies are cheaper than runtime ones but not free.
3. **It must have a rule to enforce, or a check to run.** A tool that can only be run by knowing
   the right invocation is documentation, and belongs in a workflow, not in `package.json`.
4. **It must be deterministic in CI**, or be excluded from CI deliberately with a reason.
5. Update the command table above, and `acc tools` follows automatically.

## Related

- `standards/coding.md` — the rules `oxlint` enforces
- `standards/testing.md` — what each command proves
- `workflows/testing.md` — the procedure these commands are run in
- `oxlint.config.ts`, `tsconfig.json`, `package.json` — the authoritative settings
