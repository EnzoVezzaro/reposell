/**
 * Deep Payment Link verification against the Stripe API (spec §7, §35):
 * manifest price == Stripe checkout price. Runs only when a secret key and
 * the Payment Link id (plink_…) are configured; otherwise unverifiable.
 */

export interface HttpResultLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}


export interface LinkFetchLike {
  (url: string, init: { headers: Record<string, string> }): Promise<HttpResultLike>;
}

export const DEFAULT_LINK_FETCH: LinkFetchLike = (url, init) =>
  // SAFETY: FetchLike headers are structurally identical to RequestInit headers.
  fetch(url, init as RequestInit).then((res) => ({
    ok: res.ok,
    status: res.status,
    json: () => res.json(),
  }));

interface StripePrice {
  unit_amount?: number | null;
  currency?: string;
  type?: 'one_time' | 'recurring';
  recurring?: { interval?: string | null } | null;
}

interface StripePaymentLinkResponse {
  active?: boolean;
  line_items?: {
    data?: Array<{ price?: StripePrice | null; price_object?: StripePrice | null }>;
  };
  error?: { message?: string };
}

export type DeepLinkStatus =
  | 'verified'
  | 'mismatch'
  | 'inactive'
  | 'not_found'
  | 'api_error'
  | 'unverifiable';

export interface DeepLinkResult {
  status: DeepLinkStatus;
  detail?: string;
}

function priceFromItem(item: { price?: StripePrice | null; price_object?: StripePrice | null }): StripePrice | undefined {
  return item.price ?? item.price_object ?? undefined;
}

/**
 * Verifies that the Stripe Payment Link charges exactly the declared
 * pricing. Requires `paymentLinkId`; without it the check is unverifiable
 * (structural validation in link.ts still applies).
 */
export interface OfferPricing {
  amount: number;
  currency: string;
  billing?: 'one-time' | 'recurring';
  interval?: 'month' | 'year';
}

export async function verifyPaymentLinkAgainstPricing(input: {
  apiKey: string;
  paymentLinkId: string;
  pricing: OfferPricing;
  fetchImpl?: LinkFetchLike;
}): Promise<DeepLinkResult> {
  const doFetch = input.fetchImpl ?? DEFAULT_LINK_FETCH;
  const url =
    'https://api.stripe.com/v1/payment_links/' +
    encodeURIComponent(input.paymentLinkId) +
    '?expand[]=line_items.data.price';

  let res: HttpResultLike;
  try {
    res = await doFetch(url, { headers: { Authorization: `Bearer ${input.apiKey}` } });
  } catch (error) {
    return {
      status: 'api_error',
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  // SAFETY: network JSON is projected onto the documented Payment Link schema
  // and every consumed field passes guards before use.
  const body = (await res.json()) as StripePaymentLinkResponse;

  if (!res.ok || body.error !== undefined) {
    if (res.status === 404) return { status: 'not_found' };
    return {
      status: 'api_error',
      detail: body.error?.message ?? `HTTP ${res.status}`,
    };
  }
  if (body.active === false) {
    return { status: 'inactive' };
  }

  const items = body.line_items?.data ?? [];
  const first = items[0];
  if (first === undefined) {
    return { status: 'mismatch', detail: 'Payment Link has no line items' };
  }
  const price = priceFromItem(first);
  if (price?.unit_amount === undefined || price.unit_amount === null) {
    return { status: 'mismatch', detail: 'Payment Link price has no amount' };
  }

  const expectedCents = Math.round(input.pricing.amount * 100);
  if (price.unit_amount !== expectedCents) {
    return {
      status: 'mismatch',
      detail: `Stripe charges ${(price.unit_amount / 100).toFixed(2)} but manifest declares ${input.pricing.amount.toFixed(2)}`,
    };
  }
  const declaredCurrency = input.pricing.currency.toLowerCase();
  if (price.currency !== undefined && price.currency.toLowerCase() !== declaredCurrency) {
    return {
      status: 'mismatch',
      detail: `Stripe currency "${price.currency}" != manifest currency "${declaredCurrency}"`,
    };
  }

  // Billing-mode authority (§18): recurring schemes must point at a
  // recurring price with the declared interval; one-time at a one_time price.
  if (input.pricing.billing === 'recurring') {
    if (price.type !== undefined && price.type !== 'recurring') {
      return { status: 'mismatch', detail: `scheme is recurring but Stripe price type is "${price.type}"` };
    }
    const expectedInterval = input.pricing.interval ?? 'month';
    const actualInterval = price.recurring?.interval ?? undefined;
    if (actualInterval !== undefined && actualInterval !== expectedInterval) {
      return {
        status: 'mismatch',
        detail: `Stripe bills per-${actualInterval} but scheme declares per-${expectedInterval}`,
      };
    }
  } else if (price.type === 'recurring') {
    return { status: 'mismatch', detail: 'scheme is one-time but Stripe price is recurring' };
  }

  return { status: 'verified' };
}
