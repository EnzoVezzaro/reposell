# Tool Plugins

This directory contains external tooling plugins for the ACC framework.

## Structure

```
tools/
├── oxlint/
│   ├── plugin.yaml
│   └── index.js
├── acc/
│   ├── plugin.yaml
│   └── index.js
└── typescript/
    ├── plugin.yaml
    └── index.js
```

## Plugin Configuration

Each plugin defines:
- `name` - Plugin identifier
- `version` - Plugin version
- `entry` - Entry point module
- `commands` - CLI commands exposed
- `hooks` - Lifecycle hooks

## Example: Oxlint Plugin

```yaml
# tools/oxlint/plugin.yaml
name: oxlint
version: "1.0.0"
entry: "./index.js"
commands:
  - name: lint
    description: Run Oxlint with anti-slop rules
    args:
      - fix?: boolean
      - format?: string
hooks:
  pre-commit: true
  pre-push: false
```

## Available Tools (Auto-discovered)

The ACC framework auto-discovers tools from:
- `package.json` scripts
- `bun.lockb` / `package-lock.json` dependencies
- Project configuration files

Common tools for this project:
- **oxlint** - Fast linter with anti-slop plugin
- **typescript/tsc** - Type checking
- **vitest** - Unit/integration testing
- **bun** - Runtime and package manager
- **acc** - Agent Code Context CLI

## Tool Registration

Tools are registered via the `tools` section in `.acc/config/config.yaml`:

```yaml
tools:
  auto_discover: true
  plugins:
    enabled: true
    directory: ".acc/config/tools"
```