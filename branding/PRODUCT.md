# Product

## Register

brand

## Platform

web

## Users

**Primary**: Independent developers and small teams building CLI tools, GitHub Actions, npm packages, and repository utilities who want to monetize their work without giving up ownership.

**Secondary**: Engineering leads at companies adopting inner-source or open-source monetization strategies; listing operators running public instances.

**Context**: Developers in their terminal/editor, evaluating tools, reading docs, configuring CI/CD. They value technical depth, zero-config defaults, and cryptographic guarantees over marketing fluff.

## Product Purpose

reposell is the protocol and toolchain for turning any Git repository into a sellable product. It provides:
- Zero-config repository initialization (`reposell init`)
- Cryptographic `/sell` and `/listing` endpoints
- Stripe Embedded Checkout (no server needed)
- Automatic release detection and listing sync via GitHub Actions
- Ed25519 identity with key rotation via signed trust documents
- Fair, transparent revenue splits defined by signed pricing policies

Success = developers earning meaningful revenue from tools they already maintain, with <5 min setup and zero ongoing infrastructure.

## Positioning

**The only repository-to-repository listing protocol where the developer owns the relationship, the keys, and the revenue logic—no platform intermediary takes a cut or controls the catalog.**

## Conversion & proof

- **Primary CTA**: `reposell init` — zero-config, runs in any repo, produces working `/sell` endpoint immediately
- **Secondary CTA**: Read the Protocol Specification — for developers who need to understand the cryptography before committing
- **10-second line**: "Your repo, your keys, your revenue. `reposell init` and you're live."
- **Belief ladder**:
  1. Developers deserve to earn from tools they build for open source
  2. Platform fees and lock-in are the problem, not the solution
  3. Cryptographic protocols can replace trusted intermediaries
  4. reposell's zero-config approach makes this accessible, not academic
  5. The protocol is live, the CLI works, and the listing is growing
- **Proof on hand**: 
  - Working CLI with Stripe Connect integration
  - GitHub Actions workflows for automated release→listing sync
  - Public listing instance at listing.reposell.dev
  - Cryptographic verification reference implementation

## Brand Personality

**Technical, sovereign, precise, quietly confident.**

- **Voice**: Developer-to-developer. No marketing speak. Specs over slogans.
- **Tone**: Direct, specific, assumes competence. "Here's the protocol" not "Revolutionize your workflow."
- **Emotional goals**: Trust (cryptographic guarantees), Agency (zero lock-in), Respect (for developer time and intelligence)

## Anti-references

- **Stripe/Linear/Vercel minimalism** — cold, corporate, "designy" without substance
- **Editorial-magazine aesthetics** (Klim-influenced: italic display serif + mono labels + ruled grids) — saturated, inauthentic for a protocol
- **Gradient-text hero metrics** — SaaS cliché, signals "marketing not engineering"
- **Identical card grids** with icon+heading+text — template tell
- **Monospace as "technical" costume** — only when the brand is genuinely terminal-native
- **Warm cream/beige backgrounds** — 2026 AI default, reads as undifferentiated
- **Tiny uppercase tracked eyebrows** above every section — AI scaffolding grammar
- **Glassmorphism/blur cards** as default — decorative, not functional

## Design Principles

1. **Protocol-first visual language** — The design should feel like a spec document that happens to be beautiful. Technical diagrams, code blocks, and cryptographic notation are first-class citizens.
2. **Sovereign color strategy** — Not "brand purple." A color that means something: the orange of a Stripe webhook event, the green of a verified signature, the blue-black of a terminal at 2am.
3. **Variable type with purpose** — Each font family earns its place: a technical display face for protocol notation, a readable UI sans for docs, a monospace for keys/hashes, an expressive headline for the one thing that matters.
4. **Content density with rhythm** — Developers scan, they don't read. Information architecture > visual decoration. Generous but intentional whitespace.
5. **Motion as state communication** — Transitions show causality (click → verified, hover → preview), not delight. Respect `prefers-reduced-motion` as a first-class constraint.
6. **Dark mode as native, not inverse** — The terminal is dark. Dark mode gets the same design attention as light; it's not a color-scheme flip.

## Accessibility & Inclusion

- WCAG AA minimum (4.5:1 body, 3:1 large)
- `prefers-reduced-motion` honored everywhere (instant transitions as alternative)
- Color-blind safe palette (no red/green status dependency)
- Semantic HTML, focus-visible rings, ARIA where needed
- Keyboard navigation for all interactive elements