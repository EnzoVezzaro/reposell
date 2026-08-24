/**
 * Offer resolution (licensing × release): joins a release's declared offers
 * with the reusable license schemes they reference. Pure — the publication
 * gates, the evaluator and the build all consume the resolved form.
 */

import type { LicensingScheme, ReleaseDefinition } from '../../config/index.js';

export interface ResolvedOffer {
  scheme: string;
  name: string;
  billing: 'one-time' | 'recurring';
  interval?: 'month' | 'year';
  seats?: number;
  template?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  paymentLink?: string;
  paymentLinkId?: string;
}

export interface OfferResolution {
  offers: ResolvedOffer[];
  issues: string[];
}

function schemeName(id: string, scheme: LicensingScheme): string {
  return scheme.name ?? id;
}

/**
 * Resolves every declared offer against the scheme table. Issues:
 * unknown scheme ids, missing schemes section, recurring scheme with a
 * one-time interval mismatch. Offers without a scheme id are rejected.
 */
export function resolveOffers(input: {
  definition: ReleaseDefinition;
  schemes: Record<string, LicensingScheme> | undefined;
}): OfferResolution {
  const issues: string[] = [];
  const offers: ResolvedOffer[] = [];
  const declared = input.definition.offers ?? [];

  if (input.schemes === undefined || Object.keys(input.schemes).length === 0) {
    issues.push('licensing.schemes is not configured — offers cannot resolve (run `reposell license compose` or add schemes to reposell.yml)');
  }

  for (const [index, offer] of declared.entries()) {
    const path = `offers[${index}]`;
    if (offer.scheme === undefined) {
      issues.push(`${path}: scheme is required`);
      continue;
    }
    const scheme = input.schemes?.[offer.scheme];
    if (scheme === undefined) {
      issues.push(`${path}: unknown scheme "${offer.scheme}"`);
      continue;
    }
    const billing = scheme.billing ?? 'one-time';
    if (billing === 'recurring' && scheme.interval === undefined) {
      issues.push(`${path}: scheme "${offer.scheme}" is recurring but has no interval`);
      continue;
    }
    offers.push({
      scheme: offer.scheme,
      name: schemeName(offer.scheme, scheme),
      billing,
      ...(scheme.interval !== undefined ? { interval: scheme.interval } : {}),
      ...(scheme.seats !== undefined ? { seats: scheme.seats } : {}),
      ...(scheme.template !== undefined ? { template: scheme.template } : {}),
      ...(offer.pricing?.amount !== undefined ? { amount: offer.pricing.amount } : {}),
      ...(offer.pricing?.currency !== undefined ? { currency: offer.pricing.currency } : {}),
      ...(offer.payment?.provider !== undefined ? { provider: offer.payment.provider } : {}),
      ...(offer.payment?.payment_link !== undefined ? { paymentLink: offer.payment.payment_link } : {}),
      ...(offer.payment?.payment_link_id !== undefined ? { paymentLinkId: offer.payment.payment_link_id } : {}),
    });
  }

  return { offers, issues };
}
