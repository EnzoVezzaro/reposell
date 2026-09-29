# architecture.md — Architecture Standard

The layering, boundaries, and dependency rules of this repository. Source of truth for *where
code goes* and *what may depend on what*; everything else in `.acc/config/standards/` assumes it.

This file describes the code that exists. When it disagrees with the tree, the tree is wrong and
the fix is a change request, not an edit to this document.

## Layers

`src/` is organised in four inward-facing layers plus two support layers. Dependencies point
**inward only**.

```
  bin → commands → app → domain
                ↘   ↗
              config, utils          (support: read by the layers above)
              workflows              (generators: consume app/config/utils, emit files)
```

| Layer | Path | Contains | May depend on |
|-------|------|----------|---------------|
| Domain | `src/domain/` | pure protocol logic: licensing, payment, pricing, listing, release, reciprocity, audit, signature, protocol documents | `src/utils` only, and only for crypto primitives — see Known deviations |
| Application | `src/app/` | use-case services and typed result objects | `domain`, `config`, `utils` |
| Interface | `src/commands/` | one module per command: argument handling and output formatting | `app`, `config`, `cli`, `domain` |
| Entry | `src/bin/` | the two executables, wired to `commands` | `commands`, `cli` |
| Support | `src/config/`, `src/cli/`, `src/utils/` | configuration parsing, terminal prompts/banner, shared helpers | `utils` |
| Generators | `src/workflows/` | CI YAML and storefront scaffolding | `app`, `config`, `utils` |

Enforced as machine-checked rules in `.acc/config/config.yaml` → `forbidden_deps`, which is why
`acc check` reports 5 standing `ACC025` warnings: those rules are guardrails that currently match
no edge. The moment a `src/domain → src/app|commands|cli|bin|config` import appears, the same
config emits `ACC024` (error, exit 1).

There is **no `src/infrastructure/` layer.** Adapters live next to the domain logic they serve
(`src/domain/payment/stripe.ts` holds the Stripe adapter; `src/domain/audit/` holds the scanner)
and shared adapter-shaped helpers live in `src/utils/`. Do not reintroduce an infrastructure
directory without a decision recorded in `AGENTS.md` and `.acc-memory.md`.

## Layer rules

1. **`domain` is pure.** No `process.env`, no `fs`, no `fetch`, no clock, no randomness. I/O enters
   through an injected seam (a function argument) — see `src/domain/payment/stripe.ts`
   (`doFetch`) and `src/app/signing-service.ts`. A builder that is pure stays pure when the data
   arrives over the network.
2. **`app` orchestrates, `commands` present.** Services return typed results; commands format
   them. Business rules never live in `commands/`, and no `console.log` output formatting lives
   in `app/`.
3. **`bin` is wiring only.** The command registry is a `switch` in `src/bin/reposell.ts` with a
   top-level import per command. There is no barrel or registry module to update.
4. **`config` fails closed.** An invalid `reposell.yml` produces a `ConfigInvalidError` with
   actionable issues, never a silent default. Validation is hand-written against `unknown` in
   `src/config/index.ts` — there is no schema library in the dependency tree.
5. **`utils` holds no policy.** It reads git metadata, the environment, and crypto primitives. It
   does not decide anything.

## Zero-config derivation

Every value the CLI needs is derived, never asked for. `src/utils/git.ts` reads the remote to
produce owner, name, URL, and provider; `src/config/index.ts` fills unset fields from it; the
prompts in `src/cli/prompts.ts` only run when derivation fails. A new command must not introduce
a required value that git, GitHub, or CI already knows.

## Generated output namespaces

Two, and they are not interchangeable:

| Namespace | Written by | Rule |
|-----------|-----------|------|
| `<out>/reposell/**` | `src/app/build-service.ts` | the published protocol surface; byte-identical for identical input |
| `.reposell/**` | `build-service`, `src/workflows/sell.ts`, licensing generators | repository-local working state (manifests, storefront, audit reports) |
| `.github/workflows/**` | `src/workflows/ci.ts` | only `reposell*.yml`, and only after confirmation |

A generator owns **only** its namespace. `build-service` must never touch a user's working tree;
`workflows/ci.ts` must never overwrite an existing workflow file. See
`standards/protocol.md` for the wire contract.

## Extension points

| Change | Where | Contract to update |
|--------|-------|-------------------|
| New command | `src/commands/<name>.ts` + a case in `src/bin/reposell.ts` | `src/commands/AGENTS.md`, root `AGENTS.md` |
| New protocol document or schema id | `src/domain/protocol/documents.ts` | `standards/protocol.md`, `docs/protocol/` |
| New service | `src/app/<name>-service.ts` | `src/app/AGENTS.md` |
| New domain concept | `src/domain/<area>/` with its own `AGENTS.md` | `src/domain/AGENTS.md` |

Re-export anything meant to be public from `src/index.ts` — that file is the SDK surface, and it
is the only place a consumer is allowed to import from.

## Known deviations

Recorded, not endorsed. Each is a real inconsistency between a declared invariant and the code;
closing one is an architecture decision for the human, not a documentation fix.

1. **`src/domain → src/utils` is real.** `src/domain/signature/envelope.ts` and
   `src/domain/pricing/endpoint.ts` import `canonicalJSON`, `verify`, and `decodeSignature` from
   `src/utils/crypto.ts`. This contradicts "domain has zero external dependencies"
   (`src/AGENTS.md`). It is deliberately **not** encoded in `forbidden_deps`, because
   `canonicalJSON` *is* protocol behaviour (a signed document's bytes must be canonical) rather
   than an infrastructure concern. Either the crypto primitives move to `src/domain/`, or the
   "pure" rule is narrowed to "no I/O, no services". Both are legitimate; the current state is
   just undeclared.
2. **`PaymentProvider` and `GitProvider` interfaces do not exist.** `src/domain/payment/stripe.ts`
   exports a concrete `StripePaymentProvider` class, and git access is a set of functions in
   `src/utils/git.ts`. The abstraction is asserted in the root `AGENTS.md`, in
   `.acc/config/mcp/README.md`, and in older revisions of this file, but there is no interface to
   hold it. Any claim of provider abstraction in documentation is aspirational until the
   interfaces are extracted. The zero-config derivation and the config-declared
   `payment.provider` / `repository.provider` fields are the honest current state.
3. **The root contract's owner is wrong.** Root `AGENTS.md` says `Owner: src/cli` — a template
   placeholder that was never replaced. It makes the whole repository appear owned by one
   subdirectory (`acc graph` shows `. owners: [src/cli]` and `src/cli` depending on every
   boundary). The root boundary should be owned by the project.

## Anti-patterns

- **YAML frontmatter in `AGENTS.md`.** ACC parses contracts heuristically; a frontmatter block is
  not a schema and is not read.
- **Competing instruction files.** `AGENTS.md` is the single contract surface — no `CLAUDE.md`,
  `CURSOR.md`, or `CODEX.md` competing with it.
- **Architectural rules in `.acc-memory.md`.** Contracts and invariants belong in `AGENTS.md` and
  in `.acc/config/standards/`; memory is for gotchas and decisions.
- **Declaring inferred facts as declared.** Anything ACC inferred must say so
  (`<!-- inferred: … -->`), and ownership is never assigned from an `acc` suggestion without
  review.
- **A new abstraction before the second caller.** Two concrete implementations, then the
  interface.
- **Business logic in `commands/`, or I/O in `domain/`.** The two rules most often broken.

## Related

- `standards/coding.md` — language and lint conventions
- `standards/testing.md` — what each layer is tested with
- `standards/protocol.md` — the wire contract this layering serves
- `standards/review.md` — how boundaries get checked before merge
