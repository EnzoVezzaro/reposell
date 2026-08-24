import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { listingStatus } from './listing-service.js';

let cwd: string;

beforeEach(async () => {
  cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'reposell-mkt-'));
});

const stripeOk = () => async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    id: 'acct_test',
    livemode: false,
    charges_enabled: true,
    payouts_enabled: true,
  }),
});

describe('listingStatus', () => {
  it('reports unconfigured payments when no key exists anywhere', async () => {
    const status = await listingStatus(cwd, { processEnv: {}, readFile: async () => undefined });
    expect(status.payment).toEqual({ provider: 'stripe', mode: 'unconfigured', connected: false });
  });

  it('reads the test key from a local .env file', async () => {
    const status = await listingStatus(cwd, {
      processEnv: {},
      readFile: async (p) => (p.endsWith('.env') ? 'STRIPE_SECRET_KEY=sk_test_fromfile\n' : undefined),
      fetchImpl: stripeOk(),
    });
    expect(status.payment).toMatchObject({ provider: 'stripe', mode: 'test', connected: true });
  });

  it('process env wins over .env file', async () => {
    const status = await listingStatus(cwd, {
      processEnv: { STRIPE_SECRET_KEY: 'sk_test_process' },
      readFile: async (p) => (p.endsWith('.env') ? 'STRIPE_SECRET_KEY=sk_test_file\n' : undefined),
      fetchImpl: stripeOk(),
    });
    expect(status.payment.mode).toBe('test');
  });

  it('falls back to unconfigured when Stripe rejects the key', async () => {
    const status = await listingStatus(cwd, {
      processEnv: { STRIPE_SECRET_KEY: 'sk_test_bad' },
      readFile: async () => undefined,
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      }),
    });
    expect(status.payment.mode).toBe('unconfigured');
  });

  it('collects repository, license and yml state into one report', async () => {
    await fs.writeFile(path.join(cwd, 'reposell.yml'), 'license:\n  mode: keep-existing\n');
    const status = await listingStatus(cwd, { processEnv: {}, readFile: async () => undefined });
    expect(status.reposellYmlPresent).toBe(true);
    expect(status.licenseMode).toBe('keep-existing');
    expect(status.sellEndpointEnabled).toBe(false);
    expect(status.license.status).toBe('missing');
  });

  it('detects an enabled /sell endpoint from reposell.yml', async () => {
    await fs.writeFile(path.join(cwd, 'reposell.yml'), 'sell:\n  enabled: true\n');
    const status = await listingStatus(cwd, { processEnv: {}, readFile: async () => undefined });
    expect(status.sellEndpointEnabled).toBe(true);
  });
});
