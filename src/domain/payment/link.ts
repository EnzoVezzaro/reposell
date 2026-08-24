/**
 * Structural Payment Link validation (spec §34). A release cannot be
 * published without a Payment Link that is HTTPS, on a Stripe domain, and
 * structurally sound. The system never guesses.
 */

export class PaymentLinkMissingError extends Error {
  readonly code = 'PAYMENT_LINK_MISSING';
  constructor() {
    super('Payment link missing. Every release must declare a Stripe Payment Link.');
    this.name = 'PaymentLinkMissingError';
  }
}

export class PaymentLinkInvalidError extends Error {
  readonly code = 'PAYMENT_LINK_INVALID';
  readonly reason: string;
  constructor(reason: string) {
    super(`Payment link invalid: ${reason}`);
    this.name = 'PaymentLinkInvalidError';
    this.reason = reason;
  }
}

const STRIPE_LINK_HOSTS = new Set(['buy.stripe.com', 'checkout.stripe.com']);

function isStripeLinkHost(host: string): boolean {
  if (STRIPE_LINK_HOSTS.has(host)) return true;
  // Allow additional stripe.com subdomains (e.g. regional checkout hosts).
  return host.endsWith('.stripe.com');
}

export interface ValidatedPaymentLink {
  url: URL;
  host: string;
}

/**
 * Structural validation only. Deep amount/currency verification against the
 * Stripe API lives in stripe-links.ts and runs when credentials permit.
 */
export function validatePaymentLink(rawLink: string | undefined): ValidatedPaymentLink {
  if (rawLink === undefined || rawLink.trim().length === 0) {
    throw new PaymentLinkMissingError();
  }
  let url: URL;
  try {
    url = new URL(rawLink.trim());
  } catch {
    throw new PaymentLinkInvalidError('not a valid URL');
  }
  if (url.protocol !== 'https:') {
    throw new PaymentLinkInvalidError('must use HTTPS');
  }
  if (!isStripeLinkHost(url.hostname.toLowerCase())) {
    throw new PaymentLinkInvalidError(`host "${url.hostname}" is not a Stripe domain`);
  }
  return { url, host: url.hostname.toLowerCase() };
}
