---
title: Git Abstraction
description: How reposell derives owner, repo, and provider from your Git remote with zero configuration — and how additional providers slot in.
---

# Git Abstraction

The zero-config principle applies to repository identity: you never type your owner, repo name, provider, or URL. Everything derivable from Git is read from Git ([Zero-Config Principle](/guide/zero-config)).

## Derivation (`utils/git.ts`)

`detectGitInfo(cwd)` runs one command:

```bash
git config --get remote.origin.url
```

and parses the result against known hosts:

| Remote form | Result |
|-------------|--------|
| `git@github.com:owner/repo.git` | `github` · `owner` · `repo` |
| `https://github.com/owner/repo.git` | `github` · `owner` · `repo` |
| `git@gitlab.com:owner/repo.git` | `gitlab` · `owner` · `repo` |
| anything else / no remote | fallback (below) |

The `.git` suffix is stripped, and the identity is assembled into a single string used across manifests:

```text
providerRepositoryId = "github:owner/repo"
```

### Fallback behavior

If the remote is missing or unrecognized, detection degrades instead of failing:

```text
provider = "github"
owner    = "unknown"
repo     = <directory name>
```

Commands keep working against this placeholder so you can inspect output locally; a real remote is expected for anything you publish.

## Where the derived identity is used

Every consumer goes through the same helper — there is no second place where owner/repo logic lives:

- **`reposell init`** — prints `✓ Detected github repository: owner/repo` and names the product after the repo
- **Build pipeline** (`app/build-service.ts`) — computes `repositorySlug`, writes it into `manifest.json`, `health.json`, `listing.json`, and every per-release manifest; the repo URL is reconstructed as `https://github.com/<slug>`
- **Listing dashboards** — display the same slug

Because manifests embed the derived identity, renaming a GitHub repository changes what the next build emits — signatures cover the new value, nothing is hand-edited.

## CI follows the provider too

Provider-specific automation is generated, never hardcoded in core logic. Today that means one artifact:

```
.github/workflows/reposell.yml
```

— a GitHub Actions workflow (push / release published / manual dispatch) that validates, builds, signs, and deploys `/reposell/*` to GitHub Pages. Core modules do not import Actions specifics; workflow generation is isolated in `src/workflows/ci.ts`.

## Current status, stated plainly

- **Detection**: GitHub and GitLab remotes are both recognized today.
- **Automation**: GitHub only. The generated workflow targets GitHub Actions + Pages, and manifest URLs assume the `https://github.com/<owner>/<repo>` shape.

## Adding a provider

The design keeps everything provider-specific behind small surfaces, so support grows by addition:

1. **Remote parsing** — a new host branch in `detectGitInfo` returning `{ provider, owner, repo, providerRepositoryId }`. The id prefix scheme (`github:`, `gitlab:`) already anticipates more providers.
2. **URL construction** — teach the build service each provider's canonical repository/release URL shapes.
3. **CI generation** — a per-platform generator alongside `src/workflows/ci.ts` producing the platform's native pipeline (GitLab CI, Gitea Actions, ...). Selection can key off the detected provider, keeping setup zero-config.
4. **Release events** — map the provider's release/tag webhook or API onto the same validate → build → publish pipeline.

Core commands, domain logic, and the protocol documents stay untouched through all four steps — they already speak in terms of `{ provider, owner, repo }` records rather than GitHub URLs.

## Related pages

- [Initialize Repository](/guide/init) — what init derives on first run
- [Clean Architecture](/guide/architecture) — where each layer lives
- [Configuration Schema](/configuration/schema) — overriding what was derived
