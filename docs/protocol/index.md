---
title: Protocol Specification
---

# Protocol Specification

## Overview

RepoSell allows a software repository to become a purchasable software product without requiring the repository owner to operate a backend, database, API, or dedicated infrastructure.

The repository owner installs and configures RepoSell once. From then on:

```text
GitHub Repository
      +
GitHub Releases
      +
GitHub Actions
      +
GitHub Pages
      +
Stripe Payment Links
```

GitHub ships first, but the protocol is provider-agnostic: repositories and CI/CD sit behind the `GitProvider` / workflow abstractions (GitLab, Bitbucket, Gitea and others are on the roadmap). The wire contract under `/reposell/*` is identical regardless of provider.

The entire public RepoSell protocol is exposed through one reserved namespace:

```text
/reposell/*
```

Example:

```text
https://owner.github.io/my-project/reposell/
```

The repository remains completely independent from RepoSell infrastructure.

## Core principle

RepoSell must require as little developer work as possible:

```bash
npm install -g @reposell/cli
reposell init
git push
```

After configuration, publishing is fully automated:

```text
Developer
    │
    ▼
GitHub Release
    │
    ▼
GitHub Actions
    ├── validate
    ├── generate manifest
    ├── validate payment
    ├── generate pages
    └── deploy GitHub Pages
```

There are no servers to run. No RepoSell API dependency. No Docker container. If RepoSell infrastructure disappeared tomorrow, every enabled repository would keep selling.

## Canonical protocol surface

```text
/reposell/
│
├── index.json                 # Protocol discovery
├── manifest.json              # Repository manifest
├── health.json                # Current health
│
├── sell/
│   └── index.html             # Direct sales UI
│
├── listing/
│   └── index.html             # Optional listing UI
│
└── releases/
    └── index.json             # Release catalog
```

This namespace is reserved for RepoSell-generated content. CI owns `/reposell/**` and nothing else — developer files are never overwritten.

## Pages in this section

| Page | Answers |
| --- | --- |
| [Endpoint architecture](./endpoints) | What lives under `/reposell/*` and why |
| [Manifest schema](./manifest-schema) | The canonical machine-readable documents |
| [/sell endpoint](./sell-endpoint) | Direct sales, Payment Links, price authority |
| [Listing endpoint](./listing-endpoint) | Optional listing integration + economics |
| [Release model](./release-model) | Publication gates, state machine, health |
| [Signatures](./signatures) | Ed25519 signing, verification keys, trust |

## Protocol version

Current version: **1.0**

Every generated document declares its schema explicitly:

```json
{
  "schema": "reposell/manifest/v1",
  "protocol": { "version": "1.0" }
}
```

Schemas are stable across the lifetime of a repository. Breaking changes require a new schema version, never a silent mutation.
