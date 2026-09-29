# docs/.vitepress/theme

## Purpose

The site's theme: components, styles, and theme layer definitions.

## Ownership

Owner: docs/.vitepress/theme (inherits ../AGENTS.md)

## Structure

- `components/` — doc-level Vue components (DecryptText, VersionChip, ThemeSwitcher, …).
- `styles/` — theme stylesheet layers.
- `themes/` — the four exclusive theme layers (security, shadcn, canvas, cartoon).

## Dependencies

- branding/
- branding/theme
- branding/theme/components
- branding/theme/styles
- branding

## Constraints

- Component overrides of the brand kit live in `branding/theme/`; this tree holds site-level
  composition only — don't duplicate brand components here.
- Theme switching is exclusive `data-theme` scoping with autoplay + reduced-motion guards.
