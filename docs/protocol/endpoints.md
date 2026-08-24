---
title: Endpoint architecture
---

# Endpoint Architecture

Every RepoSell-enabled repository exposes its protocol under one reserved namespace:

```text
/reposell/
```

## Generated structure

```text
/reposell/
│
├── index.json                 # Protocol discovery (start here)
├── manifest.json              # Canonical repository manifest
├── health.json                # Current health state
│
├── sell/
│   └── index.html             # Direct seller interface
│
├── listing/
│   └── index.html             # Optional listing UI
│
└── releases/
    ├── index.json             # Release catalog
    │
    ├── v1.0.0/
    │   ├── manifest.json      # Immutable per-release config
    │   └── health.json        # Per-release health
    │
    └── v1.1.0/
        ├── manifest.json
        └── health.json
```

Each release carries its own immutable commercial configuration — see [Release model](./release-model).

## `/reposell/index.json`

The simplest possible machine discovery document:

```json
{
  "protocol": "reposell",
  "version": "1",
  "manifest": "/reposell/manifest.json",
  "health": "/reposell/health.json",
  "sell": "/reposell/sell/",
  "listing": "/reposell/listing/",
  "releases": "/reposell/releases/index.json"
}
```

A listing does not need to know the repository's internal architecture. It only needs:

```text
GitHub Repository
       ↓
GitHub Pages
       ↓
/reposell/index.json
       ↓
/reposell/manifest.json
```

This also allows the repository owner to change their application without breaking RepoSell.

## Namespace isolation

CI owns exactly one path — `/reposell/**` — and must never overwrite arbitrary repository files:

```text
Developer files                    RepoSell generated files
      │                                  │
      ├── src/                           └── reposell/
      ├── docs/
      ├── README.md
      └── package.json
```

This separation is what makes the integration safe to adopt in any project: RepoSell can regenerate everything under its namespace on every deploy without touching yours.

## Private repositories

The public protocol never depends on reading a private repository directly. The discovery surface is GitHub Pages. A repository can remain private while its generated `/reposell/*` pages are public, subject to hosting configuration. Private source code is never exposed by the RepoSell manifest.
