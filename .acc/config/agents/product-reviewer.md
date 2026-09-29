# product-reviewer — agent profile (pointer)

Source of truth: `.opencode/agents/product-reviewer.md`.

The product reviewer is an independent, read-only OpenCode subagent. It reviews work it did not
write, focused on product reasoning, UX decisions, user flows, edge cases, and unnecessary
complexity. It reports findings ordered by severity (BLOCK / WARN / NIT) and never edits files —
the orchestrator applies the findings or explains why not.

Model: `opencode/glm-5.3-flash` — a bounded read-only report does not need the orchestrator's
model tier. Its prompt and permissions are defined **only** in
`.opencode/agents/product-reviewer.md`.

Top-level routing, including the fact that the orchestrator is the only agent allowed to delegate
to it, lives in `opencode.json` and `.opencode/agents/orchestrator.md`; see
`.acc/config/multi-agent/config.yaml` for the topology.
