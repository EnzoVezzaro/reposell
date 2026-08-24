/**
 * `reposell sell sync` (spec §13-§14, D7): pull-based fulfillment from the
 * SELLER'S OWN Stripe account. No servers, no webhooks — the CLI polls
 * checkout sessions, records purchases, and detects refunds.
 *
 * INVARIANT: everything here operates on the seller's transactions only.
 * The Listing's discovery payments live in a different Stripe account and
 * are invisible to this flow.
 */

export interface StripeSession {
  id: string;
  payment_status?: string;
  payment_intent?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string>;
}

export interface StripeFetchLike {
  (url: string, init: { headers: Record<string, string> }): Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }>;
}

export class SellSyncKeyError extends Error {
  constructor() {
    super('Stripe secret key not configured — set REPOSELL_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY');
    this.name = 'SellSyncKeyError';
  }
}

export const DEFAULT_SYNC_FETCH: StripeFetchLike = (url, init) =>
  // SAFETY: init.headers is structurally identical to RequestInit headers.
  fetch(url, init as RequestInit).then((res) => ({
    ok: res.ok,
    status: res.status,
    json: () => res.json(),
  }));

async function listSessions(input: {
  apiKey: string;
  fetchImpl?: StripeFetchLike;
  paymentLinkId?: string;
}): Promise<StripeSession[]> {
  const doFetch = input.fetchImpl ?? DEFAULT_SYNC_FETCH;
  const query =
    input.paymentLinkId !== undefined
      ? `?payment_link=${encodeURIComponent(input.paymentLinkId)}&limit=100`
      : '?limit=100';
  const res = await doFetch(`https://api.stripe.com/v1/checkout/sessions${query}`, {
    headers: { Authorization: `Bearer ${input.apiKey}` },
  });
  const body = (await res.json()) as { data?: StripeSession[]; error?: { message?: string } };
  if (!res.ok || body.error !== undefined) {
    throw new Error(`Stripe checkout sessions failed: ${body.error?.message ?? `HTTP ${res.status}`}`);
  }
  return body.data ?? [];
}

export interface PurchaseRecord {
  session: string;
  paymentIntent?: string;
  buyerEmail?: string;
  status: 'paid' | 'refunded';
  release?: string;
  scheme?: string;
}

export interface SyncResult {
  purchased: PurchaseRecord[];
  refunded: PurchaseRecord[];
  unchanged: number;
}

/** Maps live checkout sessions to purchase records, detecting refunds. */
export function sessionsToPurchases(sessions: StripeSession[]): SyncResult {
  const purchased: PurchaseRecord[] = [];
  const refunded: PurchaseRecord[] = [];
  let unchanged = 0;
  for (const session of sessions) {
    const status = session.payment_status === 'refunded' ? 'refunded' : 'paid';
    const record: PurchaseRecord = {
      session: session.id,
      ...(session.payment_intent !== undefined && session.payment_intent !== null
        ? { paymentIntent: session.payment_intent }
        : {}),
      ...(session.customer_details?.email !== undefined && session.customer_details.email !== null
        ? { buyerEmail: session.customer_details.email }
        : {}),
      status,
      ...(session.metadata !== undefined && session.metadata['release'] !== undefined ? { release: session.metadata['release'] } : {}),
      ...(session.metadata !== undefined && session.metadata['scheme'] !== undefined ? { scheme: session.metadata['scheme'] } : {}),
    };
    if (status === 'refunded') refunded.push(record);
    else purchased.push(record);
    void unchanged;
  }
  return { purchased, refunded, unchanged };
}

/**
 * Full sync: list paid/refunded sessions and return the records to persist.
 * The caller writes `.reposell/purchases/` and regenerates fork artifacts.
 */
export async function syncSell(input: {
  apiKey: string;
  fetchImpl?: StripeFetchLike;
  paymentLinkId?: string;
}): Promise<SyncResult> {
  const sessions = await listSessions(input);
  return sessionsToPurchases(sessions);
}
