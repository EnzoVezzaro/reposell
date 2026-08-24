# Design

## Color

### Strategy: Committed — one saturated color carries 30-40% of surface

The brand color is **Signal Orange** (`oklch(0.62 0.22 45)`) — the color of a live Stripe webhook, a verified deploy, a successful cryptographic operation. It appears on primary actions, verified badges, live status indicators, and the waveform logo mark.

Not purple. Not blue. Orange = "this is live, this is real, money moves here."

### Palette (OKLCH)

```css
:root {
  /* Signal Orange — primary brand */
  --color-signal: oklch(0.62 0.22 45);
  --color-signal-hover: oklch(0.57 0.24 45);
  --color-signal-active: oklch(0.52 0.25 45);
  --color-signal-muted: oklch(0.62 0.22 45 / 0.12);
  --color-signal-fg: oklch(0.98 0 0);

  /* Verified Green — cryptographic success */
  --color-verified: oklch(0.52 0.18 142);
  --color-verified-hover: oklch(0.47 0.20 142);
  --color-verified-muted: oklch(0.52 0.18 142 / 0.12);
  --color-verified-fg: oklch(0.98 0 0);

  /* Warning Amber — pending/unsigned */
  --color-pending: oklch(0.75 0.16 85);
  --color-pending-hover: oklch(0.70 0.18 85);
  --color-pending-muted: oklch(0.75 0.16 85 / 0.15);
  --color-pending-fg: oklch(0.15 0 0);

  /* Error Red — failed/invalid */
  --color-invalid: oklch(0.55 0.22 25);
  --color-invalid-hover: oklch(0.50 0.24 25);
  --color-invalid-muted: oklch(0.55 0.22 25 / 0.12);
  --color-invalid-fg: oklch(0.98 0 0);

  /* Neutrals — tinted toward signal hue (not warm by default) */
  --color-n-0: oklch(1 0 0);
  --color-n-50: oklch(0.985 0.003 45);
  --color-n-100: oklch(0.97 0.005 45);
  --color-n-200: oklch(0.93 0.008 45);
  --color-n-300: oklch(0.87 0.012 45);
  --color-n-400: oklch(0.72 0.015 45);
  --color-n-500: oklch(0.58 0.018 45);
  --color-n-600: oklch(0.45 0.020 45);
  --color-n-700: oklch(0.35 0.022 45);
  --color-n-800: oklch(0.25 0.024 45);
  --color-n-900: oklch(0.18 0.025 45);
  --color-n-950: oklch(0.12 0.025 45);

  /* Light surfaces */
  --color-bg: var(--color-n-0);
  --color-bg-soft: var(--color-n-50);
  --color-bg-alt: var(--color-n-100);
  --color-bg-elv: var(--color-n-0);
  --color-surface: var(--color-n-0);
  --color-surface-elevated: var(--color-n-50);
  --color-surface-sunken: var(--color-n-100);
  --color-border: var(--color-n-200);
  --color-border-strong: var(--color-n-300);
  --color-border-subtle: var(--color-n-200 / 0.4);

  /* Text */
  --color-fg: var(--color-n-950);
  --color-fg-muted: var(--color-n-500);
  --color-fg-subtle: var(--color-n-400);

  /* Focus */
  --color-focus: var(--color-signal);
  --color-focus-ring: var(--color-signal / 0.35);
}

.dark {
  /* Dark surfaces — deep blue-black, not gray */
  --color-bg: oklch(0.09 0.02 260);
  --color-bg-soft: oklch(0.11 0.02 260);
  --color-bg-alt: oklch(0.13 0.02 260);
  --color-bg-elv: oklch(0.15 0.02 260);
  --color-surface: oklch(0.11 0.02 260);
  --color-surface-elevated: oklch(0.13 0.02 260);
  --color-surface-sunken: oklch(0.09 0.02 260);
  --color-border: oklch(0.22 0.02 260);
  --color-border-strong: oklch(0.28 0.02 260);
  --color-border-subtle: oklch(0.22 0.02 260 / 0.4);

  /* Text */
  --color-fg: oklch(0.96 0.005 260);
  --color-fg-muted: oklch(0.65 0.01 260);
  --color-fg-subtle: oklch(0.52 0.01 260);

  /* Signal adjusts for dark */
  --color-signal: oklch(0.68 0.20 45);
  --color-signal-hover: oklch(0.73 0.18 45);
  --color-signal-active: oklch(0.63 0.22 45);
  --color-signal-muted: oklch(0.68 0.20 45 / 0.15);
  --color-signal-fg: oklch(0.09 0.02 260);

  --color-verified: oklch(0.60 0.16 142);
  --color-verified-hover: oklch(0.65 0.14 142);
  --color-verified-muted: oklch(0.60 0.16 142 / 0.15);
  --color-verified-fg: oklch(0.09 0.02 260);

  --color-pending: oklch(0.78 0.14 85);
  --color-pending-hover: oklch(0.83 0.12 85);
  --color-pending-muted: oklch(0.78 0.14 85 / 0.15);
  --color-pending-fg: oklch(0.09 0.02 260);

  --color-invalid: oklch(0.62 0.20 25);
  --color-invalid-hover: oklch(0.67 0.18 25);
  --color-invalid-muted: oklch(0.62 0.20 25 / 0.15);
  --color-invalid-fg: oklch(0.96 0.005 260);

  --color-focus: var(--color-signal);
  --color-focus-ring: var(--color-signal / 0.4);
}
```

### Semantic aliases (for components)

```css
:root {
  --color-primary: var(--color-signal);
  --color-primary-hover: var(--color-signal-hover);
  --color-primary-active: var(--color-signal-active);
  --color-primary-muted: var(--color-signal-muted);
  --color-primary-fg: var(--color-signal-fg);

  --color-success: var(--color-verified);
  --color-success-hover: var(--color-verified-hover);
  --color-success-muted: var(--color-verified-muted);
  --color-success-fg: var(--color-verified-fg);

  --color-warning: var(--color-pending);
  --color-warning-hover: var(--color-pending-hover);
  --color-warning-muted: var(--color-pending-muted);
  --color-warning-fg: var(--color-pending-fg);

  --color-danger: var(--color-invalid);
  --color-danger-hover: var(--color-invalid-hover);
  --color-danger-muted: var(--color-invalid-muted);
  --color-danger-fg: var(--color-invalid-fg);
}
```

## Typography

### Font Selection (5 families, each with purpose)

| Role | Family | Source | Why |
|------|--------|--------|-----|
| **Display / Protocol** | **Syne** | Google Fonts | Technical but expressive; distinctive numerals for version numbers, key hashes, prices |
| **UI Sans** | **Geist** | Vercel / Google Fonts | Clean, readable, variable; designed for developer interfaces |
| **Mono / Keys** | **Geist Mono** | Vercel / Google Fonts | Perfect for Ed25519 keys, hashes, CLI output, code |
| **Data / Numbers** | **Tabular-nums Geist** | Geist variant | Lining tabular figures for prices, splits, timestamps |
| **Expressive** | **Space Grotesk** | Google Fonts | *Only for the logo wordmark* — geometric, distinctive, not Outfit/Inter default |

**Reflex check**: Syne and Space Grotesk are on the reflex-reject list. They are used here *deliberately*: Syne for protocol notation (technical expressiveness), Space Grotesk *only* for the logo (geometric distinctiveness). Geist/Geist Mono are not on the list.

### Scale (modular, 1.25 ratio, fluid clamp)

```css
:root {
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-display: "Syne", ui-sans-serif, system-ui, sans-serif;
  --font-logo: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-data: "Geist", ui-sans-serif, system-ui, sans-serif; /* with font-variant-numeric: tabular-nums */

  --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --text-sm: clamp(0.8125rem, 0.75rem + 0.3vw, 0.875rem);
  --text-base: clamp(0.9375rem, 0.875rem + 0.3vw, 1rem);
  --text-lg: clamp(1.0625rem, 1rem + 0.3vw, 1.125rem);
  --text-xl: clamp(1.25rem, 1.125rem + 0.6vw, 1.375rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.2vw, 1.75rem);
  --text-3xl: clamp(1.875rem, 1.5rem + 1.8vw, 2.25rem);
  --text-4xl: clamp(2.25rem, 1.75rem + 2.4vw, 3rem);
  --text-5xl: clamp(3rem, 2.25rem + 3.6vw, 4rem);
  --text-6xl: clamp(3.75rem, 2.75rem + 4.8vw, 5.5rem);
  --text-7xl: clamp(4.5rem, 3.25rem + 6vw, 7rem);

  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-normal: 1.55;
  --leading-relaxed: 1.7;

  --tracking-tight: -0.03em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.05em;
}
```

### Usage

| Element | Font | Size | Weight | Leading | Tracking |
|---------|------|------|--------|---------|----------|
| Logo wordmark | Space Grotesk | --text-xl | 700 | --leading-tight | -0.02em |
| Hero headline | Syne | --text-5xl to --text-7xl | 700 | --leading-tight | -0.03em |
| Section heading | Syne | --text-3xl | 600 | --leading-snug | -0.02em |
| Subsection heading | Geist | --text-xl | 600 | --leading-snug | -0.01em |
| Body | Geist | --text-base | 400 | --leading-normal | --tracking-normal |
| Body strong | Geist | --text-base | 500 | --leading-normal | --tracking-normal |
| Small/muted | Geist | --text-sm | 400 | --leading-normal | --tracking-wide |
| Code/keys/hashes | Geist Mono | --text-sm | 400 | --leading-normal | --tracking-normal |
| Prices/splits | Geist (tabular-nums) | --text-lg | 600 | --leading-tight | --tracking-tight |
| Button/label | Geist | --text-sm | 500 | --leading-normal | --tracking-wide |
| Nav/link | Geist | --text-sm | 500 | --leading-normal | --tracking-wide |

## Spacing

4px base unit, fluid where it breathes:

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px */

  /* Fluid sections */
  --space-section-sm: clamp(2rem, 4vw, 4rem);
  --space-section-md: clamp(3rem, 6vw, 6rem);
  --space-section-lg: clamp(4rem, 8vw, 10rem);
  --space-section-xl: clamp(6rem, 12vw, 16rem);
}
```

## Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;
}
```

## Shadows

```css
:root {
  --shadow-xs: 0 1px 2px 0 oklch(0 0 0 / 0.04);
  --shadow-sm: 0 1px 3px 0 oklch(0 0 0 / 0.06), 0 1px 2px -1px oklch(0 0 0 / 0.06);
  --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.08), 0 2px 4px -2px oklch(0 0 0 / 0.08);
  --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.08), 0 4px 6px -4px oklch(0 0 0 / 0.08);
  --shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 0.1), 0 8px 10px -6px oklch(0 0 0 / 0.1);
  --shadow-signal: 0 8px 30px -8px var(--color-signal / 0.35);
  --shadow-signal-strong: 0 16px 40px -12px var(--color-signal / 0.45);
  --shadow-inner: inset 0 2px 4px 0 oklch(0 0 0 / 0.03);
}
```

## Transitions

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 280ms;
  --duration-slower: 420ms;
}
```

## Z-Index

```css
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-drawer: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;
}
```

## Breakpoints

```css
:root {
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;
}
```

## Components

### Button

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  line-height: 1;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color var(--duration-base) var(--ease-out),
              border-color var(--duration-base) var(--ease-out),
              color var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
  text-decoration: none;
  white-space: nowrap;
}

.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Variants */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-fg);
  box-shadow: var(--shadow-signal);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-signal-strong);
}
.btn-primary:active:not(:disabled) {
  background: var(--color-primary-active);
  transform: scale(0.98);
}

.btn-secondary {
  background: var(--color-surface-elevated);
  color: var(--color-fg);
  border-color: var(--color-border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-alt);
  border-color: var(--color-border-strong);
}

.btn-outline {
  background: transparent;
  color: var(--color-fg);
  border-color: var(--color-border);
}
.btn-outline:hover:not(:disabled) {
  background: var(--color-primary-muted);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--color-fg-muted);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--color-bg-alt);
  color: var(--color-fg);
}

.btn-verified {
  background: var(--color-success);
  color: var(--color-success-fg);
}
.btn-verified:hover:not(:disabled) {
  background: var(--color-success-hover);
}

/* Sizes */
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
.btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
.btn-xl { padding: var(--space-4) var(--space-8); font-size: var(--text-lg); }
.btn-icon { padding: var(--space-2); aspect-ratio: 1; }
```

### Card

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: border-color var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out);
}
.card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}
.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-soft);
}
.card-body { padding: var(--space-6); }
.card-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-soft);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.badge-signal { background: var(--color-primary-muted); color: var(--color-primary); }
.badge-verified { background: var(--color-success-muted); color: var(--color-success); }
.badge-pending { background: var(--color-warning-muted); color: var(--color-warning-fg); }
.badge-invalid { background: var(--color-danger-muted); color: var(--color-danger); }
.badge-neutral { background: var(--color-bg-alt); color: var(--color-fg-muted); border: 1px solid var(--color-border); }
```

### Input

```css
.input {
  width: 100%;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-fg);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}
.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
.input::placeholder { color: var(--color-fg-subtle); }
.input:disabled { opacity: 0.5; cursor: not-allowed; }
.input-error { border-color: var(--color-danger); }
.input-error:focus { box-shadow: 0 0 0 3px var(--color-danger / 0.25); }
```

### Code Block

```css
.code-block {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.65;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  padding: var(--space-4);
}
.code-inline {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.125em 0.375em;
  font-weight: 500;
}
```

### Waveform Logo Mark

Animated SVG — 5 vertical bars representing audio waveform / cryptographic verification pulses.

```html
<svg class="waveform" viewBox="0 0 32 20" fill="none" aria-hidden="true">
  <rect x="2" y="10" width="4" height="10" rx="2" fill="currentColor" style="animation: wave 1.2s ease-in-out infinite; animation-delay: 0ms;" />
  <rect x="9" y="6" width="4" height="14" rx="2" fill="currentColor" style="animation: wave 1.2s ease-in-out infinite; animation-delay: 100ms;" />
  <rect x="16" y="2" width="4" height="18" rx="2" fill="currentColor" style="animation: wave 1.2s ease-in-out infinite; animation-delay: 200ms;" />
  <rect x="23" y="6" width="4" height="14" rx="2" fill="currentColor" style="animation: wave 1.2s ease-in-out infinite; animation-delay: 100ms;" />
  <rect x="30" y="10" width="4" height="10" rx="2" fill="currentColor" style="animation: wave 1.2s ease-in-out infinite; animation-delay: 0ms;" />
</svg>
```

```css
@keyframes wave {
  0%, 100% { transform: scaleY(1); transform-origin: bottom; }
  50% { transform: scaleY(0.4); transform-origin: bottom; }
}
@media (prefers-reduced-motion: reduce) {
  .waveform rect { animation: none; transform: scaleY(1); }
}
```

## Layout

### Container

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
@media (min-width: 1536px) {
  .container { max-width: 1440px; }
}
```

### Grid

```css
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
}
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-6); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); }
@media (max-width: 1024px) { .grid-3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
```

### Section Rhythm

```css
.section { padding: var(--space-section-md) 0; }
.section-sm { padding: var(--space-section-sm) 0; }
.section-lg { padding: var(--space-section-lg) 0; }
.section-xl { padding: var(--space-section-xl) 0; }
```

## Motion

### Principles

- **Causality over delight** — Motion shows what happened: verification completed, copy copied, section expanded
- **Exponential ease-out** — `cubic-bezier(0.16, 1, 0.3, 1)` for all exits/entrances
- **Stagger with purpose** — Only when items have semantic order (steps, pipeline stages)
- **Reduced motion = instant** — No crossfade, just state swap

### Key Animations

```css
/* Fade + slide up (entrance) */
@keyframes enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-enter { animation: enter var(--duration-slow) var(--ease-out) forwards; }

/* Fade + slide down (exit) */
@keyframes exit {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}
.animate-exit { animation: exit var(--duration-base) var(--ease-out) forwards; }

/* Pulse for live/verified states */
@keyframes pulse-signal {
  0%, 100% { box-shadow: 0 0 0 0 var(--color-signal / 0.4); }
  50% { box-shadow: 0 0 0 8px var(--color-signal / 0); }
}
.animate-pulse-signal { animation: pulse-signal 2s ease-out infinite; }

/* Shimmer for loading skeletons */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.animate-shimmer {
  background: linear-gradient(90deg, var(--color-bg-alt) 25%, var(--color-bg-soft) 50%, var(--color-bg-alt) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-enter, .animate-exit, .animate-pulse-signal, .animate-shimmer { animation: none; }
  .animate-enter { opacity: 1; transform: none; }
  .animate-exit { opacity: 0; transform: none; }
}
```

## Sound Effects

Inspired by soundcn.xyz — subtle, technical, contextual.

| Event | Sound Profile | Duration | Trigger |
|-------|---------------|----------|---------|
| `verify-success` | Pure sine, 880Hz → 1320Hz (perfect fifth), exponential decay | 350ms | Cryptographic verification passes |
| `verify-fail` | Low sine, 220Hz, quick decay with harmonic | 280ms | Signature invalid, policy expired |
| `deploy` | Two-tone: 660Hz → 880Hz, short | 200ms | GitHub Actions deploy completes |
| `copy` | Very short click, 1200Hz, 40ms | 40ms | Copy key/hash/address to clipboard |
| `toggle` | Soft pop, 440Hz, 60ms | 60ms | Theme toggle, sidebar collapse |
| `navigate` | Nearly inaudible tick, 1600Hz, 20ms | 20ms | Route change (optional, off by default) |

**Implementation**: Web Audio API synthesis (zero dependencies, ~1KB gzipped). Global toggle in footer, persists to localStorage. Respects `prefers-reduced-motion`.

## Iconography

- **Lucide** for UI icons (consistent, technical, not decorative)
- **Custom SVG** for protocol-specific: waveform, key, signature, blockchain, split
- **Size**: 16px (inline), 20px (UI), 24px (feature), 32px (hero)
- **Stroke**: 1.5px (16px), 2px (20px+), rounded caps/joins

## Imagery

No stock photography. Visual language is:
- Protocol diagrams (Mermaid/Excalidraw style)
- Code screenshots (real CLI output)
- Terminal recordings (asciinema)
- Data visualizations (pricing splits, verification flows)
- The waveform logo mark (animated)

## Dark Mode

Native, not inverted. Deep blue-black (`oklch(0.09 0.02 260)`) matches terminal aesthetic. Signal orange brightens slightly for contrast. Verified green shifts toward mint. All shadows re-evaluated for dark surfaces.

## Print

```css
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  a { text-decoration: none; color: inherit; }
  .card { break-inside: avoid; }
  .section { padding: var(--space-4) 0; }
}
```

## Tokens Export

All tokens available as:
- `tokens/brand.json` — JSON for programmatic use
- `tokens/global.css` — CSS custom properties
- `tokens/tailwind.config.js` — Tailwind theme extension
- `tokens/figma.json` — Figma Tokens plugin compatible