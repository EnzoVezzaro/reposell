/**
 * Protocol document schemas and deterministic builders (spec §5, §6, §11, §15,
 * §20, §33, §41). Every builder is pure: same input, same bytes.
 */

import type { HealthState } from '../release/state.js';

export const PROTOCOL_VERSION = '1.0';

export const SCHEMA_MANIFEST = 'reposell/manifest/v1';
export const SCHEMA_RELEASE = 'reposell/release/v1';
export const SCHEMA_HEALTH = 'reposell/health/v1';
export const SCHEMA_RELEASES = 'reposell/releases/v1';
export const SCHEMA_MARKETPLACE = 'reposell/marketplace/v1';
export const SCHEMA_PRICING = 'reposell/pricing/v1';
export const SCHEMA_SIGNATURE = 'reposell/signature/v1';

export interface RepositoryIdentity {
  owner: string;
  name: string;
  url: string;
}

export interface ProductIdentity {
  name: string;
  description: string;
}

/** Canonical /reposell/index.json discovery document (spec §41). */
export interface ProtocolIndexDoc {
  protocol: 'reposell';
  version: string;
  manifest: string;
  health: string;
  sell: string;
  marketplace: string;
  releases: string;
}

export function buildProtocolIndex(): ProtocolIndexDoc {
  return {
    protocol: 'reposell',
    version: '1',
    manifest: '/reposell/manifest.json',
    health: '/reposell/health.json',
    sell: '/reposell/sell/',
    marketplace: '/reposell/marketplace/',
    releases: '/reposell/releases/index.json',
  };
}

export type EndpointEnabled = boolean;

/** Canonical repository manifest (spec §5). */
export interface RepoManifestDoc {
  schema: typeof SCHEMA_MANIFEST;
  repository: {
    provider: 'github';
    owner: string;
    name: string;
    url: string;
  };
  product: ProductIdentity;
  releases: {
    mode: 'manual' | 'automatic';
    index: string;
  };
  sell: { enabled: EndpointEnabled; url: string };
  marketplace: { enabled: EndpointEnabled; url: string };
  health: { url: string };
  protocol: { version: string };
}

export function buildRepoManifest(input: {
  identity: RepositoryIdentity;
  product: ProductIdentity;
  releaseMode: 'manual' | 'automatic';
  sellEnabled: boolean;
  marketplaceEnabled: boolean;
}): RepoManifestDoc {
  return {
    schema: SCHEMA_MANIFEST,
    repository: {
      provider: 'github',
      owner: input.identity.owner,
      name: input.identity.name,
      url: input.identity.url,
    },
    product: { name: input.product.name, description: input.product.description },
    releases: { mode: input.releaseMode, index: '/reposell/releases/index.json' },
    sell: { enabled: input.sellEnabled, url: '/reposell/sell/' },
    marketplace: { enabled: input.marketplaceEnabled, url: '/reposell/marketplace/' },
    health: { url: '/reposell/health.json' },
    protocol: { version: PROTOCOL_VERSION },
  };
}

export interface ReleasePricing {
  amount: number;
  currency: string;
}

export interface ReleasePayment {
  provider: 'stripe';
  payment_link: string;
}

export interface ReleasePayment {
  provider: 'stripe';
  payment_link: string;
}

/** One purchasable SKU in the immutable manifest: scheme × price × link. */
export interface ReleaseOffer {
  scheme: string;
  name: string;
  billing: 'one-time' | 'recurring';
  interval?: 'month' | 'year';
  seats?: number;
  pricing: ReleasePricing;
  payment: ReleasePayment;
}

/** Immutable per-release commercial manifest (spec §6, §19). */
export interface ReleaseManifestDoc {
  schema: typeof SCHEMA_RELEASE;
  repository: string;
  release: { version: string; tag: string };
  pricing: ReleasePricing;
  payment: ReleasePayment;
  offers?: ReleaseOffer[];
  license: { type: string; policy?: string; policy_hash?: string };
}

export function buildReleaseManifest(input: {
  repositorySlug: string;
  version: string;
  tag: string;
  pricing: ReleasePricing;
  paymentLink: string;
  licenseType: string;
  offers?: ReleaseOffer[];
  licensePolicyHash?: string;
}): ReleaseManifestDoc {
  // Primary pricing mirrors the first offer when offers exist (§19: the
  // release manifest remains the single immutable commercial declaration).
  return {
    schema: SCHEMA_RELEASE,
    repository: input.repositorySlug,
    release: { version: input.version, tag: input.tag },
    pricing: { amount: input.pricing.amount, currency: input.pricing.currency },
    payment: { provider: 'stripe', payment_link: input.paymentLink },
    ...(input.offers !== undefined && input.offers.length > 0 ? { offers: input.offers } : {}),
    license: {
      type: input.licenseType,
      ...(input.licensePolicyHash !== undefined ? { policy_hash: input.licensePolicyHash } : {}),
    },
  };
}

export type CheckName = 'manifest' | 'release' | 'payment' | 'pricing' | 'license' | 'integrity';

export type CheckStatus = 'valid' | 'failed';

export type HealthChecks = Record<CheckName, CheckStatus>;

/** /reposell/health.json (spec §11) and per-release health documents. */
export interface HealthDoc {
  schema: typeof SCHEMA_HEALTH;
  status: HealthState;
  repository: string;
  release?: string;
  checks: HealthChecks;
}

export function buildHealthDoc(input: {
  repositorySlug: string;
  release?: string;
  checks: HealthChecks;
}): HealthDoc {
  const allValid = Object.values(input.checks).every((status) => status === 'valid');
  return {
    schema: SCHEMA_HEALTH,
    status: allValid ? 'healthy' : 'unhealthy',
    repository: input.repositorySlug,
    ...(input.release !== undefined ? { release: input.release } : {}),
    checks: { ...input.checks },
  };
}

export type CatalogStatus = 'available' | 'blocked';

/** One entry of /reposell/releases/index.json (spec §33). */
export interface CatalogOffer {
  scheme: string;
  name: string;
  billing: 'one-time' | 'recurring';
  interval?: 'month' | 'year';
  seats?: number;
  price: number;
  currency: string;
  status: CatalogStatus;
  paymentLink?: string;
}

export interface ReleasesIndexEntry {
  version: string;
  price: number;
  currency: string;
  status: CatalogStatus;
  health: HealthState;
  offers?: CatalogOffer[];
}

export interface ReleasesIndexDoc {
  schema: typeof SCHEMA_RELEASES;
  releases: ReleasesIndexEntry[];
}

export function buildReleasesIndex(entries: ReleasesIndexEntry[]): ReleasesIndexDoc {
  return { schema: SCHEMA_RELEASES, releases: [...entries] };
}

/** Optional marketplace endpoint document (spec §15). */
export interface MarketplaceDoc {
  schema: typeof SCHEMA_MARKETPLACE;
  enabled: boolean;
  repository: string;
  listing: {
    url: string;
    provider: 'reposell';
  } | null;
}

export function buildMarketplaceDoc(input: {
  repositorySlug: string;
  enabled: boolean;
}): MarketplaceDoc {
  return {
    schema: SCHEMA_MARKETPLACE,
    enabled: input.enabled,
    repository: input.repositorySlug,
    listing: input.enabled ? { url: '', provider: 'reposell' } : null,
  };
}

/**
 * Marketplace pricing configuration served by the official marketplace
 * pricing endpoint (spec §20). Signed by RepoSell; percentages are shares
 * of the fee pool, `fee` amounts are in major currency units.
 */
export interface PricingConfigDoc {
  schema: typeof SCHEMA_PRICING;
  default_marketplace_fee: number;
  public_marketplace_percentage: number;
  main_marketplace_percentage: number;
  currency: string;
  valid_until?: string;
}

export interface SignedPricingEnvelope {
  config: PricingConfigDoc;
  signature: string;
  key_id: string;
  algorithm: 'Ed25519';
}
