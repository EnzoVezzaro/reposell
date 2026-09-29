# Multi-Agent Topology

The real multi-agent setup lives in **OpenCode**, not in this directory. This directory records
where everything is; it deliberately contains **no duplicate agent configuration**.

## Topology — 1 orchestrator + 3 subagents

The authoritative record — agent, mode, model, scope, and the delegation rules — is
`config.yaml` in this directory. Do not restate it in prose here; read the file.

| Agent | Mode | Prompt & permissions | Model |
|-------|------|---------------------|-------|
| `orchestrator` | primary | `.opencode/agents/orchestrator.md` | `opencode/big-pickle` |
| `architect` | subagent | `.opencode/agents/architect.md` | `opencode/glm-5.3` |
| `product-reviewer` | subagent | `.opencode/agents/product-reviewer.md` | `opencode/glm-5.3-flash` |
| `ui-reviewer` | subagent | `.opencode/agents/ui-reviewer.md` | `opencode/glm-5.3-flash` |

- **Registration, delegation gate, models, permissions**: `opencode.json` + the agent files —
  nothing else.
- **Delegation**: OpenCode's native Task tool, gated to the three subagents
  (`permission.task` in the orchestrator agent file). Subagents may not delegate further.
- **Runtime**: OpenCode. No second agent runtime, no external workspace manager.
- **Lifecycle**: the orchestrator follows the ACC development lifecycle documented in
  `DEVELOPMENT.md`; workflows in this `.acc/config/workflows/` tree feed it.

## ACC note

ACC's own multi-agent orchestration (`acc agents`, pipeline mode) is **reserved, not implemented
in ACC V1**. Orchestration therefore lives in OpenCode's native mechanisms; ACC stays the
context/convention layer (`acc context`, `acc graph`, `acc impact`, `acc check`). The
`multi_agent` section of `.acc/config/config.yaml` stays `enabled: false` to match — that flag
governs ACC's own swarm, which this project does not use.
