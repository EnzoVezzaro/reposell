# src/config

## Purpose

Configuration management: `reposell.yml` schema (Zod), loading, merging, environment overrides.

## Ownership

Owner: src/config (inherits ../../AGENTS.md)

## Responsibilities

- Schema validation, deep merge with precedence, zero-config defaults/auto-derivation.

## Dependencies

- src/utils

## Constraints

- Invalid config fails closed with actionable errors.
- Environment overrides documented in `docs/configuration/env.md`.
