# Development — Agentic Workflow

This repository's agentic workflow is **Herdr** (agentic workspace) + **OpenCode**
(multiagent: **1 orchestrator + 3 subagents**):

- **Herdr** — the agentic workspace: workspaces, tabs, panes, terminals, parallel execution,
  agent/session state. The human stays in control and can inspect or intervene at any time.
- **OpenCode** — the multiagent layer and primary coding interface: one **orchestrator** that
  owns the development lifecycle, plus **3 review subagents** it delegates to by name.
- **ACC + Agent Skills** — the repository context, conventions, and **development lifecycle**
  layer ([ACC — Agent Code Context](https://github.com/EnzoVezzaro/agents-code-context)).

```
Herdr — agentic workspace: workspaces · tabs · panes · terminals · session state
└── OpenCode — multiagent layer (agent selection · primary coding interface)
    ├── orchestrator (primary)   — implementation · lifecycle · delegation
    └── subagents (Task-gated)
        ├── architect            — ACC graph/impact, contracts, invariants
        ├── product-reviewer     — product reasoning, UX, flows, edge cases
        └── ui-reviewer          — visual hierarchy, a11y, states, polish
ACC + Agent Skills — repository context · conventions · development lifecycle
```

## Agent topology — 1 orchestrator + 3 subagents

| Agent | Mode | Source | Role |
|-------|------|--------|------|
| `orchestrator` | primary | [.opencode/agents/orchestrator.md](.opencode/agents/orchestrator.md) | Owns the lifecycle: understand → frame → implement → delegate review → verify → record. The default agent. |
| `architect` | subagent | [.opencode/agents/architect.md](.opencode/agents/architect.md) | ACC-grounded structural review: `acc graph`/`impact`/`context`/`check`, layer boundaries, declared invariants |
| `product-reviewer` | subagent | [.opencode/agents/product-reviewer.md](.opencode/agents/product-reviewer.md) | Product reasoning, UX decisions, user flows, edge cases, unnecessary complexity |
| `ui-reviewer` | subagent | [.opencode/agents/ui-reviewer.md](.opencode/agents/ui-reviewer.md) | Visual hierarchy, interaction, responsive behavior, accessibility, loading/error/empty states, animation, polish |

Delegation is explicit: the orchestrator's `permission.task` is gated to exactly these three
subagents (`*: deny`, then the three names allowed). All three are **read-only**
(`edit: deny` + safe bash allowlist) — they report findings, the orchestrator applies changes.

OpenCode's built-ins remain available: `build`/`plan` are Tab-switchable primaries and
`general`/`explore` can be `@mention`ed directly — but the orchestrator delegates only to the
three named review subagents. Models follow the recorded ladder — orchestrator
`opencode/big-pickle`, architect `opencode/glm-5.3`, review subagents `opencode/glm-5.3-flash`
(OpenCode Zen) — pinned per agent in `.opencode/agents/*.md`; the authoritative map and its
rationale live in `.acc/config/multi-agent/config.yaml` and are not duplicated here.

## Development lifecycle (ACC)

ACC is the **context/convention layer** — not the runtime, not an orchestrator. The repository
is the source of truth: `AGENTS.md` holds declared architectural truth, source code is
discovered structure, `.acc-memory.md` holds durable agent knowledge, and the `acc` CLI turns
that into focused context and deterministic validation.

The orchestrator's lifecycle (also encoded in its prompt):

| Phase | What happens | Commands / artifacts | Actor |
|-------|--------------|----------------------|-------|
| 1. Understand | Inspect contracts and structure before changing anything | `acc context <path>`, `acc impact <path>`, `acc graph` | orchestrator (+ architect) |
| 2. Frame | Problem, user goal, smallest appropriate boundary; ambiguity → interpretation + trade-offs | `AGENTS.md` contracts | orchestrator + human |
| 3. Conventions | Layering, zero-config principle, provider abstractions, TS strictness | `.acc/config/standards/architecture.md` | orchestrator |
| 4. Implement | Smallest appropriate boundary; no premature abstractions | `npm run build`, `npm run typecheck` | orchestrator |
| 5. Review | Structural / product / UI review by delegation | Task → `architect` / `product-reviewer` / `ui-reviewer` | subagents |
| 6. Verify | Deterministic checks, fixed not narrated around | `npm test`, `npm run typecheck`, `npm run lint`, `acc check` | orchestrator |
| 7. Record | Durable knowledge when architecture/conventions changed | `.acc-memory.md` (`acc memory`) | orchestrator |

Human-in-the-loop throughout: the human defines the problem and reviews direction; agents
never silently make major product decisions. Workflow details live in
`.acc/config/workflows/` (`feature.md`, `verify.md`, `release.md`, `security.md`).

### ACC ↔ OpenCode wiring

- **`references.acc`** in `opencode.json` — the ACC repository is `@`-referencable in OpenCode
  for ACC semantics, workflows, and bootstrap.
- **`skills.paths`** — `.agents/skills/acc` (the ACC Agent Skill) is discovered natively;
  `.claude/skills/` holds symlinks into `.agents/skills/` for Claude Code portability only.
- **`architect` subagent** — ACC-native review (graph/impact/context/check) inside the
  delegation topology.
- **`orchestrator` prompt** — the lifecycle above is the agent's operating procedure.
- **`acc check`** — the deterministic gate in the Verify phase (currently: 0 errors,
  0 warnings).
- **`.acc-memory.md`** — durable memory written at the Record phase.

ACC bootstrap (see the [ACC repository](https://github.com/EnzoVezzaro/agents-code-context)):

```bash
acc engine --init-context   # bootstrap/refresh the ACC context layer
acc check                   # deterministic validation
acc graph                   # architecture graph
acc context .               # focused context for a path
```

## Configuration layout

```
opencode.json               # default_agent, skills.paths, references.acc, permission policy
.opencode/
└── agents/                 # 1 orchestrator + 3 subagents (markdown + frontmatter)
    ├── orchestrator.md
    ├── architect.md
    ├── product-reviewer.md
    └── ui-reviewer.md
AGENTS.md                   # ACC contract — read automatically by OpenCode
.acc/                       # ACC config, contracts, workflows (feature/verify/release/security)
.agents/skills/             # canonical Agent Skills (acc, impeccable, install-anti-slop)
```

## Permission policy (`opencode.json`)

Deliberate allow/ask split — development operations allowed where safe, destructive operations
require confirmation (last-match-wins: broad `"*": "allow"` first, narrow `ask` rules after):

| Operation | Policy |
|-----------|--------|
| Editing project files, running tests, lint, typecheck | allowed (primary agents) |
| File access outside the project (`external_directory`) | ask |
| `rm*`, `rmdir*`, `mv*`, `shred*` (destructive filesystem) | ask |
| `git push*`, `git reset*`, `git clean*`, `git restore*` | ask |
| `npm publish*` | ask |
| Secrets/credentials | never expose (behavioral rule, enforced by AGENTS.md and agent prompts) |

Deliberate omission: no global `edit: "allow"` — it was tested and removed because global rules
merge after `plan`'s built-in `edit: deny *` and last-match-wins would silently break Plan
Mode's read-only guarantee (verified via `opencode debug agent plan`).

MCP is an optional integration boundary only — if ever needed, servers are declared natively
under `mcp` in `opencode.json`. None are configured or required.

## Herdr multiagent workspace

Herdr owns the runtime; OpenCode's agent selection stays connected to it through the native
`opencode` integration (state plugin at `~/.config/opencode/plugins/herdr-agent-state.js`).
Agents are selected in OpenCode; every session is observable and manageable from Herdr — one
connected system, not two unrelated agent systems.

Bring-up (native Herdr commands only — nothing is reimplemented in this repo):

```bash
herdr --session reposell                 # named persistent session/workspace
herdr workspace create|list|focus        # workspaces
herdr tab create|list|focus              # tabs (e.g. Orchestrator | Verification)
herdr pane list|layout                   # panes
herdr agent start <name> --kind opencode --pane <ID>   # launch OpenCode in a pane
herdr agent prompt <target> "<task>"     # drive an agent
herdr agent wait <target> --until idle   # await completion
herdr agent list                         # observe all live sessions (id, status, workspace)
herdr agent read|attach <target>         # inspect/intervene — the human stays in control
```

The orchestrator runs in its pane as a normal OpenCode session; review subagents run as child
sessions inside it (Task tool, navigable in the TUI) and Herdr tracks the pane-level agent
state. Parallel work uses isolated worktrees (`herdr worktree`) so file ownership stays clean.
Claude Code is compatibility-only (symlinked skills) — not part of the runtime.

## Agent selection and delegation

- **Primary agents** (`orchestrator` default, `build`, `plan`): cycle with `Tab`, or
  `opencode run --agent orchestrator`. Without `--agent`, the orchestrator is used.
- **Subagents**: `@mention` in the TUI, or delegated by the orchestrator through the Task tool
  (gated to `architect`, `product-reviewer`, `ui-reviewer`).

## Verification record (2026-09-29 · OpenCode 1.18.33 · Herdr 0.9.1 · ACC 0.6.9)

1. **Config resolves strictly** — `opencode debug config`: `default_agent: orchestrator`,
   `references.acc` resolved, permission policy as intended. ✅
2. **Topology recognized** — `opencode agent list`: `orchestrator (primary)` +
   `architect`, `product-reviewer`, `ui-reviewer (subagent)`, plus OpenCode built-ins. ✅
3. **Task gate resolved** — `opencode debug agent orchestrator`: `task *: deny` followed by
   exactly the three named `allow` rules. ✅
4. **Orchestrator executes as itself** — `opencode run --agent orchestrator` →
   `> orchestrator` → `ORCH-OK`; bare `opencode run` (no `--agent`) also selects
   `orchestrator`. ✅
5. **Delegation through the gate** — orchestrator → Task → `architect`
   (`• Invoke architect subagent Architect Agent`) → `ARCH-OK`; earlier rounds:
   `product-reviewer` → `PROD-OK`, `ui-reviewer` → `UI-OK`. Each ran as its own agent identity. ✅
6. **ACC healthy** — `acc check`: 0 errors, 0 warnings (13 infos). ✅
7. **Skills discovery** — `opencode debug skill` resolves `.agents/skills/acc` canonically. ✅
8. **Herdr observes sessions** — `herdr integration status`: `opencode: current (v12)`;
   `herdr agent list` reports live OpenCode sessions with real session ids
   (`source: herdr:opencode`), status, workspace and pane ids. ✅

### Limitations (honest)

- **Headless runs cannot select subagents directly.** `opencode run --agent architect` warns
  `agent "..." is a subagent, not a primary agent` and falls back. Subagents are invocable via
  TUI `@mention` or Task-tool delegation (both verified).
- **The orchestrator delegates only to the three named subagents by design.** Built-in
  `general`/`explore` remain user-invocable but are hidden from the orchestrator's Task list.
- **Default model runtime was down at verification time.** The configured default
  `local/gpt-5.6-terra` (local OAuth proxy on `127.0.0.1:10531`) was unreachable; verification
  ran on an explicitly selected `google/gemini-2.5-flash-lite`. Re-run once the proxy is up.
- **ACC's `acc agents` multi-agent orchestration is reserved, not implemented in ACC V1** —
  orchestration therefore lives in OpenCode's native Task tool (as configured here), while ACC
  stays the context/convention layer.
- **Skill listing can be non-deterministic** when large global skill collections
  (`~/.opencode/skills`) race during scanning; project skills resolve consistently.
- **Config is not hot-reloaded** — restart the OpenCode TUI after editing `opencode.json` or
  agent files.
- Herdr's integration is global machine configuration; a fresh machine needs
  `herdr integration install opencode` once.

## Quick demo (interview)

```bash
opencode agent list       # 1 orchestrator + 3 subagents (+ built-ins)
opencode                  # starts on orchestrator (default_agent); Tab for build/plan
                          # @architect / @product-reviewer / @ui-reviewer to invoke directly
herdr agent list          # Herdr sees the running OpenCode sessions
acc check && acc graph    # the ACC layer the lifecycle runs on
```
