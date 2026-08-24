# Introduction

## What is reposell?

reposell is a **repository-to-repository software listing protocol and tooling ecosystem**.

A developer owns a Git repository. That repository can expose:

- `/sell` — Product sales endpoint (owner-owned, always optional)
- `/listing` — Listing integration (optional, reposell optional)

The repository remains the source of truth for its product. The listing is **optional**.

## Core Concept

The core concept is extremely simple:

1. **You own the repository** — reposell does NOT own it
2. **You host the repository** — reposell does NOT require hosting
3. **You control `/sell`** — reposell does NOT proxy it
4. **Listing is optional** — Sell independently or via listing

## Product Ecosystem

| Product | Description |
|---------|-------------|
| **reposell CLI** | Core developer tool (this repo) |
| **reposell Listing** | Official listing service |
| **reposell Public Listing** | Community-operated listing |

## Protocol Version

Current: **1.0**

All manifests and API responses include:
```json
{
  "protocol": "reposell",
  "version": "1.0"
}
```

## Architecture Principles

1. **Zero-Config** — Derive everything from Git/GitHub/CI
2. **Payment Abstraction** — PaymentProvider interface, Stripe implemented
3. **Git Abstraction** — GitProvider interface, GitHub implemented
4. **Cryptographic Identity** — Ed25519 keys, signed manifests
4. **Protocol Versioning** — All public interfaces versioned
5. **Pure Static + CI** — No servers, no databases, no Docker