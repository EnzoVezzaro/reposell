# review.md — Review Standard

How work in this repository gets reviewed: who reviews it, what severity means, and what each
reviewer is accountable for. The agent prompts and the delegation gate live in
`.opencode/agents/` and `opencode.json`; this file is the standard they are held to.

## Model

One **orchestrator** (`.opencode/agents/orchestrator.md`) owns the change and the lifecycle. Three
**read-only subagents** report findings; the orchestrator applies them or states why not. A
subagent never edits a file and never resolves a product decision on its own.

| Reviewer | Accountable for | Not accountable for |
|----------|------------------|---------------------|
| `architect` | layer boundaries, declared invariants, contract consistency, `acc graph`/`impact`/`check` output, blast radius | wording, UX, style |
| `product-reviewer` | user-facing behaviour, flows, edge cases, error messages, unnecessary complexity | internal structure, visual polish |
| `ui-reviewer` | visual hierarchy, interaction, responsive behaviour, accessibility, loading/empty/error states, motion | backend or protocol correctness |

The authoritative topology and model ladder is `.acc/config/multi-agent/config.yaml`. Do not
restate it in a contract or a workflow.

## When a review is required

| Change | Delegated review |
|--------|------------------|
| New command, new service, new domain area | `product-reviewer` + `architect` |
| Layering, ownership, dependencies, generated namespaces | `architect` (required) |
| CLI output, flags, exit codes, prompts | `product-reviewer` (required) |
| Anything under `docs/.vitepress/`, `branding/` | `ui-reviewer` + ego lite pass (`standards/testing.md`) |
| Crypto, keys, payments, trust or signature decisions | `architect` + the `security.md` workflow, both required |
| Documentation-only | self-review against `standards/documentation.md`; no delegation unless the contract changed |

Read-only reviewers are cheap enough that a second opinion on a structural change costs less than
the rework. When in doubt, delegate.

## Severity

Reviewers report findings under these labels, and the labels mean the same thing everywhere in
this repository:

- **BLOCK** — the change is wrong: a broken invariant, a security or money-handling defect, a
  missing fail-closed path, a violated layering rule, a determinism break, or a failing check.
  Ship-blocking. Fix or explicitly waive with a reason a reviewer would accept.
- **WARN** — a real risk with a plausible wrong outcome: missing test coverage on a gate, an error
  message that will confuse a user, a boundary that should have been declared. Fix, or record why
  it is acceptable.
- **NIT** — style, naming, wording, a preference. Take it or leave it; do not let a NIT delay a
  change, and do not open a dispute over one.

A finding without a file and a line is not a finding. A finding without a consequence is a NIT.

## Checklists

**Structure** (`architect`)

- [ ] New or changed code sits in the layer `standards/architecture.md` assigns it.
- [ ] No new edge from `src/domain` outward — `acc check` reports no new `ACC024`.
- [ ] `forbidden_deps` in `config.yaml` still describes the rule that is actually wanted; a rule
      that has become vacuous is removed, not left warning forever.
- [ ] `AGENTS.md` for every touched boundary reflects the code: dependencies, constraints, and
      ownership are true, and inferred content is marked `<!-- inferred: … -->`.
- [ ] `acc impact <boundary>` was run and the affected tests were run.

**Correctness** (`product-reviewer`)

- [ ] The command does what the user expects, or the help text says what it actually does.
- [ ] Failure paths: wrong input, missing key, network failure, partially-written state.
- [ ] Money and pricing: minor units, fail-closed, no browser-supplied confirmation trusted.
- [ ] Error messages state what happened **and** what to do next, and leak no secret.
- [ ] Nothing added that no user asked for. The cheapest feature is the one not written.

**Interface** (`ui-reviewer`, docs and branding only)

- [ ] Loading, empty, and error states exist — not just the success state.
- [ ] Keyboard reachable, visible focus, sensible heading order, labelled controls.
- [ ] Contrast and hierarchy hold in every theme that ships.
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] Verified on the running surface with ego lite, not reasoned about from the source.

**Trust**

- [ ] Deterministic: no clock, randomness, or key-order dependence in generated output.
- [ ] No secret in a log, an error, a test fixture, or a committed file.
- [ ] The `security.md` workflow was run if the change touched crypto, keys, payments, or trust.

## Rules for reviewers

- Report, do not fix. Findings come back as text; the orchestrator owns the edit.
- Review the change against the contract, not against the change's own description of itself.
- Say when something is fine. A review that lists only problems gives no signal about coverage.
- Never present an `ACC0xx` diagnostic as a fact about intent — ACC reports repository state.
  `.acc-memory.md` entries are `memory/inferred` until a human or the code confirms them.

## Rules for the orchestrator

- Every finding is either applied or answered. "Not applicable because …" is a valid outcome;
  silence is not.
- A BLOCK finding is never deferred to a follow-up task without the human's agreement.
- Review comes **after** implementation and **before** verification is presented as done
  (`DEVELOPMENT.md`, phases 5 and 6).
- Findings that reveal a documentation lie — a standard or contract describing something the
  code does not do — are fixed in the same change, not filed separately.

## Related

- `standards/architecture.md` — the boundaries being defended
- `standards/coding.md` — the rules behind most WARN findings
- `standards/testing.md` — coverage expectations
- `standards/security.md` — the trust checklist
- `DEVELOPMENT.md` — where review sits in the lifecycle
