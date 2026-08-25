# Design

> **System:** motion.dev-derived "lab" design (user-named reference: [motion.dev](https://motion.dev)).
> Light = warm paper `#f4f3eb` + ink `#191b16`; primary CTA = electric green `#0af188` with ink text;
> links/brand = blackcurrant purple; lab accents cycle across feature cards (green/blueberry/dragonfruit/rind/blackcurrant).
> Dark mode = sci-fi ink `#13151a` with aurora glow.
> **Animations:** hero clip-path wipe-in (`hero-wipe`), staggered rises, aurora drift, scroll-driven
> feature reveals (`animation-timeline: view()`), marquee ticker, waveform pulse. All disabled under
> `prefers-reduced-motion`. Fonts: Syne / Oxanium / Outfit / Geist Mono.

## Color Strategy

Warm, tactile palette inspired by soundcn.xyz. Signal green for primary actions, stone neutrals for depth.

### Light Mode

```css
:root {
  --background: #ffffff;
  --foreground: #0c0a09;
  --card: #ffffff;
  --card-foreground: #0c0a09;
  --primary: #0af188;        /* signal green */
  --primary-foreground: #fff7ed;
  --accent: #f5f5f4;         /* warm stone */
  --muted: #f5f5f4;
  --muted-foreground: #79716b;
  --border: #e7e5e4;
  --radius: 0.625rem;
}
```

### Dark Mode

```css
.dark {
  --background: #0c0a09;     /* warm near-black */
  --foreground: #fafaf9;
  --card: #1c1917;          /* warm stone */
  --card-foreground: #fafaf9;
  --primary: #9f2d00;       /* darker green */
  --primary-foreground: #fff7ed;
  --accent: #292524;
  --muted: #292524;
  --muted-foreground: #a6a09b;
  --border: rgba(255,255,255,0.1);
}
```

## Typography

**soundcn.xyz stack** — adopted verbatim as a user-named reference (per impeccable brand.md: identity-preservation wins when the brand has committed to a lane).

| Role | Font | Why |
|------|------|-----|
| Body / UI | **Outfit** | soundcn's body sans — geometric warmth |
| Headings | **Oxanium** | Technical display without magazine vibes |
| Hero name | **Syne** | Playful display weight for the hero only |
| Logo | **Oxanium** (700) | Matches heading voice |
| Mono / Keys | **Geist Mono** | Genuine terminal-native, for Ed25519 keys |

Loaded once via Google Fonts `@import` in `branding/theme/styles/variables.css`.

## Implementation

These docs sites use **VitePress DefaultTheme re-skinned via CSS variables** (the shadcn approach: tokens re-skin primitives). No Tailwind exists here.

- `branding/theme/styles/variables.css` — soundcn palette mapped onto `--vp-c-brand-*`, `--vp-button-brand-*`, `--vp-c-bg/text/*`, code + custom-block tokens
- `branding/theme/styles/custom.css` — Outfit body, Oxanium headings, Syne hero name, `.VPFeature` card hovers, waveform keyframes, `.rs-term` terminal block
- Landing pages = native `layout: home` frontmatter (hero + features), zero custom hero components

## Components

### shadcn/ui base

All components use shadcn primitives with soundcn warmth:

- **Button**: Primary = green `#0af188`, rounded-md, hover `bg-primary/90`
- **Card**: `bg-card border border-border rounded-xl shadow-sm`
- **Badge**: Color-coded by variant (signal/verified/pending)
- **Alert**: For verification status

### Custom reposell components

**Waveform Logo Mark**: Animated SVG bars (like soundcn sound waves) — 5 bars pulse in sequence, pauses on `prefers-reduced-motion`

**Verification Badge**: Shows signature status with color coding
- Verified: green
- Pending: amber
- Invalid: red

**Code Block**: Geist Mono, `bg-card border border-border rounded-xl p-4`, copy button top-right

**Signal Button**: Primary green gradient with subtle shadow

## Motion

- **Causality over delight**: Verify success pulses, copy complete flash, not random animations
- **Ease**: `cubic-bezier(0.16, 1, 0.3, 1)` outbound
- **Reduced motion**: Instant state swaps
- **Waveform**: 1.2s ease-in-out infinite, offset delays per bar

### Landing choreography (anime.js v4)

All landing animations run through `docs/.vitepress/theme/landingMotion.js`
(`animejs` v4: `animate`, `createTimeline`, `createDrawable`, `stagger`). CSS
handles only hover micro-interactions; entrances/reveals are JS-driven:

| Piece | Technique |
| --- | --- |
| Nav logo "RE" monogram | `createDrawable` line-draw on 7 stroke paths (`.rs-logo-draw`), staggered `draw: '0 1'` |
| Hero intro | `createTimeline`: title clip-wipe + rise → sub → actions → copy chip → trust badges stagger → value props stagger |
| Section reveals | IntersectionObserver gate + anime.js tween (`opacity`, `translateY`), per-group stagger capped at 320 ms |
| Ticker marquee | anime.js linear infinite loop (`x: 0 → -50%`), pauses on pointer enter |
| Footer wordmark "reposell" | SVG `<text>` stroke self-writes via `strokeDashoffset` draw when scrolled into view |

**No-flash contract**: a pre-paint inline script in `.vitepress/config.ts`
head adds `rs-home dark lx-boot` to `<html>` for the home path;
`html.rs-home.lx-boot …` rules hide hero pieces until the timeline's first
frame. Boot class is cleared by timeline completion, a 3.2 s failsafe timer,
and on `prefers-reduced-motion: reduce` (which skips all JS motion entirely —
content is statically visible).

## Sound

Web Audio synthesis (~1KB) like soundcn:
- `verify-success`: sine 880→1320Hz fifth
- `verify-fail`: low sine 220Hz
- `deploy`: 660→880Hz
- `copy`: square 1200Hz (40ms)
- Global toggle in footer

## Visual Identity

**Cool and fun like soundcn but protocol-focused:**
- Signal green for live webhooks, verified deployments
- Stone neutrals for cards, borders, backgrounds
- Fira Display for headlines — technical, not editorial
- Generous whitespace, airy hero, card grids
- No editorial magazine aesthetics, no gradient text, no glassmorphism defaults

**Impeccable compliance:**
- Fonts deliberate, not reflex
- Color carries voice
- Motion intentional
- No AI slop patterns

## VitePress Integration

Use branding theme with shadcn-style tokens. Landing page uses frontmatter:

```yaml
---
layout: home
title: reposell
tagline: Your repo, your keys, your revenue.
features:
  - title: Zero-Config Init
    description: Run `reposell init` — auto-detects Git provider
    variant: signal
  - title: Cryptographic Verification
    description: Ed25519 signatures on every manifest
    variant: verified
  - title: Fair Revenue Splits
    description: Signed pricing policies, no hidden fees
    variant: pending
---
```

All three docs sites share branding/tokens, each with product-specific content.