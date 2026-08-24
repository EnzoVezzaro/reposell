# Release Configuration

## Overview

Configure how your releases are handled by reposell CLI and the listing.

## Release Selection Modes

### `mode: "selected"` (Explicit)
Only listed releases are sellable:
```yaml
releases:
  mode: "selected"
  selected:
    - "v1.0.0"
    - "v1.1.0"
```

### `mode: "all"` (Automatic)
All releases sellable, new releases auto-exposed:
```yaml
releases:
  mode: "all"
```

**CI Required**: When `mode: "all"`, CI auto-updates listing on new releases.

## Release Workflow

```bash
# Create release (triggers CI)
reposell release create 1.2.0

# CI automatically:
# 1. Validates manifest
# 2. Updates listing metadata
# 4. Notifies listing
# 5. Generates signatures
```

## Release Workflow File

The `.github/workflows/reposell-release.yml` handles:
1. Detects new tag push
2. Validates manifest
4. Updates listing metadata
5. Notifies listing
5. Generates signatures

## Best Practices

- Use semantic versioning (v1.0.0, v1.1.0, v2.0.0)
- Include release notes in tags
- Test before releasing
- Use `mode: "all"` for automatic listing sync