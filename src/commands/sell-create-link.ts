/**
 * `reposell sell create-link` — creates a Stripe Payment Link with the
 * correct redirect URL (back to /sell with ?session_id) so buyers are
 * returned to the seller's storefront after payment instead of a dead end.
 *
 * Requires REPOSELL_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY in env/.env.
 */

import { loadEnvSource, resolveValue, type EnvSource } from '../utils/env.js';
import { detectGitInfo } from '../utils/git.js';

export interface CreateLinkOptions {
  productName?: string;
  price: number;
  currency?: string;
  successUrl?: string;

}

export interface CreateLinkResult {
  url: string;
  id: string;
  active: boolean;
  /** The success redirect URL baked into the link. */
  successUrl: string;
}

function resolveKey(env: EnvSource): string {
  const key =
    resolveValue(env, 'REPOSELL_STRIPE_SECRET_KEY') ?? resolveValue(env, 'STRIPE_SECRET_KEY');
  if (key === undefined || !key.startsWith('sk_')) {
    throw new Error(
      'Stripe secret key not found. Set REPOSELL_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY in .env or environment.',
    );
  }
  return key;
}

/**
 * Build the `after_completion` redirect URL for the Payment Link.
 * Returns the /sell page URL with a `session_id` query param placeholder
 * that Stripe fills at checkout time.
 */
function buildSuccessUrl(sellPageUrl: string): string {
  // Stripe replaces {CHECKOUT_SESSION_ID} with the actual session ID.
  return `${sellPageUrl}?session_id={CHECKOUT_SESSION_ID}`;
}

export async function createPaymentLink(
  cwd: string,
  options: CreateLinkOptions,
): Promise<CreateLinkResult> {
  const env = await loadEnvSource(cwd, process.env, async (filePath) => {
    try {
      const { readFile } = await import('node:fs/promises');
      return await readFile(filePath, 'utf8');
    } catch {
      return undefined;
    }
  });
  const apiKey = resolveKey(env);

  // Detect the GitHub Pages URL for the /sell page redirect
  let sellPageUrl: string;
  if (options.successUrl !== undefined) {
    sellPageUrl = options.successUrl;
  } else {
    const gitInfo = await detectGitInfo(cwd, 'github');
    // Default: GitHub Pages URL. User can override with --success-url.
    sellPageUrl = `https://${gitInfo.owner}.github.io/${gitInfo.repo}/sell/`;
  }

  const productName = options.productName ?? 'repository';
  const currency = (options.currency ?? 'USD').toUpperCase();
  const amountCents = Math.round(options.price * 100);

  // Stripe API requires form-encoded POST body — use fetch with body
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' };

  // Step 1: Create a Price — first resolve tax code from Stripe
  let taxCode: string | undefined;
  try {
    const taxRes = await fetch('https://api.stripe.com/v1/tax_codes?limit=250', { headers });
    const taxData = (await taxRes.json()) as Record<string, unknown>;
    const taxList = taxData['data'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(taxList)) {
      // Find a suitable digital product / software tax code
      const preferred = taxList.find((t) => {
        const name = String(t['name'] ?? '').toLowerCase();
        const id = String(t['id'] ?? '');
        return id === 'txcd_10103001' || name.includes('software') || name.includes('saas');
      });
      taxCode = (preferred?.['id'] as string) ?? taxList[0]?.['id'] as string | undefined;
    }
  } catch {
    // Tax code is optional — Stripe may not have them configured
  }

  const priceParams = new URLSearchParams();
  priceParams.set('unit_amount', String(amountCents));
  priceParams.set('currency', currency);
  priceParams.set('product_data[name]', productName);
  if (taxCode !== undefined) {
    priceParams.set('product_data[tax_code]', taxCode);
  }

  const priceRes = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers,
    body: priceParams.toString(),
  });
  const priceData = (await priceRes.json()) as Record<string, unknown>;
  if (priceData['error'] !== undefined) {
    const err = priceData['error'] as Record<string, string>;
    throw new Error(`Stripe price creation failed: ${err['message'] ?? String(priceData['error'])}`);
  }
  const priceId = priceData['id'] as string;

  // Step 2: Create a Payment Link with the price
  const linkParams = new URLSearchParams();
  linkParams.set('line_items[0][price]', priceId);
  linkParams.set('line_items[0][quantity]', '1');
  linkParams.set('after_completion[type]', 'redirect');
  linkParams.set('after_completion[redirect][url]', buildSuccessUrl(sellPageUrl));
  linkParams.set('metadata[product]', productName);
  linkParams.set('metadata[protocol]', 'reposell');
  // Disable Stripe Managed Payments (requires tax_code which most digital
  // product sellers don't configure). Tax remains the seller's responsibility.
  linkParams.set('allow_promotion_codes', 'false');

  const linkRes = await fetch('https://api.stripe.com/v1/payment_links', {
    method: 'POST',
    headers,
    body: linkParams.toString(),
  });
  const linkData = (await linkRes.json()) as Record<string, unknown>;
  if (linkData['error'] !== undefined) {
    const err = linkData['error'] as Record<string, string>;
    throw new Error(`Stripe payment link creation failed: ${err['message'] ?? String(linkData['error'])}`);
  }

  return {
    url: linkData['url'] as string,
    id: linkData['id'] as string,
    active: linkData['active'] as boolean,
    successUrl: buildSuccessUrl(sellPageUrl),
  };
}
