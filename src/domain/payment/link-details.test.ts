import { describe, it, expect } from 'vitest';
import { fetchPaymentLinkDetailsByUrl } from './link-details.js';
import type { HttpResultLike } from './stripe-links.js';

function jsonResponse(payload: unknown, ok = true, status = 200): HttpResultLike {
  return { ok, status, json: async () => payload };
}

const LINK_URL = 'https://buy.stripe.com/test_abc123';

describe('fetchPaymentLinkDetailsByUrl', () => {
  it('resolves amount and currency from the matching link', async () => {
    const calls: string[] = [];
    const details = await fetchPaymentLinkDetailsByUrl({
      apiKey: 'sk_test_x',
      linkUrl: LINK_URL,
      fetchImpl: (url) => {
        calls.push(url);
        if (url.includes('/payment_links?')) {
          return Promise.resolve(
            jsonResponse({
              data: [
                { id: 'plink_other', url: 'https://buy.stripe.com/test_other' },
                { id: 'plink_mine', url: LINK_URL },
              ],
              has_more: false,
            }),
          );
        }
        return Promise.resolve(
          jsonResponse({
            data: [{ price: { unit_amount: 5000, currency: 'usd', type: 'one_time' } }],
          }),
        );
      },
    });
    expect(details).toEqual({ amount: 50, currency: 'USD' });
    expect(calls.some((url) => url.includes('plink_mine'))).toBe(true);
  });

  it('detects recurring intervals', async () => {
    const details = await fetchPaymentLinkDetailsByUrl({
      apiKey: 'sk_test_x',
      linkUrl: LINK_URL,
      fetchImpl: (url) =>
        url.includes('/payment_links?')
          ? Promise.resolve(jsonResponse({ data: [{ id: 'plink_mine', url: LINK_URL }] }))
          : Promise.resolve(
              jsonResponse({
                data: [
                  {
                    price: {
                      unit_amount: 1200,
                      currency: 'eur',
                      type: 'recurring',
                      recurring: { interval: 'month' },
                    },
                  },
                ],
              }),
            ),
    });
    expect(details).toEqual({ amount: 12, currency: 'EUR', recurring: { interval: 'month' } });
  });

  it('paginates until the matching link is found', async () => {
    let listCalls = 0;
    const details = await fetchPaymentLinkDetailsByUrl({
      apiKey: 'sk_test_x',
      linkUrl: LINK_URL,
      fetchImpl: (url) => {
        if (url.includes('/line_items')) {
          return Promise.resolve(
            jsonResponse({ data: [{ price: { unit_amount: 5000, currency: 'usd' } }] }),
          );
        }
        if (!url.includes('/payment_links?')) throw new Error('unexpected call');
        listCalls += 1;
        return listCalls === 1
          ? Promise.resolve(
              jsonResponse({ data: [{ id: 'plink_a', url: 'https://buy.stripe.com/test_a' }], has_more: true }),
            )
          : Promise.resolve(jsonResponse({ data: [{ id: 'plink_mine', url: LINK_URL }] }));
      },
    });
    expect(listCalls).toBe(2);
    expect(details?.amount).toBe(50);
  });

  it('returns undefined when no key-visible link matches the URL', async () => {
    const details = await fetchPaymentLinkDetailsByUrl({
      apiKey: 'sk_test_x',
      linkUrl: LINK_URL,
      fetchImpl: () =>
        Promise.resolve(jsonResponse({ data: [{ id: 'plink_x', url: 'https://buy.stripe.com/test_zzz' }] })),
    });
    expect(details).toBeUndefined();
  });

  it('returns undefined on API errors instead of throwing', async () => {
    const details = await fetchPaymentLinkDetailsByUrl({
      apiKey: 'sk_test_x',
      linkUrl: LINK_URL,
      fetchImpl: () => Promise.resolve(jsonResponse({ error: { message: 'invalid key' } }, false, 401)),
    });
    expect(details).toBeUndefined();
  });

  it('returns undefined when the network itself fails', async () => {
    const details = await fetchPaymentLinkDetailsByUrl({
      apiKey: 'sk_test_x',
      linkUrl: LINK_URL,
      fetchImpl: () => Promise.reject(new Error('offline')),
    });
    expect(details).toBeUndefined();
  });
});
