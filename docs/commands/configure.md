---
title: reposell configure
description: Inspect and modify reposell.yml from the terminal. Planned command.
---

# reposell configure

::: warning Status: planned
`configure` is specified but **not yet part of the shipped binary** (v0.x). Until it lands, edit `reposell.yml` directly — see the [schema reference](/configuration/schema).
:::

View or modify `reposell.yml` from the terminal.

```bash
reposell configure                # interactive overview
reposell configure get <key>      # print one value
reposell configure set <key> <value>
reposell configure delete <key>
```

## Planned behavior

- Reads and writes **only** `reposell.yml` — no global config, no hidden state.
- Validates against the schema on every write; invalid values are rejected with the reason.
- Never rewrites formatting or comments outside the touched key.

## Today

Use any editor:

```bash
$ cat reposell.yml
version: 1
product:
  name: your-repo
releases:
  mode: manual
  definitions: {}
sell:
  enabled: true
listing:
  enabled: false
```

Then check it:

```bash
reposell validate
```

## Related

- [reposell.yml schema](/configuration/schema)
- [Zero-config derivation](/configuration/zero-config)
