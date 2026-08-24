---
title: Adding Git Providers
description: How repository hosting providers are detected and how to add a new one.
---

# Adding a Git Provider

## How Detection Works

All git host detection is centralized in `src/utils/git.ts` in a single exported function:

```ts
export async function detectGitInfo(cwd: string, _preferredProvider: string): Promise<GitInfo>
```

It returns the `GitInfo` contract every consumer depends on:

```ts
export interface GitInfo {
  provider: string;              // 'github' | 'gitlab' | …
  owner: string;
  repo: string;
  providerRepositoryId: string;  // 'github:owner/repo'
}
```

The algorithm:

1. Run `git config --get remote.origin.url` in `cwd` via `execSync`; an empty string on failure.
2. Match the remote against known hosts with `/github\.com[:/]([^/]+)\/([^/.]+)/` (handles both SSH `git@github.com:owner/repo.git` and HTTPS forms). The trailing `.git` suffix is stripped from the repo name.
3. Repeat the equivalent match for `gitlab.com`.
4. If nothing matches, fall back to directory-name heuristics (see below).

## GitHub Detection Specifics

GitHub is selected when the raw remote URL contains `github.com`. The regex captures:

- `owner` — everything after `github.com:` or `github.com/` up to the next slash
- `repo` — up to the first `.`, so both `repo.git` and `repo` normalize correctly

The resulting id is `'github:' + owner + '/' + repo`.

## Fallback Behavior

When no remote exists or no host matches, `detectGitInfo` does **not** fail. It assumes GitHub as the display default and derives the repo name from the directory basename:

```ts
provider: 'github',
owner: 'unknown',
repo: dirName,
providerRepositoryId: 'github:unknown/' + dirName,
```

Consumers therefore never receive `undefined` fields — but they can receive `owner: 'unknown'`, and validation layers must treat that as unverified.

## Current Callers

| Call site | Notes |
|-----------|-------|
| `src/commands/init.ts` | Passes `'github'` as preferred provider |
| `src/app/listing-service.ts` | Same |
| `src/app/build-service.ts` | Same |
| `src/index.ts` | Re-exported in the public API |

Note: `_preferredProvider` is currently unused (underscore-prefixed parameter) — every call site passes the literal `'github'`. Provider selection today is purely remote-URL-driven.

## What a New Provider Must Implement

A new host (e.g. `codeberg`) requires changes **only inside `src/utils/git.ts`**, plus wiring at the edges that act on the provider name:

1. Add a detection branch in `detectGitInfo`: check the raw URL for the host, apply the same `host[:/]owner/repo` regex shape, strip `.git`, and return the full `GitInfo` with your provider name and `'<provider>:<owner>/<repo>'` id.
2. Keep the `GitInfo` interface unchanged — it is the contract. Do not add per-provider fields; encode differences inside `providerRepositoryId`.
3. Update the fallback path if the new host should ever be assumed, or leave the generic fallback alone.
4. Audit consumers that branch on `gitInfo.provider` for display or API calls (workflow generation in `src/workflows/ci.ts` currently emits GitHub Actions syntax and Pages deployment — that logic stays isolated there and must be extended separately if your provider needs CI support).

## Isolation Rules

- Host-specific parsing lives only in `src/utils/git.ts`. Commands and app services consume `GitInfo`; they must not re-parse remotes or hardcode hostnames.
- Generated CI artifacts are the exception layer: anything provider-specific about *deployment* belongs in `src/workflows/ci.ts`, not in detection.
- Never widen `detectGitInfo`'s signature ad hoc; if you need configuration, use the existing (currently ignored) `_preferredProvider` slot deliberately or add a documented options object.

## Test Requirements

There are no unit tests for `src/utils/git.ts` yet (`git.test.ts` does not exist). When adding a provider:

1. Add `src/utils/git.test.ts`. Because detection shells out to `git config`, test against a temporary fixture directory with a real `remote.origin.url` set (`git init` + `git remote add origin …`), covering SSH and HTTPS URL shapes.
2. Assert all four `GitInfo` fields, including `.git` stripping and the `provider:owner/repo` id format.
3. Add negative cases: no remote → fallback shape, unknown host → fallback shape.

Follow the conventions in [/development/testing](/development/testing) and run `npm run lint && npm run test` before opening a PR.
