---
title: Adding Commands
description: Step-by-step guide to adding a new command to the reposell CLI.
---

# Adding a Command

This walks through the real pattern used by `init`, `license`, `release`, and friends. Read [/development/commands](/development/commands) first for the underlying conventions.

## 1. Create the command module

Add `src/commands/<name>.ts`. Follow the `release.ts` shape:

```ts
/**
 * `reposell <name> …` — one line stating what it does and why.
 */

export interface FooArgs {
  target: string;
  // optional flags, populated from bin-level parseArgs
}

export class FooCommandError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'FooCommandError';
    this.code = code;
  }
}

export async function fooCommand(cwd: string, args: FooArgs): Promise<string> {
  // orchestration only — no business logic here
}
```

Rules:

- First parameter is always `cwd: string`.
- Throw a typed error with a `code` for usage failures (`ReleaseCommandError('TAG_REQUIRED', …)` is the model).
- Either return a report `string`, or return `{ ok, report }` so the bin can set the exit code without exceptions.
- If the command needs flags beyond the generic parser, put them in a separate pure module `src/commands/foo-args.ts` exporting `parseFooArgs(argv)` + an args error class — mirror `license-args.ts`.

## 2. Wire it to an application service

Business logic belongs in `src/app/` (e.g. `config-service.ts`, `build-service.ts`, `license-service.ts`). The command:

1. Validates/parses input (or prompts interactively via `readline/promises` when `input.isTTY === true`).
2. Calls app services with injected dependencies: `{ env: process.env }`, never a bare ambient read inside the service.
3. Formats the result into report lines using the `✓` / `•` / `✗` markers.

If the logic already exists in a service, do not duplicate it. If not, add a focused function to the relevant service rather than growing the command file.

## 3. Register in the bin

Three edits in `src/bin/reposell.ts`:

```ts
// import
import { fooCommand } from '../commands/foo.js';

// USAGE array — one line describing syntax
'  foo <target>               One-line description',

// switch case in main()
case 'foo': {
  const result = await fooCommand(cwd, { env: process.env });
  console.log(result.report);
  if (!result.ok) process.exitCode = 1;
  break;
}
```

Pick the return convention deliberately:

| Convention | Used by | Bin handling |
|------------|---------|--------------|
| Return `Promise<string>` | `license`, `listing`, `release` | `console.log(await …)` |
| Return `{ ok, report }` | `validate`, `build`, `health`, `publish`, `verify`, `keys` | log report, set `process.exitCode = 1` on failure |

Unknown commands fall into the existing `default` case; you do not need extra handling.

## 4. Add tests

Colocate `src/commands/<name>.test.ts` (or `<name>-args.test.ts` for the parser). Cover at minimum:

- Happy-path parsing of positionals/flags → expected args object.
- Rejection cases throwing your typed error (`expect(() => parseFooArgs(['x', '--wat'])).toThrow(/unknown flag/)`).
- Any pure mapping functions (e.g. `definitionFromValues` in `release.ts`) including defaults.

No network, no module mocks — inject fakes. See [/development/testing](/development/testing).

## 5. Update documentation

1. Create `docs/commands/<name>.md` following the style of `docs/commands/init.md` or `docs/commands/release.md`: usage block, options table, examples, exit behavior.
2. Add the command to the reference table in `docs/commands/index.md`.
3. Register the page in the sidebar under `docs/.vitepress/config.ts`.

## 6. Verify

From `reposell/`:

```bash
npm run typecheck
npm run lint
npm run test
npm run build && node dist/bin/reposell.js help   # USAGE shows the new command
```

All four must pass. CI runs the same checks per workspace — see [/development/testing-ci](/development/testing-ci).

## Checklist

- [ ] `src/commands/foo.ts` created, typed error class with `code`
- [ ] Optional `foo-args.ts` pure parser
- [ ] Logic delegated to `src/app/` services
- [ ] Import + `USAGE` line + `switch` case in `src/bin/reposell.ts`
- [ ] Colocated tests for parser and pure mappers
- [ ] `docs/commands/foo.md`, reference table, sidebar entry
- [ ] `typecheck`, `lint`, `test`, `build` all green
