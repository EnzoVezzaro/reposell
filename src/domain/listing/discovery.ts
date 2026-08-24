/**
 * Listing discovery payment metadata (spec §6, §7, D16).
 *
 * INVARIANTS ENFORCED HERE, NOT MERELY DESCRIBED:
 * 1. The input type carries NO seller fields — a discovery link can only be
 *    created from discovery inputs. There is no code path from a seller
 *    payment link or seller price into this module.
 * 2. Metadata marks the transaction `purpose: "discovery"` so Stripe records
 *    can never be confused with a software purchase.
 * 3. Discovery links are per-release and immutable (D16): the builder is
 *    deterministic; changing a release changes the link, old ones stand.
 */

export interface DiscoveryLinkInput {
  /** Listing-side repository slug the discovery entitlement unlocks. */
  repository: string;
  /** Release the discovery entitlement is bound to. */
  release: string;
  /** The Listing's OWN price for discovery access. */
  amount: number;
  currency: string;
}

export interface DiscoveryLinkMetadata {
  purpose: 'discovery';
  repository: string;
  release: string;
  discovery_amount: string;
  discovery_currency: string;
}

/** Stripe metadata for the Listing's own Product/Price/Payment Link. */
export function discoveryMetadata(input: DiscoveryLinkInput): DiscoveryLinkMetadata {
  return {
    purpose: 'discovery',
    repository: input.repository,
    release: input.release,
    discovery_amount: input.amount.toFixed(2),
    discovery_currency: input.currency.toLowerCase(),
  };
}

/** Deterministic Stripe Product name for a release's discovery access. */
export function discoveryProductName(input: { repository: string; release: string }): string {
  return `reposell discovery — ${input.repository} @ ${input.release}`;
}

/**
 * Immutability key (D16): one discovery link per release, deterministic,
 * idempotent CI searches use this exact key.
 */
export function discoveryIdempotencyKey(input: { repository: string; release: string }): string {
  return `discovery:${input.repository}:${input.release}`;
}
