# testing.md — Testing Standard

How this repository tests. Commands and runner configuration are owned by `package.json`
(scripts) and Vitest — this file states expectations, not copies of tool config.

## Test layout

- Co-located unit tests: `src/**/*.test.ts` (Vitest, run with `npm test`).
- Test what each clean-architecture layer promises:
  - **Domain** — pure logic: licensing composition, protocol schemas, reciprocity, link
    validation, state machines. Deterministic; no I/O.
  - **Application** — services and command flows with real domain objects and faked ports
    (no module mocking — anti-slop `no-module-mocking`; use dependency seams).
  - **Infrastructure** — adapters against fixtures (Stripe payloads, GitHub responses).
  - **CLI** — command registration, argument handling, output contracts.

## Determinism

- Same input → same output is a project invariant. No randomness, clocks, or network in tests
  without explicit fixed values/seeding.
- No module mocks; introduce a real seam instead.
- Type assertions in tests follow the same `SAFETY:` comment rule as production code.

## Static checks (part of testing, not separate)

- `npm run typecheck` — TypeScript strict, zero errors.
- `npm run lint` — Oxlint + anti-slop plugin (see `.acc/config/skills/anti-slop.md`).
- `acc check` — architecture contracts and drift.

## UI testing — ego lite

UI surfaces (docs site, landing/theme components) are verified with **ego lite** (the
`ego-browser` skill — see `.agents/skills/` conventions; the skill is a machine-level install,
its API lives in the skill itself — load it, do not copy it).

Cover per UI change, on the running surface (`npm run docs:dev`):

- desktop and mobile layout
- keyboard navigation and visible focus
- loading, empty, and error states
- reduced-motion behavior
- visual hierarchy/contrast regressions

Design-quality review is delegated to the `ui-reviewer` subagent (defined in
`.opencode/agents/`, see `.acc/config/multi-agent/README.md`); ego lite is for hands-on
exploration and reproduction.

## Browser automation / E2E

Not adopted. No Playwright/E2E dependency exists today; if deterministic browser verification is
ever needed it becomes an opt-in boundary (`tests/e2e/`), never a default dependency.

## Related

- Procedure: `.acc/config/workflows/testing.md`
- Commands: `package.json` → `scripts`
- Agentic workflow and verification phase: `DEVELOPMENT.md`
