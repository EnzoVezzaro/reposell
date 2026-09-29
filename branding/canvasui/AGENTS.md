# branding/canvasui

## Purpose

Vanilla canvas rendering engines used by the landing hero effects.

## Ownership

Owner: branding/canvasui (inherits ../AGENTS.md)

## Responsibilities

- `DecryptRevealVanilla.ts` / `LiquidVanilla.ts` — self-contained canvas effects.
- `rect-cache.ts` — layout measurement caching for canvas text.

## Constraints

- Framework-free (no React/Vue imports) so any surface can embed them.
- Respect `prefers-reduced-motion`; see `LICENSE-NOTE.md` before vendoring elsewhere.
