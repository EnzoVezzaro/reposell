---
title: Command Internals
description: How a reposell CLI command is structured, from argv to output.
---

# How a Command Is Structured

## Entry Point

The binary entry is `src/bin/reposell.ts` (compiled to `dist/bin/reposell.js`, declared under `bin` in `package.json`). It has no command framework — registration is a `switch` on the first positional:

```ts
const [command, ...rest] = process.argv.slice(2);
const { positionals, flags } = parseArgs(rest);

switch (command) {
  case 'init': { ... }
  case 'release': { ... }
  default: {
    console.error(`unknown command: ${String(command)}`);
    process.exitCode = 1;
  }
}
```

The `USAGE` string constant at the top of the file is the help text. New commands must be added in three places: an import, a `USAGE` line, and a `case`.

## Arg Parsing Pattern

A minimal hand-rolled parser (`parseArgs` in the bin) splits tokens into positionals and flags:

- `--flag value` → `flags['flag'] = value`
- bare `--flag` → `flags['flag'] = 'true'`
- everything else → `positionals[]`

Commands with their own subcommands and flags own a dedicated parser module — e.g. `src/commands/license-args.ts` exports `parseLicenseArgs(argv)` plus a typed error:

```ts
export class LicenseArgsError extends Error {}

export function parseLicenseArgs(argv: string[]): LicenseCommandArgs {
  // validates actions ('check' | 'use' | 'keep'), flags (--holder, --force, …)
  // throws LicenseArgsError with a usage message on anything unknown
}
```

Parsers are pure functions from `string[]` to args objects. That makes them unit-testable without touching the filesystem — see [/development/testing](/development/testing).

## Command Module Anatomy

Command modules live in `src/commands/`. The recurring shape (see `init.ts`, `release.ts`, `validate.ts`):

```ts
export interface ReleaseArgs { tag: string; price?: number; /* … */ }

export class ReleaseCommandError extends Error {
  readonly code: string;   // machine-readable, e.g. 'TAG_REQUIRED'
  constructor(code: string, message: string) { /* … */ }
}

export async function releaseCommand(cwd: string, args: ReleaseArgs): Promise<string> {
  // orchestration only — delegates real work to app services
}
```

Two return conventions exist:

1. **Return a report string** (`license`, `listing`, `release`) — the bin does `console.log(await command(...))`.
2. **Return a result object + separate formatter** (`init` returns `InitResult`, formatted by `formatInitResult`; `validate`, `build`, `health` return `{ ok, report }`).

The second form lets the bin set `process.exitCode = 1` when `result.ok === false` without exceptions.

## Calling Application Services

Commands are thin adapters. Business logic lives in application services under `src/app/`:

| Command | Service calls |
|---------|---------------|
| `init` | `LicenseService.check()`, `generateWorkflows()`, `createIdentity()`, `detectGitInfo()` |
| `release` | `configExists()`, `writeConfig()`, `updateReleaseDefinition()`, `evaluateRepository()` |
| `build` / `validate` / `health` | `evaluateRepository()` via their respective services |

Rules of thumb:

- Commands accept `cwd: string` as the first argument; they never assume the process working directory.
- Environment access is injected as `{ env: process.env }`, not read ad hoc — this keeps services testable.
- Interactive fallbacks use `readline/promises` and only prompt when `input.isTTY === true` (see `promptForMissing` in `release.ts`). Flags always win over prompts.

## Output Conventions

Reports are plain strings built from lines and joined with `\n`. Markers:

| Marker | Meaning |
|--------|---------|
| `✓` | Step succeeded |
| `•` | No-op / already in desired state |
| `✗` | Failure |

`release.ts` also ends reports with a next-step hint (`Next: reposell publish <tag>` inside backticks once the gates pass). Keep output deterministic where possible — same repository state should produce the same text.

## Error Handling

Errors are typed classes with a `readonly code`, thrown from domain/app/command layers (`ReleaseCommandError`, `StripeKeyMissingError`, `ConfigInvalidError`, `PaymentLinkInvalidError`). The bin has exactly one `try/catch` around the dispatch:

```ts
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
```

So inside a command you either throw a typed error (message becomes the user-facing line) or return a result with `ok: false`. Usage errors print usage text and set exit code 1 rather than throwing. Exit code semantics are documented in [/commands/](/commands/).

## Walkthrough: `reposell release`

1. Bin extracts `tag` from positionals, maps `--price/--currency/--link/--link-id` flags into a `ReleaseArgs` object, throws `ReleaseCommandError('TAG_REQUIRED', …)` if the tag is missing.
2. `releaseCommand` fills missing values interactively (TTY only).
3. It ensures `reposell.yml` exists via `config-service`, then persists a draft `ReleaseDefinition`.
4. It re-runs `evaluateRepository` to print which publication gates still fail.
5. The returned string is logged by the bin.

Use this flow as the template for new commands — see [/development/adding-commands](/development/adding-commands).
