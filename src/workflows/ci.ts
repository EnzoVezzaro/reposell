/**
 * GitHub Actions workflow generation (spec §24-26).
 *
 * One workflow handles push, GitHub Release events and manual dispatch:
 * validate -> build -> deploy the /reposell/* surface to GitHub Pages.
 * The generated file lives at .github/workflows/reposell.yml and nothing
 * else outside the protocol namespace is ever touched.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { stringify } from 'yaml';

function secretRef(name: string): string {
  return `\${{ secrets.${name} }}`;
}

/**
 * The workflow model. Uses plain Node + the published CLI so target
 * repositories need no Bun/TS toolchain.
 */
export function createReposellWorkflow(): Record<string, unknown> {
  return {
    name: 'reposell',
    on: {
      push: { branches: ['main', 'master'] },
      release: { types: ['published'] },
      // D13: scheduled re-verification keeps health/payment facts current
      // without a PR per release.
      schedule: [{ cron: '0 6 * * 1' }],
      workflow_dispatch: null,
    },
    permissions: {
      contents: 'read',
      pages: 'write',
      'id-token': 'write',
    },
    concurrency: {
      group: 'pages',
      'cancel-in-progress': false,
    },
    jobs: {
      publish: {
        'runs-on': 'ubuntu-latest',
        environment: {
          name: 'github-pages',
          url: '${{ steps.deployment.outputs.page_url }}',
        },
        steps: [
          { uses: 'actions/checkout@v4' },
          { uses: 'actions/setup-node@v4', with: { 'node-version': 20 } },
          { name: 'Install reposell CLI', run: 'npm install -g @reposell/cli' },
          {
            name: 'Validate protocol configuration',
            run: 'reposell validate',
            env: {
              REPOSELL_SIGNING_KEY: secretRef('REPOSELL_SIGNING_KEY'),
            },
          },
          {
            name: 'Build /reposell/* surface',
            run: 'reposell build --out dist',
            env: {
              REPOSELL_SIGNING_KEY: secretRef('REPOSELL_SIGNING_KEY'),
            },
          },
          { uses: 'actions/configure-pages@v5' },
          { uses: 'actions/upload-pages-artifact@v3', with: { path: 'dist/reposell' } },
          { id: 'deployment', uses: 'actions/deploy-pages@v4' },
        ],
      },
    },
  };
}

/** Renders the workflow YAML deterministically. */
export function renderReposellWorkflowYaml(): string {
  return stringify(createReposellWorkflow(), { sortMapEntries: false });
}

export interface WorkflowGenerationResult {
  written: string[];
}

/**
 * Writes .github/workflows/reposell.yml (single write, real commands,
 * Pages deployment). Never overwrites developer files outside this path.
 */
export async function generateWorkflows(cwd: string): Promise<WorkflowGenerationResult> {
  const workflowPath = path.join(cwd, '.github', 'workflows', 'reposell.yml');
  await fs.mkdir(path.dirname(workflowPath), { recursive: true });
  await fs.writeFile(workflowPath, renderReposellWorkflowYaml());
  return { written: ['.github/workflows/reposell.yml'] };
}
