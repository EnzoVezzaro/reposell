# branding/theme/components

## Purpose

Vue/VitePress theme component overrides (VP*): hero, features, navbar, footer, sidebar, cards,
tabs, terminal, calculator, badges, alerts, sound toggle, and canvas effects (decrypt, liquid,
waveform).

## Ownership

Owner: branding/theme/components (inherits ../AGENTS.md)

## Constraints

- Per-theme hero components render structurally different experiences; slot content stays shared.
- Contrast is theme-aware (light/dark via CSS variables) — no hard-coded colors.
