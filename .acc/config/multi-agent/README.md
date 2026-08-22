# Multi-Agent Orchestration Configuration

This directory contains configuration for multi-agent orchestration in the ACC framework.

## Structure

```
multi-agent/
├── config.yaml
├── agents/
│   ├── architect.yaml
│   ├── implementer.yaml
│   ├── reviewer.yaml
│   └── tester.yaml
└── workflows/
    └── feature.yaml
```

## Configuration

The main configuration defines:
- `enabled` - Enable multi-agent mode
- `max_concurrency` - Maximum concurrent agents
- `max_depth` - Maximum orchestration depth
- `task_timeout` - Task timeout in seconds
- `resource_limits` - CPU, memory, token budgets
- `isolation_mode` - Isolation strategy (git_worktree, process, container)
- `conflict_policy` - Conflict resolution policy

## Agent Roles

| Role | Responsibility | When to Use |
|------|----------------|-------------|
| **architect** | Architecture review, graph analysis, impact assessment | Before implementing, design decisions |
| **implementer** | Feature implementation, code changes | After architecture approved |
| **reviewer** | Code review, ACC compliance, security audit | After implementation |
| **tester** | Test generation, E2E testing, validation | After review passes |

## Workflows

The orchestration follows a linear pipeline:
1. **Architect** analyzes requirements, creates plan
2. **Implementer** executes the plan
3. **Reviewer** validates against ACC rules, security
4. **Tester** runs tests, verifies behavior

## Conflict Resolution

- `sequentialize` - Run agents sequentially (default)
- `parallel` - Run with git worktree isolation
- `merge` - Attempt auto-merge, escalate on conflict

## Example Configuration

```yaml
# multi-agent/config.yaml
enabled: false
max_concurrency: 4
max_depth: 1
task_timeout: 300
resource_limits:
  cpu_percent: 80
  memory_mb: 4096
  token_budget: 1000000
isolation_mode: "git_worktree"
conflict_policy: "sequentialize"

agents:
  architect:
    enabled: true
    profile: ".acc/config/agents/architect.md"
  implementer:
    enabled: true
  reviewer:
    enabled: true
  tester:
    enabled: true
```

## Usage

When enabled, agents can be invoked via:

```bash
# Single agent
acc agent architect --task "review payment flow"

# Full pipeline
acc pipeline feature --name "add webhook support"
```