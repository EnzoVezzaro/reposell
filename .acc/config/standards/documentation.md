# documentation.md — Documentation Standard

Where a piece of knowledge belongs, and what "done" means for the documents a change touches.
This repository has a lot of prose and a hard rule against duplication: **one fact, one home.**

## The four homes

| Home | Holds | Lifetime |
|------|-------|----------|
| `AGENTS.md` (per boundary) | the contract: purpose, ownership, dependencies, constraints for **that** directory | architectural, changes rarely |
| `.acc/config/standards/` | project-wide rules that apply everywhere: architecture, coding, testing, review, security, protocol, tooling, documentation | changes with a convention |
| `.acc-memory.md` (per boundary) | durable knowledge: gotchas, decisions, rejected approaches, operational detail | grows continuously, gitignored |
| `docs/` | user-facing product documentation: guides, commands, configuration, protocol reference | shipped to readers |

The test for which home a fact belongs in:

- Would it change how code in **one** directory is written? → that directory's `AGENTS.md`.
- Would it change how code is written **anywhere**? → `.acc/config/standards/`.
- Is it useful to a future agent but not binding? → `.acc-memory.md`.
- Would a user of the CLI need it? → `docs/`.

Anything that does not fit — architecture in memory, a rule in memory, a user guide in a
contract — is in the wrong place, and moving it is a normal part of finishing the work.

## The duplication rule

The same fact must appear in exactly one place, with links elsewhere. Specifically:

- **The agent topology** (who exists, which model, who may delegate) is stated once, in
  `.acc/config/multi-agent/config.yaml`. `DEVELOPMENT.md`, the root `AGENTS.md`, and the
  `.acc/config/agents/*.md` files link to it. A second table of models is a defect.
- **Commands** are defined by `package.json` scripts and by the `switch` in
  `src/bin/reposell.ts`. Documents name a command; they never restate its flags exhaustively.
- **Rule severities** live in `oxlint.config.ts`. A document explains *why* a rule is downgraded;
  it does not copy the level list as authority.
- **Schema ids and the protocol version** live in `src/domain/protocol/documents.ts`. `docs/`
  describes them for users; it does not become a second source.
- **Config keys and their environment overrides** are documented in
  `docs/configuration/env.md` and defined in `src/config/index.ts`. A contract states the
  invariant ("fails closed"), not the key list.

When two documents disagree, the code wins, then the more specific document wins, and the
conflict is fixed in the same change. A stale sentence is a defect, not a nit.

## Writing an `AGENTS.md`

- **Plain Markdown. No YAML frontmatter.** ACC parses contracts heuristically by conventional
  headings and never requires them; a frontmatter block is invisible to it.
- Sections in the conventional order: `Purpose`, `Responsibilities`, `Ownership`, `Inputs`,
  `Outputs`, `Dependencies`, `Constraints`, then anything the boundary needs
  (`Structure`, `Commands`, `Testing`).
- **Purpose is one sentence.** If it needs a paragraph, the boundary is two boundaries.
- **Dependencies list real paths**, one per line, as the repository parses them — a
  single-segment path keeps its trailing slash (`.github/`, `docs/`). A dependency with no code
  reference behind it is the "docs ahead of code" drift ACC reports; either implement it or drop
  the line.
- **Constraints are invariants, not aspirations.** "Never hardcode Stripe" is a constraint. "Use
  the PaymentProvider interface" is not one, because that interface does not exist — see the
  known deviations in `standards/architecture.md`.
- **Mark anything ACC inferred** with `<!-- inferred: … -->`. Never assign an owner from an ACC
  suggestion without checking it.
- Link the standards the boundary actually follows. This is not decoration: `acc slice` reports
  the standards a contract references, and a boundary that references none looks ungoverned.
- Inherit by position. A directory with no `AGENTS.md` is not a boundary; do not create one for a
  folder that is only a grouping.

## Definition of Done

A change is done when every one of these is true. They are not aspirational; the first four are
mechanically checkable.

1. `npm test`, `npm run typecheck`, `npm run lint`, and `acc check` pass.
2. A new command resolves in the `src/bin/reposell.ts` registry and is re-exported from
   `src/index.ts` if it is public.
3. Every touched boundary's `AGENTS.md` matches the code — dependencies, constraints, ownership.
4. `acc check` reports no **new** diagnostics. The 5 standing `ACC025` warnings from
   `forbidden_deps` are the intended steady state and are not a failure.
5. Tests cover the new behaviour, including the negative path for anything that gates a decision.
6. `docs/` is updated when user-facing behaviour, a flag, a config key, or the protocol surface
   changed. A CLI change with no docs change is incomplete.
7. `.acc-memory.md` gained the gotcha, the rejected approach, or the decision — not a summary of
   the diff.
8. Delegated review ran where `standards/review.md` requires it, and every finding was applied
   or answered.

## Prose in this repository

- Second person, active voice, present tense. "The CLI derives the owner from the git remote."
- Short sentences. A rule a reader must follow beats a paragraph about why the rule is nice.
- No hedging in a constraint. If it is a real rule, say it; if it is a preference, it is not a
  constraint.
- No dates in a contract. They rot. Put the date in `.acc-memory.md` and in `CHANGELOG.md`.
- Code examples are real. If an example would not compile against this repository, it is worse
  than no example.

## Related

- `standards/architecture.md` — the boundaries a contract describes
- `standards/review.md` — the documentation half of the review checklist
- `DEVELOPMENT.md` — the lifecycle, agent topology, and permission model
- `IMPLEMENTATION.md` — the build record for the protocol
- `CHANGELOG.md` — released changes
