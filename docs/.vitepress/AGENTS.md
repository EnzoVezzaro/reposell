# docs/.vitepress

## Purpose

VitePress site configuration for the docs site.

## Ownership

Owner: docs/.vitepress (inherits ../AGENTS.md)

## Structure

- `config.ts` — site config (nav, sidebar, base path, theme wiring).
- `theme/` — custom theme (see its contract).
- `dist/`, `cache/` — generated output; never edited by hand.

## Dependencies

- branding/ (theme kit wiring)
- docs/
- tools/
- branding
- docs
- tools

## Constraints

- Per-repo base paths are configured here (GitHub Pages); keep CNAME/deploy sync in mind.
