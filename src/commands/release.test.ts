import { describe, it, expect, beforeEach, vi } from 'vitest';
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

const V010_DEFINITION = {
  status: 'draft' as const,
  offers: [
    {
      scheme: 'standard',
      pricing: { amount: 50, currency: 'EUR' },
      payment: { provider: 'stripe' as const, payment_link: 'https://buy.stripe.com/test_recorded' },
    },
  ],
};

describe('releaseCommand', () => {
  it('reuses the recorded offer instead of asking again', async () => {
    await updateReleaseDefinition({ cwd, tag: 'v0.1.0', definition: V010_DEFINITION });

    const report = await releaseCommand(cwd, { tag: 'v0.1.0' });
    expect(report).toContain('Offer standard: 50 EUR');
    expect(report).toContain('https://buy.stripe.com/test_recorded');
    expect(report).not.toContain('missing');
  });

  it('normalizes tags without the v prefix to the recorded definition', async () => {
    await updateReleaseDefinition({ cwd, tag: 'v0.1.0', definition: V010_DEFINITION });

    const report = await releaseCommand(cwd, { tag: '0.1.0' });
    expect(report).toContain('✓ Recorded release v0.1.0');
    expect(report).toContain('Offer standard: 50 EUR');
  });
});

describe('releaseCommand — auto-detection', () => {
  it('reads price/currency from a prior release link via the .env key, no prompts', async () => {
    await fs.writeFile(path.join(cwd, '.env'), 'STRIPE_SECRET_KEY=sk_test_detector\n');
    await updateReleaseDefinition({
      cwd,
      tag: 'v0.1.0',
      definition: {
        status: 'published',
        offers: [
          {
            scheme: 'standard',
            pricing: { amount: 29, currency: 'USD' },
            payment: { provider: 'stripe', payment_link: 'https://buy.stripe.com/test_prior' },
          },
        ],
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/payment_links?')) {
          return Promise.resolve(new Response(JSON.stringify({ data: [{ id: 'plink_prior', url: 'https://buy.stripe.com/test_prior' }] }), { status: 200 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ data: [{ price: { unit_amount: 4900, currency: 'usd' } }] }), { status: 200 }),
        );
      }),
    );

    try {
      const report = await releaseCommand(cwd, { tag: 'v0.2.0' });
      expect(report).toContain('Offer standard: 49 USD');
      expect(report).toContain('https://buy.stripe.com/test_prior');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
