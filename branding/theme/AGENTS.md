# branding/theme

## Purpose

The VitePress theme kit: overridable theme components, styles, and theme layers used by `docs/`.

## Ownership

Owner: branding/theme (inherits ../AGENTS.md)

## Structure

- `components/` — VP* component overrides (hero, navbar, footer, cards, canvas effects, …).
- `styles/` — CSS variable layers (`variables.css`, `variables-soundcn.css`, `custom.css`).
- `index.ts` — theme entry wiring.

## Constraints

- Theme layers are exclusive and scoped via `data-theme` (security/shadcn/canvas/cartoon).
- `prefers-reduced-motion` must be honored in all animation.
