import { describe, it, expect } from 'vitest';
import {
  StripePaymentProvider,
  StripeKeyMissingError,
  StripeKeyInvalidError,
  StripeApiError,
  classifySecretKey,
} from './stripe.js';

function fakeFetch(body: {
  id?: string;
  business_profile?: { name?: string };
  country?: string;
  default_currency?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  livemode?: boolean;
  error?: { message?: string };
}, ok = true, status = 200) {
  let captured: { url: string; auth: string } | undefined;
  const fetchFn = async (url: string, init: { headers: Record<string, string> }) => {
    captured = { url, auth: init.headers['Authorization'] ?? '' };
    return { ok, status, json: async () => body };
  };
  return { fetchFn, get captured() { return captured; } };
}

const ACCOUNT_OK = {
  id: 'acct_test123',
  business_profile: { name: 'Enzo Solo Dev' },
  country: 'DO',
  default_currency: 'usd',
  charges_enabled: true,
  payouts_enabled: true,
  livemode: false,
};

describe('key handling', () => {
  it('throws StripeKeyMissingError when no key is present', () => {
    expect(() => StripePaymentProvider.fromEnv({})).toThrow(StripeKeyMissingError);
    expect(() => StripePaymentProvider.fromEnv({ STRIPE_SECRET_KEY: '   ' })).toThrow(StripeKeyMissingError);
  });

  it('prefers REPOSELL_STRIPE_SECRET_KEY over STRIPE_SECRET_KEY', () => {
    const provider = StripePaymentProvider.fromEnv({
      STRIPE_SECRET_KEY: 'sk_test_first',
      REPOSELL_STRIPE_SECRET_KEY: 'sk_test_second',
    });
    expect(provider).toBeDefined();
  });

  it('rejects keys that do not look like Stripe secret keys', () => {
    expect(() => new StripePaymentProvider('pk_live_abc')).toThrow(StripeKeyInvalidError);
    expect(() => new StripePaymentProvider('hello')).toThrow(StripeKeyInvalidError);
  });

  it('classifies test vs live mode', () => {
    expect(classifySecretKey('sk_test_123')).toBe('test');
    expect(classifySecretKey('sk_live_123')).toBe('live');
  });
});

describe('verifyAccount', () => {
  it('sends the bearer token and maps the account payload', async () => {
    const fake = fakeFetch(ACCOUNT_OK);
    const provider = new StripePaymentProvider('sk_test_abc123', fake.fetchFn);
    const status = await provider.verifyAccount();

    expect(fake.captured.url).toBe('https://api.stripe.com/v1/account');
    expect(fake.captured.auth).toBe('Bearer sk_test_abc123');
    expect(status).toEqual({
      provider: 'stripe',
      mode: 'test',
      connected: true,
      accountId: 'acct_test123',
      businessName: 'Enzo Solo Dev',
      country: 'DO',
      defaultCurrency: 'usd',
      chargesEnabled: true,
      payoutsEnabled: true,
    });
  });

  it('maps API errors to StripeApiError with the message from Stripe', async () => {
    const { fetchFn } = fakeFetch({ error: { message: 'Invalid API key provided' } }, false, 401);
    const provider = new StripePaymentProvider('sk_test_bad', fetchFn);
    await expect(provider.verifyAccount()).rejects.toThrow(StripeApiError);
    await expect(provider.verifyAccount()).rejects.toThrow(/Invalid API key/);
  });

  it('reports live mode for live accounts', async () => {
    const { fetchFn } = fakeFetch({ ...ACCOUNT_OK, livemode: true });
    const provider = new StripePaymentProvider('sk_live_real', fetchFn);
    const status = await provider.verifyAccount();
    expect(status.mode).toBe('live');
  });
});
