import { describe, expect, it } from 'vitest';

import { sessionsToPurchases, syncSell, type StripeSession } from './sync.js';
import { buildPurchaseArtifact, purchaseArtifactJson, revocationMarker } from './provision.js';

function session(overrides: Partial<StripeSession> = {}): StripeSession {
  return {
    id: 'cs_test_1',
    payment_status: 'paid',
    payment_intent: 'pi_1',
    customer_details: { email: 'buyer@example.com' },
    metadata: { release: 'v1.2.0', scheme: 'standard' },
    ...overrides,
  };
}

describe('sell sync (§13, D7)', () => {
  it('maps paid sessions to purchase records with release + scheme', () => {
    const result = sessionsToPurchases([session()]);
    expect(result.purchased).toHaveLength(1);
    expect(result.purchased[0]).toMatchObject({
      session: 'cs_test_1',
      buyerEmail: 'buyer@example.com',
      release: 'v1.2.0',
      scheme: 'standard',
      status: 'paid',
    });
  });

  it('flags refunded sessions for revocation', () => {
    const result = sessionsToPurchases([session({ payment_status: 'refunded' })]);
    expect(result.refunded).toHaveLength(1);
    expect(result.purchased).toHaveLength(0);
  });

  it('pulls from the SELLER Stripe account with the seller key', async () => {
    let authHeader = '';
    let url = '';
    const result = await syncSell({
      apiKey: 'sk_test_SELLER',
      paymentLinkId: 'plink_seller',
      fetchImpl: async (requestUrl, init) => {
        url = requestUrl;
        authHeader = init.headers['Authorization'];
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [session()] }),
        };
      },
    });
    expect(result.purchased).toHaveLength(1);
    expect(authHeader).toBe('Bearer sk_test_SELLER');
    expect(url).toContain('payment_link=plink_seller');
  });
});

describe('fork provisioning artifacts (§14)', () => {
  const facts = {
    buyer: 'buyer-dev',
    buyerEmail: 'buyer@example.com',
    repository: 'seller/project',
    release: 'v1.2.0',
    scheme: 'standard',
    amount: 29,
    currency: 'USD',
    session: 'cs_test_1',
    paymentIntent: 'pi_1',
  };

  it('binds buyer + repo + release + scheme + session deterministically', () => {
    const a = buildPurchaseArtifact(facts);
    const b = buildPurchaseArtifact(facts);
    expect(a).toEqual(b);
    expect(a.entitlement.licensed_fork).toBe('buyer-dev/project');
    expect(a.fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('different sessions produce different fingerprints', () => {
    const a = buildPurchaseArtifact(facts);
    const b = buildPurchaseArtifact({ ...facts, session: 'cs_test_2' });
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });

  it('renders signable json and revocation keeps history', () => {
    const artifact = buildPurchaseArtifact(facts);
    expect(purchaseArtifactJson(artifact)).toContain('"schema": "reposell/purchase/v1"');
    const revoked = revocationMarker(artifact, 'refund issued');
    expect(revoked).toContain('REVOKED: refund issued');
    expect(revoked).toContain('reposell/purchase/v1');
  });
});
