# ui-reviewer — agent profile (pointer)

Source of truth: `.opencode/agents/ui-reviewer.md`.

The UI reviewer is an independent, read-only OpenCode subagent. It reviews interface quality
across this repository's UI surfaces (the docs site, landing pages, and theme components) —
visual hierarchy, interaction, responsive behavior, accessibility, loading/error/empty states,
and polish. It reports findings ordered by severity (BLOCK / WARN / NIT) and never edits files.

Model: `opencode/glm-5.3-flash` — same read-only report tier as the product reviewer. Its prompt
and permissions are defined **only** in `.opencode/agents/ui-reviewer.md`.

Hands-on browser verification is a separate concern: the agent uses **ego lite** via the
`ego-browser` skill rather than guessing at rendered output (see
`.acc/config/standards/testing.md` for what that covers).
