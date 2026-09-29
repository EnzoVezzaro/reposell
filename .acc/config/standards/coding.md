# coding.md — Coding Standard

Language, module, and lint conventions. Runner configuration lives in `package.json`,
`tsconfig.json`, and `oxlint.config.ts`; this file states the rules those tools cannot state.

## TypeScript

- **Target ES2022, modules `NodeNext`, `strict: true`.** The three extra flags are not optional
  and are the reason much of the code looks the way it does:
  - `noUncheckedIndexedAccess` — indexing an array or record yields `T | undefined`. Narrow or
    handle; do not suppress.
  - `noPropertyAccessFromIndexSignature` — a `Record<string, unknown>` field is read with
    `raw['version']`, never `raw.version`. This is why config parsing is written the way it is.
  - `noImplicitOverride` — `override` is mandatory on a method that overrides a base.
- **ESM only.** `"type": "module"`. Every relative import carries its `.js` extension
  (`'../config/index.js'`) even though the source is `.ts`. Extensionless imports do not resolve
  under NodeNext.
- **No default exports.** Named exports only, so `src/index.ts` can re-export explicitly and the
  SDK surface stays greppable.
- **Exhaustive switches** over union states (`ReleaseState`, `HealthState`) get a
  `never`-based default; a new member must not compile silently.

## Types and the unknown boundary

- External input is `unknown` until validated. The narrowing happens **at the I/O edge** — inside
  a validator or adapter — and the narrowed type flows inward from there.
- Every type assertion carries a `SAFETY:` comment on the line above stating why the compiler
  cannot know better. This is `anti-slop/require-safety-comment-for-type-assertion`, an **error**,
  and it applies in tests too. `src/config/index.ts` is the reference example.
- `as unknown as T` is a sanctioned last resort for genuinely untyped transit (`JSON.parse`); it
  is a warning, and it still needs a `SAFETY:` comment.

## Anti-slop rules

`tools/oxlint/anti-slop` is a vendored Oxlint plugin; `oxlint.config.ts` is its configuration.
**Error level — a violation blocks the change:**

| Rule | Why |
|------|-----|
| `require-safety-comment-for-type-assertion` | no unjustified casts |
| `no-widen-then-assert` | never widen to escape a type error |
| `no-unknown-type-aliases` | `type X = unknown` is not a type |
| `no-module-mocking` | tests use real seams, not patched modules |
| `no-object-parameters` | positional parameters; no bag-of-options argument |
| `no-reflect-get` / `no-reflect-apply` | no dynamic property access as a shortcut |
| `no-shape-in-symbol-names` | names describe meaning, not structure |

**Warning level — flagged, fix when the change already touches the line:**

`no-chained-type-assertions`, `no-known-value-widening`, `no-runtime-typeof`,
`no-unsafe-dictionary-type`, `no-conditional-empty-object-spread`, `no-unknown-parameters`,
`no-unknown-returns`.

The downgrades are deliberate and documented inline in `oxlint.config.ts`: this codebase's
boundary validators legitimately narrow `Record<string, unknown>` field-by-field with `typeof`,
and serializers legitimately build objects with conditional spreads. Do not "fix" a warning by
changing the rule level without saying why in `oxlint.config.ts`.

Two real constraints behind those downgrades: **never loosen a rule to make your own change
pass**, and **never suppress with a blanket `oxlint-disable`** — a `SAFETY:` comment is the
sanctioned escape because it survives the next reader.

## Determinism

Non-negotiable, because the CLI signs and publishes what it emits:

- No `Math.random`, no `Date.now`, no `process.hrtime` in anything that reaches an output file.
  Time and randomness enter as parameters.
- `canonicalJSON` (`src/utils/crypto.ts`) is the only serializer for a signed or published
  document. `JSON.stringify` on a protocol document is a bug, because key order becomes part of
  the signature.
- Two runs on the same input produce byte-identical output. If a diff appears, the generator is
  non-deterministic; do not "normalise" it in a test.

## Errors

- Domain and application failures are named error classes with a stable `code` field
  (`StripeKeyInvalidError` → `STRIPE_KEY_INVALID`) and a message that tells the user what to do
  next. See `src/domain/payment/stripe.ts`.
- Fail closed on anything a signature, a price, or a config decision depends on. A validation
  that cannot prove a document is well-formed reports blocked; it does not assume a default.
- Never swallow an error. If it is genuinely ignorable, say why in a comment.
- No secret value ever reaches an error message, a log line, or a thrown string. When an error
  needs to reference a credential, it reports the **shape** (a prefix), never the value.

## Comments and docs

- A file-level comment states what the file owns and which spec section it implements; the
  existing `src/domain/protocol/documents.ts` header is the model.
- Comments explain *why*; the code says *what*. A comment restating the next line is noise.
- JSDoc on exported types, error codes, and non-obvious parameters. Not on self-evident getters.

## Formatting

No formatter is configured — there is no Prettier in this repository. Match the surrounding file:
two-space indent, single quotes, semicolons, trailing commas in multiline literals. `oxlint` is
the only automated style gate, and it does not enforce layout. Consistency with the file you are
in beats consistency with an imagined config.

## Not permitted

- `any`. Use `unknown` and narrow, or a precise type.
- `Reflect`, `eval`, `Function`, dynamic `require` in ESM.
- A new runtime dependency without a human decision — the dependency surface is
  `@noble/ed25519`, `@reposell/sell`, and `yaml`, and it is meant to stay small.
- Generated or vendored code edited in place. `tools/oxlint/anti-slop/**`,
  `branding/canvasui/**`, and `docs/.vitepress/dist|cache/**` are inputs, not ours.

## Related

- `standards/architecture.md` — where a file goes
- `standards/testing.md` — the rules tests follow
- `standards/tooling.md` — the commands these rules are checked by
- `oxlint.config.ts` — the authoritative rule severities
