# feature.md — Add a new CLI command

1. Isolate the functionality: identify the directory boundary.
2. Read the parent AGENTS.md to understand inheritable context.
3. Create `<dir>/AGENTS.md` (use `acc document <dir>` for a template).
4. Implement the CLI command in `src/cli/commands/`.
5. Register the command in `src/cli/commands/index.ts`.
6. Add tests in `tests/unit/commands/`.
7. Run `acc check` to validate references and contracts.
8. Run `acc graph` to confirm relationships match intent.
9. Run `acc impact <dir>` to identify affected tests/dependents.
10. Update `.acc-memory.md` with what you learned.

## Sub-steps

### Command Structure

```typescript
// src/cli/commands/new-command.ts
import { Command } from '../command';

export const newCommand: Command = {
  name: 'new-command',
  description: 'Description of what it does',
  args: [],
  options: [],
  async execute(ctx) {
    // Implementation
  }
};
```

### Test Structure

```typescript
// tests/unit/commands/new-command.test.ts
import { describe, test, expect } from 'vitest';
import { reposell } from '@/sdk';

describe('new-command', () => {
  test('executes successfully', async () => {
    // Test implementation
  });
});
```