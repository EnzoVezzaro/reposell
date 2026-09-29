# tools

## Purpose

Project-local tooling assets (ACC tool-plugin directory per `.acc/config/config.yaml`).

## Ownership

Owner: tools (inherits ../AGENTS.md)

## Structure

- `oxlint/anti-slop/` — vendored anti-slop Oxlint plugin (see its contract).

## Constraints

- Tooling here never ships in the published CLI package (dev-only).
