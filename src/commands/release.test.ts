import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { releaseCommand } from './release.js';
import { renderDefaultYml, writeConfig, updateReleaseDefinition } from '../app/config-service.js';

let cwd: string;

beforeEach(async () => {
  cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'reposell-rel-'));
  await writeConfig(cwd, renderDefaultYml({ productName: 'acme' }));
});

describe('releaseCommand', () => {
  it('reuses the recorded offer instead of asking again', async () => {
    await updateReleaseDefinition({
      cwd,
      tag: 'v0.1.0',
      definition: {
        status: 'draft',
        offers: [
          {
            scheme: 'standard',
            pricing: { amount: 50, currency: 'EUR' },
            payment: { provider: 'stripe', payment_link: 'https://buy.stripe.com/test_recorded' },
          },
        ],
      },
    });

    const report = await releaseCommand(cwd, { tag: 'v0.1.0' });
    expect(report).toContain('Offer standard: 50 EUR');
    expect(report).toContain('https://buy.stripe.com/test_recorded');
    expect(report).not.toContain('missing');
  });
});
