# orchestrator — agent profile (pointer)

Source of truth: `.opencode/agents/orchestrator.md`.

The orchestrator is the primary OpenCode agent and the default one
(`default_agent` in `opencode.json`). It owns the ACC development lifecycle end-to-end and
delegates focused review to the `architect`, `product-reviewer`, and `ui-reviewer` subagents.

Model: `opencode/big-pickle` — the strongest model in the ladder, because the orchestrator holds
the whole repository in context and owns the decisions. Prompt, permissions, and the
`permission.task` delegation gate are defined **only** in
`.opencode/agents/orchestrator.md` — do not duplicate them here.

The machine-readable topology (agents, models, delegation rules) is
`.acc/config/multi-agent/config.yaml`; the human-readable overview is
`.acc/config/multi-agent/README.md`.
