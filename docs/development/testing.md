---
title: Testing
description: Testing approach, conventions, and coverage for the reposell CLI.
---

# Testing

## Framework

Tests use [Vitest](https://vitest.dev) (`vitest` ^1.0.0 in `reposell/package.json`). Test files are colocated with the code they cover and named `*.test.ts`:

```text
src/
├── commands/license-args.test.ts
├── cli/banner.test.ts
├── domain/license/templates.test.ts
├── domain/license/detect.test.ts
├── domain/payment/stripe.test.ts
├── app/listing-service.test.ts
├── app/license-service.test.ts
└── utils/env.test.ts
```

They are excluded from the `tsc` emit (`tsconfig.json` → `"exclude": ["**/*.test.ts"]`) but still must typecheck.

## Running Tests

```bash
# all workspaces, from monorepo root
npm run test

# just the CLI, from reposell/
npm run test          # vitest run (single pass)
npm run test:watch    # vitest (watch mode)
```

There is no separate CI script — CI runs `npm run test --workspaces`. See [/development/testing-ci](/development/testing-ci) for end-to-end CI flow testing.

## What Is Covered

| Area | Example file | What is asserted |
|------|--------------|------------------|
| Domain pure functions | `domain/license/templates.test.ts` | Determinism (byte-identical output), placeholder substitution, exact structure (22 sections, trailing newline) |
| Arg parsing | `commands/license-args.test.ts` | Valid flag combos, rejection of unknown actions/flags via typed errors |
| Rendering | `cli/banner.test.ts` | Content invariants of rendered output |
| Key/env handling + HTTP mapping | `domain/payment/stripe.test.ts` | Missing/invalid key errors, bearer token sent, response mapping, error translation |
| Application services | `app/listing-service.test.ts`, `app/license-service.test.ts` | Service behavior against injected inputs |

The common thread: tests exercise **pure functions and injected-I/O boundaries**, never live network or real Stripe.

## Conventions

### 1. No module mocking

The oxlint config sets `anti-slop/no-module-mocking: "error"`. Do not use `vi.mock`. Instead, inject fakes through constructor parameters. The HTTP boundary is a `FetchLike` function:

```ts
// stripe.test.ts — fake fetch that captures requests, no network
function fakeFetch(body, ok = true, status = 200) {
  const fetchFn = async (url, init) => {
    captured = { url, auth: init.headers['Authorization'] ?? '' };
    return { ok, status, json: async () => body };
  };
  return { fetchFn, get captured() { return captured; } };
}

const provider = new StripePaymentProvider('sk_test_abc123', fake.fetchFn);
expect(fake.captured.url).toBe('https://api.stripe.com/v1/account');
```

If you need to make something testable, widen an injection point (`fetchImpl`, `env` object, `cwd`), not the module system.

### 2. Determinism is part of the contract

Generated artifacts (licenses, policies, manifests) must be byte-identical for identical input. Tests assert this directly:

```ts
it('is deterministic — same input, byte-identical output', () => {
  expect(renderRslLicense(input)).toBe(renderRslLicense({ ...input }));
});
```

### 3. Assert on typed errors, not message fragments alone

Errors carry a machine-readable identity. Prefer:

```ts
expect(() => parseLicenseArgs(['fly'])).toThrow(LicenseArgsError);
expect(() => StripePaymentProvider.fromEnv({})).toThrow(StripeKeyMissingError);
```

Regex on messages is fine as a supplement (`toThrow(/unknown flag/)`).

### 4. Cover the rejection paths

Every parser and validator gets a negative case: unknown flags, missing values, malformed URLs, invalid key prefixes. See `license-args.test.ts` and the key-handling block in `stripe.test.ts`.

## Adding Tests for New Code

1. Place the test next to the source: `src/<layer>/<module>.test.ts`.
2. Import from the relative module with `.js` extension (`from './templates.js'`) — matching the ESM source style.
3. Group with `describe` per exported unit; one `it` per behavior.
4. Keep tests synchronous where possible; async only when the unit is async.
5. Run `npm run test` and `npm run lint` — the anti-slop rules apply to test files too.

For what to do after the tests pass, see [/development/adding-commands](/development/adding-commands).
