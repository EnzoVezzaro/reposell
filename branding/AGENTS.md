# branding

## Purpose

The shared brand/design system used by the docs site and landings (vendored per repo).

## Ownership

Owner: branding (inherits ../AGENTS.md)

## Structure

- `PRODUCT.md` / `DESIGN.md` — product + design context (impeccable skill input).
- `components/` — shadcn-style UI primitives (React).
- `theme/` — VitePress theme kit (components, styles) used by `docs/`.
- `canvasui/` — vanilla canvas engines (decrypt/liquid effects).
- `tokens/` — brand tokens (brand.json, Tailwind config, global CSS).
- `assets/` — logos and marks.

## Constraints

- Branding is vendored per repository (no cross-repo local paths).
- Design quality work follows the `impeccable` skill; UI review goes to the `ui-reviewer`
  subagent (see `.acc/config/multi-agent/README.md`).
