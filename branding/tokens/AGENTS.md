# branding/tokens

## Purpose

Brand token source: brand identity JSON, Tailwind configuration, and global CSS entry points.

## Ownership

Owner: branding/tokens (inherits ../AGENTS.md)

## Responsibilities

- `brand.json` — brand identity values (single source for brand data).
- `tailwind.config.js`, `global.css`, `soundcn.css` — styling pipeline config.
- `utils.ts` / `index.ts` — token helpers/exports.

## Constraints

- Brand data is declared once in `brand.json`; do not re-declare brand values in components.
