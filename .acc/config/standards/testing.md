# testing.md — Testing Standard

How this repository tests and what a test is expected to prove. Runner configuration is owned by
`package.json` (scripts) and Vitest; the **procedure** for running these checks lives in
`.acc/config/workflows/testing.md`. This file states expectations.

## Test layout

Co-located, named after the module under test, next to it:

```
src/domain/payment/stripe.ts
src/domain/payment/stripe.test.ts
```

There is no `tests/` directory. `tsconfig.json` excludes `**/*.test.ts` from the build, so tests
never reach `dist/` or the published package.

## What each layer owes

| Layer | What is tested | How |
|-------|----------------|-----|
| `domain` | pure logic: licensing composition, SPDX parsing, release state machine, reciprocity arithmetic, protocol builders, canonical JSON | real inputs, no I/O; a builder gets its data as arguments |
| `app` | service orchestration: config resolution, publication gates, signing, release evaluation, listing status | real domain objects + injected seams, or a hand-written fake port |
| `commands` | argument parsing, output shape, exit behaviour, the `switch` branch taken | invoke the exported command function with a `cwd` and args |
| `bin` | the command registry — every command name resolves to a case | registration assertions, not process spawning |
| `config` | validation: accepted shapes, rejected shapes, and the issue messages | table-driven over raw `unknown` |
| `workflows` | generated YAML/artifacts: structure, namespace, and byte-stability | assert the generated text |

A test that only re-asserts the implementation's own steps has no value. Test the contract, not
the trace.

## Seams, not mocks

`anti-slop/no-module-mocking` is an **error**: no `vi.mock`, no `jest.mock`, no stubbing an
import. A test that needs to control the outside world gets a real injection point instead.

- **Network** — pass a `fetch` function. `StripePaymentProvider` takes one; assert against the
  fake. See `src/domain/payment/stripe.test.ts`.
- **Environment** — pass an env record, do not mutate `process.env`.
- **Clock, randomness, filesystem** — pass values in; if a module reads them directly, that
  module needs a seam added before the test is written.
- **Filesystem** — a temporary directory created per test, or a byte-level assertion on a
  generator that returns a string.

When a test genuinely cannot avoid a module boundary, the finding is that the seam is missing.
Add the parameter; do not mock.

## Determinism

Same input → same output is a project invariant, and tests are where it is enforced:

- Fixed values for everything nondeterministic. No snapshot of a value containing a timestamp,
  a path outside the fixture, or a random id.
- A generator's test asserts byte-stability: build twice, compare. See
  `src/workflows/sell.test.ts`.
- Tests are order-independent. No shared mutable fixture, no reliance on a previous test's write.
- A test that fails intermittently is a bug in the code, not a flaky test to be retried.

## Assertions and types

- `SAFETY:` comments are required on type assertions in tests exactly as in production code
  (`standards/coding.md`).
- Prefer asserting on the observable contract — returned value, thrown error `code`, generated
  text — over on internal call sequences.
- Negative cases are mandatory for anything that gates a decision: blocked pricing, changed
  seller link, bad signature, missing key, malformed config. Positive-only coverage of a
  fail-closed rule proves nothing.
- **Money is in minor units** (integer cents). Any test asserting an amount asserts the unit, so
  a float bug cannot pass as 50 → $0.50.

## Commands

- `npm test` — full suite. Targeted: `npm test -- src/domain/payment/stripe.test.ts`.
- `npm run typecheck` — `tsc --noEmit`; note that `tsconfig.json` excludes `**/*.test.ts`, so
  **typecheck does not cover test files**. A test file that does not compile is caught by
  Vitest's transform, not by `tsc`. This is a known blind spot, not something to paper over.
- `npm run lint` — Oxlint with the anti-slop plugin; `oxlint.config.ts` ignores
  `tools/oxlint/anti-slop/**` and `branding/canvasui/**` (vendored/generated).
- `acc check` — architecture contracts and drift; see `standards/architecture.md`.

All four are part of testing, not a separate gate. **A failing check is fixed before review; it
is never narrated around or skipped with a "pre-existing" excuse without a linked issue.**

## UI surfaces — ego lite

The docs site and the landing/theme components are verified with **ego lite** — load the
`ego-browser` skill rather than reading its API here; the skill is a machine-level install and
the skill file is the source of truth.

Run against the live surface (`npm run docs:dev`) for each UI change:

- desktop and mobile layout
- keyboard navigation and visible focus
- loading, empty, and error states — not only the happy path
- reduced-motion behaviour
- visual hierarchy and contrast regressions against the theme being changed

Design-quality review is delegated to the `ui-reviewer` subagent (`.opencode/agents/`); ego lite
is for hands-on exploration and reproduction. The two are complementary, not alternatives.

## Browser automation

Not adopted. There is no Playwright or E2E dependency, and adding one is a deliberate decision
with a cost, not a default. If deterministic browser verification becomes necessary it lands in
an opt-in boundary (`tests/e2e/`) that no other command depends on.

## Related

- `standards/coding.md` — the `SAFETY:` rule and anti-slop severities
- `standards/architecture.md` — which layer a test belongs to
- `workflows/testing.md` — the procedure
- `standards/review.md` — what reviewers check about test coverage
