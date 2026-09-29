# testing.md — Run the test suite

Procedure for verifying a change. Expectations and rules live in
`.acc/config/standards/testing.md`; this file only lists steps.

1. `npm test` — full Vitest suite (co-located `src/**/*.test.ts`).
   Targeted run: `npm test -- <path>`.
2. `npm run typecheck` — strict TypeScript, zero errors.
3. `npm run lint` — Oxlint + anti-slop. Fix true positives; `SAFETY:` comments justify
   deliberate assertions.
4. `acc check` — architecture contracts, no drift.
5. **UI surfaces** (docs/landing changes only): start `npm run docs:dev`, load the
   `ego-browser` skill (ego lite) and walk the checklist in
   `.acc/config/standards/testing.md` (desktop, mobile, keyboard, loading/empty/error,
   reduced-motion).
6. Update `.acc-memory.md` with anything learned.

Failures are fixed before review, never narrated around. The orchestrator runs this workflow in
the Verify phase of the lifecycle (see `DEVELOPMENT.md`).
