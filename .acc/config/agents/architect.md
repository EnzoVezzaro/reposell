# architect — agent profile (pointer)

Source of truth: `.opencode/agents/architect.md`.

The architect is an OpenCode subagent (read-only, ACC-grounded). Its prompt, permissions, and
model behavior are defined **only** in `.opencode/agents/architect.md` — do not duplicate them
here.

Model: `opencode/glm-5.3` — the single subagent on the stronger model tier, because it is the
one that reasons about layer boundaries and declared invariants rather than reporting surface
findings. It runs `acc graph` / `acc impact` / `acc context` / `acc check` and never edits files.

Agent registration and delegation rules live in `opencode.json` and
`.opencode/agents/orchestrator.md`; the full topology is
`.acc/config/multi-agent/config.yaml`.
