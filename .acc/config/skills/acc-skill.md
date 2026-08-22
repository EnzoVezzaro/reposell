# ACC Skill: agent-code-context

This skill provides the ACC CLI capability. It is installed via the Agent Skills system.

## Installation

```bash
# Global (available to all projects)
npx skills add EnzoVezzaro/agents-code-context --skill acc --global

# Per project
npx skills add EnzoVezzaro/agents-code-context --skill acc

# To a specific agent
npx skills add EnzoVezzaro/agents-code-context --skill acc --agent claude
```

## Capability Manifest

Run `acc tools` from the repository to read the authoritative capability manifest — tiers, commands, flags, capabilities.

## Commands

| Command | Category | What it answers | Reference |
|---|---|---|---|
| `tools` | Discover | The full capability manifest (tiers, commands, flags) | reference/tools.md |
| `context <path>` | Discover | What owns this scope, what governs it, what it depends on | reference/context.md |
| `graph [path]` | Discover | The repository's architecture graph (text/mermaid/dot/json) | reference/graph.md |
| `slice <path>` | Discover | A compact AI-optimized graph slice (context router) | reference/slice.md |
| `dependencies <path>` | Discover | What a path depends on (declared/discovered/transitive) | reference/relations.md |
| `dependents <path>` | Discover | What depends on a path (reverse edges) | reference/relations.md |
| `impact <path>` | Discover | What breaks if you change a path (closure, tests, contracts) | reference/impact.md |
| `search <query>` | Discover | Architecture-aware search across contracts, edges, code | reference/search.md |
| `inspect <path>` | Discover | Roles, owners, dependencies, constraints, memory for a path | reference/inspect.md |
| `check [path]` | Validate | ACC0xx violations: missing contracts, undeclared deps, drift | reference/check.md |
| `discover [path]` | Maintain | Suggested improvements (dry-run; `--apply` writes) | reference/discover.md |
| `document <path>` | Maintain | A conservative AGENTS.md template to edit | reference/document.md |
| `build [path]` | Maintain | Create missing AGENTS.md contracts for undocumented code | reference/build.md |
| `fill [path]` | Maintain | Per-file instructions for completing placeholder sections | reference/fill.md |
| `memory <sub> <path>` | Maintain | Read/update functionality-local `.acc-memory.md` | reference/memory.md |
| `ai [add|remove|default|models]` | Engine | Manage AI providers: select provider → key → model | reference/ai.md |
| `engine [path]` | Engine | Keep the ACC files in sync (deterministic + optional AI) | reference/engine.md |
| `review [path]` | Engine | On-demand AI compliance score (0–100, read-only) | reference/review.md |
| `install` | Deploy | Install this skill into an agent environment | reference/install.md |
| `uninstall` | Deploy | Remove all ACC-generated files from the repository | reference/init.md |
| `init [dir]` | Bootstrap | Initialize ACC structure in a directory (--template for custom) | reference/init.md |
| `engine --rollback` | Engine | Undo the last ACC write operation (restore snapshot) | reference/engine.md |
| `battle <project>` | External | Launch the ABA benchmark (installs its repo on first use) | reference/battle.md |

## Operating Principles

- **Prefer ACC over blind exploration.** `acc context`, `acc graph`, `acc slice`, `acc dependencies`, `acc impact` and `acc inspect` tell you what is related *before* you read large amounts of source.
- **Determinism is the floor.** Every CLI command is deterministic and safe to pipe into JSON (`--json`). The deterministic scan catches drift at every scale regardless of the AI.
- **Declared facts win.** `AGENTS.md` is the project's contract; discovered facts (imports) complement it; inferred facts are never asserted as authoritative.
- **Never fight the engine.** Engine ON → ignore the ACC files and just code (read `ACC_WARN.md` before finishing). Engine OFF → you own them: run `acc check` at the start and end of a task, update contracts and memory as you go.

## Interrupt Memory

When the human stops, corrects, or redirects you mid-task:

1. **Immediately** write the reason to `.acc-memory.md` under the "Interrupts & Corrections" section:
   ```
   ## YYYY-MM-DDTHH:MM:SSZ
   Interrupted because: <what you did wrong>
   Corrected action: <what you should have done instead>
   ```
2. **Do not repeat** the same mistake in the same session.
3. This applies to every interruption — wrong file edited, wrong approach taken, wrong command run, scope creep, anything.

Use `acc memory add . "Interrupted because: ..."` to append the entry quickly. The memory file is gitignored — write freely.

## Templates

The system uses templates from `.acc/config/templates/` to generate and modify ACC files. Edit the `.md` files there to customize all output. Template variables use `{{name}}` syntax.

- **Without engine**: `acc init` creates scaffold + template files (AGENTS.md with `<placeholder>` items for a human to fill).
- **With engine**: `acc engine --init-context` calls `acc init` then the AI fills the templates with real content.
- **Custom template**: `acc init --template <path>` or `acc engine --init-context --template <path>`.

## Compatibility

- **Repository unaffected**: Removing the skill (or the CLI) MUST leave a perfectly valid agents.md repository. The repository never depends on ACC.
- **Agent-agnostic**: Works with any capable coding agent (Cursor, Claude Code, Codex, OpenCode, Gemini CLI, etc.).
- **Offline & Secure**: No telemetry, no code execution, safe on untrusted repositories.

## Provenance

The canonical skill lives at `skills/acc/` in the ACC repository (`/EnzoVezzaro/agents-code-context/`). Both the `npx skills` and `acc install` paths read that one file.

## References

The `reference/` directory holds a playbook per command — exact flags, workflow steps, example output, and edge cases — plus the engine limits (measured) and the over-feeding analysis. Read the reference for the command you are about to run when you need its exact behavior.

See [README.md](README.md) for the skill itself.