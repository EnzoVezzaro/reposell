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

describe('listing request derivation', () => {
  it('builds the pointer-only request the listing PR carries', async () => {
    const { requestFromPayload, listingRequestPath } = await import('../app/listing-pr-submitter.js');
    const payload = {
      schema: 'reposell-listing/v1' as const,
      repository: { url: 'https://github.com/acme/tool', owner: 'acme', name: 'tool' },
      release: { version: 'v0.1.0' },
      sell: {
        url: 'https://acme.github.io/tool/sell/',
        payment_link: 'https://buy.stripe.com/test_link',
      },
      listing: { discovery_price: { amount: 5, currency: 'USD' } },
    };
    // Pointer-only: no seller data travels through the PR.
    expect(requestFromPayload(payload)).toEqual({
      schema: 'reposell-listing-request/v1',
      repository: 'acme/tool',
      release: 'v0.1.0',
      sell_url: 'https://acme.github.io/tool/sell/',
    });
    expect(listingRequestPath(payload)).toBe('listing/acme-tool-v0.1.0.request.json');
  });
});
