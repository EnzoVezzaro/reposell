/**
 * Publication gate checklist (spec §8). A release is not published until all
 * mandatory gates pass for EVERY offer. Any failure BLOCKs the release —
 * never "partially published", never "available without payment" (spec §52).
 */

import { PaymentLinkInvalidError, PaymentLinkMissingError, validatePaymentLink } from '../domain/payment/link.js';
import { parseVersion } from '../domain/release/version.js';
import type { ReleaseDefinition } from '../config/index.js';
import { resolveOffers, type ResolvedOffer } from '../domain/licensing/schemes.js';

export type GateName =
  | 'manifest'
  | 'release'
  | 'pricing'
  | 'currency'
  | 'payment-provider'
  | 'payment-link'
  | 'license';

export interface GateOutcome {
  passed: boolean;
  failures: string[];
  warnings: string[];
  /** Resolved offers that passed structural validation (for deep checks/pages). */
  offers: ResolvedOffer[];
}

export interface GateInput {
  tag: string;
  definition: ReleaseDefinition;
  licenseMode: 'ok' | 'missing' | 'unrecognized';
  schemes?: Record<string, import('../config/index.js').LicensingScheme>;
}

const SUPPORTED_PROVIDERS: readonly string[] = ['stripe'];

/**
 * Runs the full checklist for one release. Deterministic: no network access
 * here — deep Stripe verification is a separate opt-in step.
 */
export function runPublicationGates(input: GateInput): GateOutcome {
  const failures: string[] = [];
  const warnings: string[] = [];

  const parsed = parseVersion(input.tag);
  if (parsed === undefined) {
    failures.push(`release "${input.tag}" is not a valid version (expected vMAJOR.MINOR.PATCH)`);
  }

  const resolution = resolveOffers({ definition: input.definition, schemes: input.schemes });
  for (const issue of resolution.issues) failures.push(issue);

  const validOffers: ResolvedOffer[] = [];
  for (const [index, offer] of resolution.offers.entries()) {
    const path = `offers[${index}] (${offer.scheme})`;

    const amount = offer.amount;
    if (amount === undefined || !Number.isFinite(amount) || amount <= 0) {
      failures.push(`${path}: price not defined or non-positive`);
    }

    const currency = offer.currency;
    if (currency === undefined || currency.length !== 3) {
      failures.push(`${path}: currency not defined as a 3-letter ISO code`);
    }

    const provider = offer.provider;
    if (provider === undefined || provider.trim().length === 0) {
      failures.push(`${path}: payment provider not defined`);
    } else if (!SUPPORTED_PROVIDERS.includes(provider.toLowerCase())) {
      failures.push(`${path}: unsupported payment provider "${provider}" (supported: ${SUPPORTED_PROVIDERS.join(', ')})`);
    }

    let linkOk = false;
    try {
      validatePaymentLink(offer.paymentLink);
      linkOk = true;
    } catch (error) {
      if (error instanceof PaymentLinkMissingError || error instanceof PaymentLinkInvalidError) {
        failures.push(`${path}: ${error.message}`);
      } else {
        failures.push(`${path}: payment link could not be validated`);
      }
    }

    if (linkOk && amount !== undefined && currency !== undefined && provider !== undefined) {
      validOffers.push(offer);
    }
  }

  if (input.licenseMode === 'missing') {
    failures.push('license configuration invalid: no license found (run `reposell license use rsl`)');
  } else if (input.licenseMode === 'unrecognized') {
    warnings.push('license text is unrecognized — verify terms before selling');
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
    offers: validOffers,
  };
}
