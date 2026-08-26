/**
 * Payment Link price detection: given a buy.stripe.com URL and a secret
 * key, resolve the exact amount/currency through the official Stripe API.
 *
 * Why not scrape buy.stripe.com? The hosted page embeds no pricing data;
 * it fetches it client-side via internal payment_pages endpoints that
 * create checkout-session objects per lookup — undocumented, side-effectful
 * and unstable. With a key we use documented APIs only.
 */

import type { LinkFetchLike } from './stripe-links.js';

export interface PaymentLinkDetails {
  /** Major units (e.g. dollars), converted from Stripe's minor units. */
  amount: number;
  /** ISO currency, uppercase (e.g. USD). */
  currency: string;
  recurring?: { interval: 'month' | 'year' };
}

interface StripeListResponse<T> {
  data?: T[];
  has_more?: boolean;
  error?: { message?: string };
}

interface StripePaymentLink {
  id?: string;
  url?: string;
  active?: boolean;
}

interface StripeLineItemPage {
  data?: Array<{
    price?: {
      unit_amount?: number | null;
      currency?: string;
      type?: 'one_time' | 'recurring';
      recurring?: { interval?: string | null } | null;
    } | null;
  }>;
}

const MAX_PAGES = 5;

/**
 * Finds the Payment Link whose public URL matches `linkUrl` and returns its
 * first line item's price. Undefined when the key cannot see such a link
 * (different account/mode) or the API fails — callers fall back to asking.
 */
export async function fetchPaymentLinkDetailsByUrl(input: {
  apiKey: string;
  linkUrl: string;
  fetchImpl?: LinkFetchLike;
}): Promise<PaymentLinkDetails | undefined> {
  const doFetch = input.fetchImpl ?? ((url, init) =>
    // SAFETY: headers shape matches RequestInit.
    fetch(url, init as RequestInit).then((res) => ({ ok: res.ok, status: res.status, json: () => res.json() })));

  const headers = { Authorization: `Bearer ${input.apiKey}` };

  let linkId: string | undefined;
  let startingAfter: string | undefined;
  for (let page = 0; page < MAX_PAGES && linkId === undefined; page += 1) {
    const query = new URLSearchParams({ limit: '100', active: 'true' });
    if (startingAfter !== undefined) query.set('starting_after', startingAfter);
    let body: StripeListResponse<StripePaymentLink>;
    try {
      const res = await doFetch(`https://api.stripe.com/v1/payment_links?${query.toString()}`, { headers });
      body = (await res.json()) as StripeListResponse<StripePaymentLink>;
    } catch {
      return undefined;
    }
    if (body.error !== undefined || body.data === undefined) return undefined;

    for (const link of body.data) {
      if (link.url === input.linkUrl && typeof link.id === 'string') {
        linkId = link.id;
        break;
      }
    }
    if (linkId === undefined && body.has_more === true && body.data.length > 0) {
      const last = body.data[body.data.length - 1];
      if (last?.id !== undefined) startingAfter = last.id;
    }
  }
  if (linkId === undefined) return undefined;

  let items: StripeListResponse<NonNullable<StripeLineItemPage['data']>[number]>;
  try {
    const res = await doFetch(
      `https://api.stripe.com/v1/payment_links/${encodeURIComponent(linkId)}/line_items`,
      { headers },
    );
    items = (await res.json()) as StripeListResponse<NonNullable<StripeLineItemPage['data']>[number]>;
  } catch {
    return undefined;
  }

  const first = items.data?.[0];
  const price = first?.price;
  if (price?.unit_amount === undefined || price.unit_amount === null || price.currency === undefined) {
    return undefined;
  }

  return {
    amount: price.unit_amount / 100,
    currency: price.currency.toUpperCase(),
    ...(price.type === 'recurring' && (price.recurring?.interval === 'month' || price.recurring?.interval === 'year')
      ? { recurring: { interval: price.recurring.interval } }
      : {}),
  };
}
