# anti-slop Skill (dmmulroy/anti-slop)

Opinionated Oxlint rules for rejecting low-evidence TypeScript and JavaScript patterns.

## Installation

```bash
# Already installed via the skill system
npx skills add dmmulroy/anti-slop --skill install-anti-slop --yes
```

## What It Does

Copies the anti-slop Oxlint plugin to `tools/oxlint/anti-slop/` and configures Oxlint with all 14 generic rules enabled at `error` level.

## Rules Enforced (All at `error`)

| Rule | Description |
|------|-------------|
| `no-chained-type-assertions` | Rejects nested type assertions that fabricate evidence |
| `no-conditional-empty-object-spread` | Rejects conditional spreads using `{}` to omit fields |
| `no-known-value-widening` | Rejects explicit broad target types that discard known value evidence |
| `no-module-mocking` | Rejects Vitest/Jest module mocks in favor of real dependency seams |
| `no-object-parameters` | Rejects the broad `object` type on function inputs |
| `no-reflect-apply` | Rejects `Reflect.apply` in favor of typed function calls |
| `no-reflect-get` | Rejects `Reflect.get` in favor of typed property access or boundary parsing |
| `no-runtime-typeof` | Requires boundary parsing instead of ad hoc `typeof` narrowing |
| `no-shape-in-symbol-names` | Rejects `shape` in symbol names |
| `no-unknown-parameters` | Rejects `unknown` inputs except explicit `cause` convention |
| `no-unknown-returns` | Rejects function contracts that return `unknown` or `Promise<unknown>` |
| `no-unknown-type-aliases` | Rejects aliases that merely conceal `unknown` |
| `no-unsafe-dictionary-type` | Rejects dictionary value contracts based on `unknown`, `any`, `object`, `{}` |
| `no-widen-then-assert` | Rejects local flows that widen known values and later assert them back |
| `require-safety-comment-for-type-assertion` | Requires each non-const assertion to document its checked invariant |

## Effect Rules (Optional)

When the `effect` package is a direct dependency, also enables:

| Rule | Description |
|------|-------------|
| `no-service-constructor-imports` | Rejects relative imports of exported `make<CapabilityName>` constructors outside test files |

## Configuration

The plugin is configured in `oxlint.config.ts`:

```typescript
import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: [
    ".agent/**",
    ".agents/**",
    "tools/oxlint/anti-slop/**",
    // ...
  ],
  jsPlugins: [
    { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
  ],
  rules: {
    "anti-slop/no-chained-type-assertions": "error",
    // ... all 14 generic rules at "error"
  },
});
```

## Usage

```bash
# Run linting
npx oxlint

# Fix auto-fixable issues
npx oxlint --fix
```

## Provenance

- Source: `dmmulroy/anti-slop` (MIT License)
- Plugin vendored to: `tools/oxlint/anti-slop/`
- Skill installed to: `.agents/skills/install-anti-slop/`
- ACC config reference: `.acc/config/skills/anti-slop.md`

## Integration with ACC

- Anti-slop rules are part of the validation pipeline
- Run `npx oxlint` alongside `acc check` in CI
- Violations surface as Oxlint diagnostics (not ACC diagnostic codes)
- No AGENTS.md changes needed - it's a tooling/linting concern