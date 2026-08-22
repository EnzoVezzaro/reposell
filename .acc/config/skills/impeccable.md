# impeccable Skill (pbakaus/impeccable)

General-purpose skills installer and quality tooling for frontend/UI development.

## Installation

```bash
# Already installed via the skill system
npx skills add pbakaus/impeccable --skill impeccable --yes
```

## What It Does

Impeccable is a design/UX skill that helps with:
- Designing, redesigning, shaping, critiquing, auditing, polishing, clarifying frontend interfaces
- UX review, visual hierarchy, information architecture, cognitive load
- Accessibility, performance, responsive behavior, theming
- Anti-patterns, typography, fonts, spacing, layout, alignment, color, motion
- Micro-interactions, UX copy, error states, edge cases, i18n
- Design systems or tokens

## Capabilities

| Category | Focus Areas |
|----------|-------------|
| **UX Review** | Visual hierarchy, information architecture, cognitive load, accessibility |
| **Design** | Typography, fonts, spacing, layout, alignment, color, motion, micro-interactions |
| **Quality** | Performance, responsive behavior, theming, anti-patterns |
| **Components** | Forms, settings, onboarding, empty states, error states, edge cases |
| **Systems** | Design tokens, reusable design systems, i18n |

## When to Use

Use this skill when:
- Designing, redesigning, shaping, critiquing, auditing, polishing frontend interfaces
- Working on websites, landing pages, dashboards, product UI, app shells
- Handling forms, settings, onboarding, empty states
- Bland designs that need to become bolder or more delightful
- Loud designs that should become quieter
- Ambitious visual effects that should feel technically extraordinary

## When NOT to Use

- Backend-only or non-UI tasks
- Pure algorithmic/data processing work
- CLI tool development without UI

## Configuration

The skill is installed via the Agent Skills system and available to all configured agents.

## Provenance

- Source: `pbakaus/impeccable` (MIT License)
- Skill installed to: `.agents/skills/impeccable/`
- ACC config reference: `.acc/config/skills/impeccable.md`

## Integration with ACC

- This skill complements ACC for UI/UX work
- ACC handles architecture/graph validation; Impeccable handles UI/UX quality
- Run `acc check` for architecture validation
- Use Impeccable skill for design reviews and UI quality gates
- No AGENTS.md changes needed for skill installation