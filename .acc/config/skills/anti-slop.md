# anti-slop — skill reference (pointer)

Source of truth: `.agents/skills/install-anti-slop/SKILL.md` (canonical skill directory —
`.claude/skills/` holds symlinks only).

What it is: opinionated Oxlint rules rejecting low-evidence TypeScript/JavaScript patterns,
vendored to `tools/oxlint/anti-slop/` and configured in `oxlint.config.ts`. Read the skill for
installation and rule details — do not duplicate them here.

ACC integration: `npm run lint` runs alongside `acc check` in the testing workflow
(`.acc/config/workflows/testing.md`); violations surface as Oxlint diagnostics, not ACC codes.
