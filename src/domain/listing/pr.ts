/**
 * Listing publication PR payload (spec §3, D13, D16).
 *
 * HARD ARCHITECTURAL INVARIANT: the Listing charges only for DISCOVERY.
 * The PR carries the seller's /sell pointer for INDEPENDENT verification —
 * never the seller's price, never a listing-created seller link.
 *
 * The PR contains the minimum needed for Listing CI to verify the product
 * against the seller's live /sell; authoritative data is always fetched
 * from the seller, never trusted from the PR body (D13).
 */

import { parseVersion } from '../release/version.js';
import { PaymentLinkInvalidError, PaymentLinkMissingError, validatePaymentLink } from '../../domain/payment/link.js';

export const LISTING_PR_SCHEMA = 'reposell-listing/v1';

export interface ListingPrPayload {
  schema: typeof LISTING_PR_SCHEMA;
  repository: {
    url: string;
    owner: string;
    name: string;
  };
  release: {
    version: string;
    commit?: string;
  };
  sell: {
    url: string;
    payment_link: string;
  };
  listing: {
    discovery_price: {
      amount: number;
      currency: string;
    };
  };
}

export interface PrValidationIssue {
  field: string;
  issue: string;
}

export interface PrValidationResult {
  ok: boolean;
  issues: PrValidationIssue[];
}

function httpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Fail-closed validation of an untrusted PR payload. Every missing or
 * invalid field is reported; the caller must BLOCK on any issue (§4).
 */
export function validateListingPr(input: unknown): PrValidationResult {
  const issues: PrValidationIssue[] = [];
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, issues: [{ field: 'payload', issue: 'expected JSON object' }] };
  }
  // SAFETY: shape checked above; fields validated individually below.
  const raw = input as Record<string, unknown>;

  if (raw['schema'] !== LISTING_PR_SCHEMA) {
    issues.push({ field: 'schema', issue: `expected "${LISTING_PR_SCHEMA}"` });
  }

  // repository
  const repository = raw['repository'];
  if (typeof repository !== 'object' || repository === null) {
    issues.push({ field: 'repository', issue: 'missing' });
  } else {
    // SAFETY: shape checked above.
    const repo = repository as Record<string, unknown>;
    if (!httpsUrl(repo['url'])) issues.push({ field: 'repository.url', issue: 'must be an https URL' });
    if (typeof repo['owner'] !== 'string' || repo['owner'].length === 0) {
      issues.push({ field: 'repository.owner', issue: 'missing' });
    }
    if (typeof repo['name'] !== 'string' || repo['name'].length === 0) {
      issues.push({ field: 'repository.name', issue: 'missing' });
    }
  }

  // release
  const release = raw['release'];
  if (typeof release !== 'object' || release === null) {
    issues.push({ field: 'release', issue: 'missing' });
  } else {
    // SAFETY: shape checked above.
    const rel = release as Record<string, unknown>;
    if (typeof rel['version'] !== 'string' || parseVersion(rel['version']) === undefined) {
      issues.push({ field: 'release.version', issue: 'must be vMAJOR.MINOR.PATCH' });
    }
  }

  // sell — the seller's OWN link, verified-only
  const sell = raw['sell'];
  if (typeof sell !== 'object' || sell === null) {
    issues.push({ field: 'sell', issue: 'missing' });
  } else {
    // SAFETY: shape checked above.
    const sellRecord = sell as Record<string, unknown>;
    if (!httpsUrl(sellRecord['url'])) {
      issues.push({ field: 'sell.url', issue: 'must be an https URL' });
    }
    try {
      validatePaymentLink(typeof sellRecord['payment_link'] === 'string' ? sellRecord['payment_link'] : undefined);
    } catch (error) {
      const message = error instanceof PaymentLinkMissingError || error instanceof PaymentLinkInvalidError
        ? error.message
        : 'could not be validated';
      issues.push({ field: 'sell.payment_link', issue: message });
    }
  }

  // listing discovery price — the Listing's OWN product
  const listing = raw['listing'];
  if (typeof listing !== 'object' || listing === null) {
    issues.push({ field: 'listing', issue: 'missing' });
  } else {
    // SAFETY: shape checked above.
    const listingRecord = listing as Record<string, unknown>;
    const price = listingRecord['discovery_price'];
    if (typeof price !== 'object' || price === null) {
      issues.push({ field: 'listing.discovery_price', issue: 'missing' });
    } else {
      // SAFETY: shape checked above.
      const priceRecord = price as Record<string, unknown>;
      if (typeof priceRecord['amount'] !== 'number' || !Number.isFinite(priceRecord['amount']) || priceRecord['amount'] <= 0) {
        issues.push({ field: 'listing.discovery_price.amount', issue: 'must be a positive number' });
      }
      if (typeof priceRecord['currency'] !== 'string' || priceRecord['currency'].length !== 3) {
        issues.push({ field: 'listing.discovery_price.currency', issue: 'must be a 3-letter code' });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Builds a PR payload from verified inputs. Seller price is NOT an input. */
export function buildListingPr(input: {
  repositoryUrl: string;
  owner: string;
  repo: string;
  version: string;
  commit?: string;
  sellUrl: string;
  sellerPaymentLink: string;
  discoveryPrice: { amount: number; currency: string };
}): ListingPrPayload {
  return {
    schema: LISTING_PR_SCHEMA,
    repository: {
      url: input.repositoryUrl,
      owner: input.owner,
      name: input.repo,
    },
    release: {
      version: input.version,
      ...(input.commit !== undefined ? { commit: input.commit } : {}),
    },
    sell: {
      url: input.sellUrl,
      payment_link: input.sellerPaymentLink,
    },
    listing: {
      discovery_price: {
        amount: input.discoveryPrice.amount,
        currency: input.discoveryPrice.currency,
      },
    },
  };
}
