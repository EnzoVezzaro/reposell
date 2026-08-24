---
title: The Listing Network
---

# The Reposell Listing Network

Community Listings are **nodes in a federated discovery network** — never sellers. The official listing stays the trust and settlement layer; community listings compete and cooperate to discover the best software.

```text
                         ┌──────────────────────┐
                         │   OFFICIAL REPOSELL  │
                         │       LISTING        │
                         │ Canonical registry   │
                         │ Verification         │
                         │ Payments             │
                         │ Attribution          │
                         └──────────┬───────────┘
                                    │ federation / discovery
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
       Community Listing A   Community Listing B   Community Listing C
              └──────────────┬──────┴─────────────────────┘
                             ▼
                         DISCOVERY
                             ▼
                          BUYER
                             ▼
                    Official Reposell
                             ▼
                       Seller /sell
```

## 🏆 Listing reputation

Every authorized community listing gets a public profile:

```text
┌──────────────────────────────────────┐
│ 🟣 Indie Dev Directory               │
│                                      │
│ Level 12                             │
│ ⭐ 4,820 Reputation                  │
│                                      │
│ 1,284 products discovered            │
│ 8,421 clicks                         │
│ 312 purchases attributed             │
│ 98.7% uptime                         │
│                                      │
│ 🏆 Trusted Directory                 │
└──────────────────────────────────────┘
```

Reputation is based on **useful behavior**, not raw traffic.

## ⚡ XP system

| Behavior | Reward |
| --- | --- |
| Product discovered | +5 XP |
| Valid product verified | +10 XP |
| Successful referral | +50 XP |
| New seller discovered | +25 XP |
| High-quality metadata | +10 XP |
| Maintained uptime | +XP/day |
| Accurate health reporting | +XP |
| Long-term federation | +XP |

**Do not reward spam**: submitting thousands of products must not automatically generate thousands of points. Volume without quality earns nothing.

## 🏅 Levels unlock capabilities, not money

```text
Level 1   🌱 New Listing      → Basic federation
Level 5   🔎 Explorer
Level 10  🛠 Curator           → Custom categories · featured directory profile
Level 20  🚀 Pioneer           → Advanced discovery API · analytics
Level 30  🌟 Trusted           → Verified Curator badge · featured collections
Level 50  🏆 Elite             → Priority federation sync · advanced reputation data
Level 100 👑 Legendary
```

Higher levels unlock **network capabilities** — never financial advantages over sellers.

## 🔥 Streaks

Maintenance streaks encourage actually running the listing: 🔥 7 / 30 / 100 / 365 days, based on uptime, valid manifests, successful synchronization, healthy federation and accurate metadata.

## 🧭 Discovery quests

The official listing issues challenges; community listings build collections around them:

```text
"Find 10 Rust projects"                      0 / 10  ████░░░░░░
"Discover 5 projects with no previous Listing" 3 / 5  ██████░░░░
🎯 Emerging Explorer — Reward: +500 XP
```

## 🧩 Collections

Curation becomes a major discovery mechanism:

```text
🔥 Best Rust Tools        🤖 AI Developer Tools
🎨 Creative Coding        🦀 Rust + WASM
🌐 Open Source Infrastructure   💻 Indie Hacker Tools
```

::: warning Superseded: checkout-fee splits
The $5-checkout-fee / 50-50 split described here is superseded by the [contribution model](./contributions): sellers keep 100% of their `/sell` price and declare a voluntary Listing contribution instead. Community referral economics will be defined against contributions — this section remains for historical context until that spec lands.
:::

## 💰 Referral rewards

Community listings do not sell anything. Attribution flows through the official listing:

```text
Community Listing
        │ discovery
        ▼
Official Reposell Listing
        │ referral attribution
        ▼
      /sell  →  Stripe
```

The community listing earns its share **because it generated the referral**, not because it sold the software.

## 🪙 Reputation vs money — kept separate

```text
              COMMUNITY LISTING
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       REPUTATION            REVENUE
     XP · levels · badges    referral share
     trust · rankings         settlement balance
```

Separating them prevents anyone from simply buying reputation.

## 🛡️ Anti-gaming

Detection targets:

```text
❌ self-referrals          ❌ duplicate products
❌ fake clicks             ❌ fake purchases
❌ automated traffic       ❌ referral loops
❌ mass registration       ❌ artificially generated listings
❌ health-check manipulation
```

Reputation decays when a listing is abandoned:

```text
Healthy → Inactive → Stale → Suspended
```

## 🏆 Global leaderboards

Public rankings across the network:

- **Top listings** by XP
- **Most discoveries**
- **Most successful referrals**
- **Best maintained** (uptime)

## Design principle

> **Gamification rewards being a good curator, not being a good spammer.**

Build the best directory, discover great software, curate it, keep it healthy, help developers find useful open-source products. That makes Reposell something more interesting than a normal directory: **a federated, gamified discovery network where the official listing acts as the trust and settlement layer.**
