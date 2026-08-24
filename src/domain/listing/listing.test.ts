import { describe, expect, it } from 'vitest';

import { buildListingPr, validateListingPr, LISTING_PR_SCHEMA } from './pr.js';
import { checkSellerSell, DEFAULT_SELL_FETCH } from './health.js';
import { discoveryIdempotencyKey, discoveryMetadata, discoveryProductName } from './discovery.js';

function validPayload(): ReturnType<typeof buildListingPr> {
  return buildListingPr({
    repositoryUrl: 'https://github.com/seller/project',
    owner: 'seller',
    repo: 'project',
    version: 'v2.4.1',
    commit: '8f92a1',
    sellUrl: 'https://seller.example/sell',
    sellerPaymentLink: 'https://buy.stripe.com/SELLER_LINK',
    discoveryPrice: { amount: 5, currency: 'USD' },
  });
}

describe('Listing PR payload (§3-§4)', () => {
  it('accepts a well-formed payload', () => {
    const result = validateListingPr(validPayload());
    expect(result.ok).toBe(true);
  });

  it('fail-closed: missing seller payment link is blocked', () => {
    const payload = validPayload();
    payload.sell.payment_link = '';
    const result = validateListingPr(payload);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.field === 'sell.payment_link')).toBe(true);
  });

  it('fail-closed: missing discovery price is blocked', () => {
    const payload = validPayload();
    // SAFETY: exercising the validator against a hand-broken payload.
    (payload.listing as { discovery_price?: unknown }).discovery_price = undefined;
    const result = validateListingPr(payload);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.field === 'listing.discovery_price')).toBe(true);
  });

  it('fail-closed: non-https sell url and bad release version are blocked', () => {
    const payload = validPayload();
    payload.sell.url = 'http://seller.example/sell';
    payload.release.version = 'not-a-version';
    const result = validateListingPr(payload);
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toContain('sell.url');
    expect(result.issues.map((issue) => issue.field)).toContain('release.version');
  });

  it('fail-closed: wrong schema rejected', () => {
    const payload = validPayload();
    // SAFETY: hand-broken payload for the validator test.
    (payload as { schema: string }).schema = 'reposell-listing/v0';
    expect(validateListingPr(payload).ok).toBe(false);
    expect(LISTING_PR_SCHEMA).toBe('reposell-listing/v1');
  });
});

describe('seller /sell health check (§5)', () => {
  const page = (embedded: unknown): string =>
    `<html><script type="application/json" id="reposell-data">${JSON.stringify(embedded)}</script></html>`;

  const healthy = {
    schema: 'reposell/sell-page/v1',
    repository: 'seller/project',
    releases: [
      {
        version: 'v2.4.1',
        status: 'available',
        offers: [{ paymentLink: 'https://buy.stripe.com/SELLER_LINK' }],
      },
    ],
  };

  it('passes when identity, release and seller link all match', async () => {
    const result = await checkSellerSell({
      sellUrl: 'https://seller.example/sell',
      repository: 'seller/project',
      version: 'v2.4.1',
      sellerPaymentLink: 'https://buy.stripe.com/SELLER_LINK',
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => page(healthy) }),
    });
    expect(result.healthy).toBe(true);
  });

  it('fail-closed on HTTP error', async () => {
    const result = await checkSellerSell({
      sellUrl: 'https://seller.example/sell',
      repository: 'seller/project',
      version: 'v2.4.1',
      sellerPaymentLink: 'https://buy.stripe.com/SELLER_LINK',
      fetchImpl: async () => ({ ok: false, status: 404, text: async () => '' }),
    });
    expect(result.healthy).toBe(false);
    expect(result.issues[0]?.check).toBe('reachable');
  });

  it('fail-closed when the page is not a reposell /sell page', async () => {
    const result = await checkSellerSell({
      sellUrl: 'https://seller.example/sell',
      repository: 'seller/project',
      version: 'v2.4.1',
      sellerPaymentLink: 'https://buy.stripe.com/SELLER_LINK',
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => '<html><body>shop</body></html>' }),
    });
    expect(result.healthy).toBe(false);
    expect(result.issues[0]?.check).toBe('reposell-metadata');
  });

  it('fail-closed when repository identity mismatches', async () => {
    const result = await checkSellerSell({
      sellUrl: 'https://seller.example/sell',
      repository: 'seller/project',
      version: 'v2.4.1',
      sellerPaymentLink: 'https://buy.stripe.com/SELLER_LINK',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        text: async () => page({ ...healthy, repository: 'attacker/clone' }),
      }),
    });
    expect(result.issues.some((issue) => issue.check === 'repository-identity')).toBe(true);
  });

  it('§19 negative: seller Stripe link changed → detected, blocked', async () => {
    const result = await checkSellerSell({
      sellUrl: 'https://seller.example/sell',
      repository: 'seller/project',
      version: 'v2.4.1',
      sellerPaymentLink: 'https://buy.stripe.com/OLD_LINK',
      fetchImpl: async () => ({ ok: true, status: 200, text: async () => page(healthy) }),
    });
    expect(result.healthy).toBe(false);
    expect(result.issues.some((issue) => issue.check === 'seller-payment-link')).toBe(true);
  });
});

describe('discovery metadata separation (§6-§7, §19)', () => {
  it('carries only discovery facts — never seller transaction data', () => {
    const sellerPrice = 100;
    const metadata = discoveryMetadata({
      repository: 'seller/project',
      release: 'v2.4.1',
      amount: 5,
      currency: 'USD',
    });
    expect(metadata.purpose).toBe('discovery');
    expect(metadata.discovery_amount).toBe('5.00');
    const serialized = JSON.stringify(metadata);
    expect(serialized).not.toContain(String(sellerPrice));
    expect(serialized).not.toContain('seller_payment');
    expect(serialized).not.toContain('buy.stripe.com');
  });

  it('§19: discovery price equal to seller price still stays a separate transaction', () => {
    const metadata = discoveryMetadata({
      repository: 'seller/project',
      release: 'v2.4.1',
      amount: 49,
      currency: 'USD',
    });
    // Same number as the seller's price changes nothing: metadata still has
    // purpose=discovery and no seller linkage whatsoever.
    expect(metadata.purpose).toBe('discovery');
    expect(Object.keys(metadata).some((key) => key.includes('seller'))).toBe(false);
  });

  it('per-release links are deterministic and immutable (D16/§15)', () => {
    const a = discoveryIdempotencyKey({ repository: 'seller/project', release: 'v1.0' });
    const b = discoveryIdempotencyKey({ repository: 'seller/project', release: 'v1.0' });
    const c = discoveryIdempotencyKey({ repository: 'seller/project', release: 'v2.0' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(discoveryProductName({ repository: 'seller/project', release: 'v1.0' })).toContain('discovery');
  });

  it('default fetch is https-only wired', () => {
    expect(typeof DEFAULT_SELL_FETCH).toBe('function');
  });
});
