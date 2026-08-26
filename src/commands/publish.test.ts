import { describe, it, expect } from 'vitest';
import { publishCandidates } from './publish.js';

describe('publishCandidates', () => {
  it('orders drafts first, then already-published releases', () => {
    const ordered = publishCandidates(['v0.1.0', 'v0.2.0', 'v0.3.0'], (tag) => tag !== 'v0.2.0');
    expect(ordered).toEqual(['v0.1.0', 'v0.3.0', 'v0.2.0']);
  });

  it('keeps stable order within each group', () => {
    const ordered = publishCandidates(['v3', 'v1', 'v2'], () => true);
    expect(ordered).toEqual(['v3', 'v1', 'v2']);
  });
});

describe('listing record derivation', () => {
  it('maps a verified /sell document onto the canonical registry record', async () => {
    const { recordFromSellDocument, listingIdFor } = await import('../app/listing-announcer.js');
    const data = {
      schema: 'reposell/sell-page/v1',
      repository: 'acme/tool',
      releases: [
        { version: 'v0.0.9', status: 'blocked', offers: [] },
        {
          version: 'v0.1.0',
          status: 'available',
          offers: [{ paymentLink: 'https://buy.stripe.com/test_link', price: 29, currency: 'USD' }],
        },
      ],
      listing: { contribution: { amount: 5, currency: 'usd' } },
    };
    const record = recordFromSellDocument(data, {
      sellUrl: 'https://acme.github.io/tool/sell/',
      requestedRelease: 'v0.1.0',
    });
    expect(record.schema).toBe('reposell-listing-record/v1');
    expect(record.product).toEqual({ repository: 'acme/tool', release: 'v0.1.0' });
    expect(record.seller).toEqual({
      sell_url: 'https://acme.github.io/tool/sell/',
      payment_link: 'https://buy.stripe.com/test_link',
    });
    expect(record.listing.discovery_price).toEqual({ amount: 5, currency: 'USD' });
    // Stable identity: same repo → same lst_ id.
    expect(listingIdFor('acme/tool')).toBe(listingIdFor(' ACME/tool '));
    expect(record.id.startsWith('lst_')).toBe(true);
  });

  it('rejects /sell documents that fail-closed checks', async () => {
    const { recordFromSellDocument } = await import('../app/listing-announcer.js');
    expect(() =>
      recordFromSellDocument(
        {
          schema: 'reposell/sell-page/v1',
          repository: 'acme/tool',
          releases: [{ version: 'v0.1.0', status: 'available', offers: [{ price: 29 }] }],
        },
        { sellUrl: 'https://x/sell/' },
      ),
    ).toThrow(/Payment Link/);
  });
});
