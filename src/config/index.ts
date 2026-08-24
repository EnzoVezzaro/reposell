/**
 * Configuration types for reposell.yml.
 *
 * Commercial declarations live per release (spec §6: "the release determines
 * the price"); there is no global product price. `mode` controls how releases
 * reach PUBLISHED (spec §31-32).
 */

export const CONFIG_VERSION = 1;

export type ReleaseMode = 'manual' | 'automatic';

export interface ProductSection {
  name?: string;
  description?: string;
}

export interface PricingDeclaration {
  amount?: number;
  currency?: string;
}

export interface PaymentDeclaration {
  provider?: string;
  payment_link?: string;
  /** Stripe Payment Link id (plink_…); enables deep price verification. */
  payment_link_id?: string;
}

/** How a license scheme charges. */
export type BillingMode = 'one-time' | 'recurring';
export type BillingInterval = 'month' | 'year';

/**
 * A reusable licensing scheme: what the buyer gets and how they pay.
 * Offers bind releases to schemes; each offer carries its own Stripe link.
 */
export interface LicensingScheme {
  name?: string;
  billing?: BillingMode;
  /** Required when billing is "recurring". */
  interval?: BillingInterval;
  seats?: number;
  /** License instrument template issued at checkout (e.g. rsl-1.0, fork). */
  template?: string;
  description?: string;
}

export interface LicensingSection {
  schemes?: Record<string, LicensingScheme>;
}

/** Status is persisted approval: draft until `reposell publish` passes gates. */
export type ReleaseStatus = 'draft' | 'published';

/**
 * One purchasable SKU on a release: license scheme × price × own
 * Stripe destination. A release declares one offer per scheme it sells.
 */
export interface OfferDeclaration {
  scheme?: string;
  pricing?: PricingDeclaration;
  payment?: PaymentDeclaration;
}

export interface ReleaseDefinition {
  status?: ReleaseStatus;
  offers?: OfferDeclaration[];
}

export interface ReleasesSection {
  mode?: ReleaseMode;
  definitions?: Record<string, ReleaseDefinition>;
}

export interface SellSection {
  enabled?: boolean;
}

export interface MarketplaceSection {
  enabled?: boolean;
}

export interface LicenseSection {
  mode?: 'rsl-1.0' | 'keep-existing' | 'none';
  spdx?: string;
  recorded_at?: string;
}

export interface ReposellYml {
  version?: number;
  product?: ProductSection;
  licensing?: LicensingSection;
  releases?: ReleasesSection;
  sell?: SellSection;
  marketplace?: MarketplaceSection;
  license?: LicenseSection;
}

export interface ParsedRelease {
  tag: string;
  definition: ReleaseDefinition;
}

const RELEASE_MODES: readonly string[] = ['manual', 'automatic'];
const RELEASE_STATUSES: readonly string[] = ['draft', 'published'];
const BILLING_MODES: readonly string[] = ['one-time', 'recurring'];
const BILLING_INTERVALS: readonly string[] = ['month', 'year'];

function recordIssues(issues: string[], condition: boolean, message: string): void {
  if (condition) issues.push(message);
}

/**
 * Validates an untrusted parsed YAML value into ReposellYml. Returns issues
 * instead of throwing so callers can explain BLOCKED states (spec §52).
 */
export function validateConfig(value: unknown): { config: ReposellYml; issues: string[] } {
  const issues: string[] = [];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { config: {}, issues: ['reposell.yml must contain a mapping at the root'] };
  }
  // SAFETY: shape checked above; fields validated individually below.
  const raw = value as Record<string, unknown>;
  const config: ReposellYml = {};

  if (raw['version'] !== undefined) {
    recordIssues(issues, typeof raw['version'] !== 'number', 'version must be a number');
    if (typeof raw['version'] === 'number') config.version = raw['version'];
  }

  if (raw['product'] !== undefined) {
    const product = raw['product'];
    if (typeof product !== 'object' || product === null || Array.isArray(product)) {
      issues.push('product must be a mapping');
    } else {
      // SAFETY: shape checked above.
      const p = product as Record<string, unknown>;
      config.product = {};
      if (p['name'] !== undefined) {
        recordIssues(issues, typeof p['name'] !== 'string', 'product.name must be a string');
        if (typeof p['name'] === 'string') config.product.name = p['name'];
      }
      if (p['description'] !== undefined) {
        recordIssues(
          issues,
          typeof p['description'] !== 'string',
          'product.description must be a string',
        );
        if (typeof p['description'] === 'string') config.product.description = p['description'];
      }
    }
  }

  if (raw['sell'] !== undefined && typeof raw['sell'] === 'object' && raw['sell'] !== null && !Array.isArray(raw['sell'])) {
    // SAFETY: shape checked on previous line.
    const s = raw['sell'] as Record<string, unknown>;
    config.sell = {};
    if (s['enabled'] !== undefined) {
      recordIssues(issues, typeof s['enabled'] !== 'boolean', 'sell.enabled must be a boolean');
      if (typeof s['enabled'] === 'boolean') config.sell.enabled = s['enabled'];
    }
  }

  if (
    raw['marketplace'] !== undefined &&
    typeof raw['marketplace'] === 'object' &&
    raw['marketplace'] !== null &&
    !Array.isArray(raw['marketplace'])
  ) {
    // SAFETY: shape checked on previous lines.
    const m = raw['marketplace'] as Record<string, unknown>;
    config.marketplace = {};
    if (m['enabled'] !== undefined) {
      recordIssues(
        issues,
        typeof m['enabled'] !== 'boolean',
        'marketplace.enabled must be a boolean',
      );
      if (typeof m['enabled'] === 'boolean') config.marketplace.enabled = m['enabled'];
    }
  }

  if (raw['license'] !== undefined && typeof raw['license'] === 'object' && raw['license'] !== null && !Array.isArray(raw['license'])) {
    // SAFETY: shape checked on previous line.
    const l = raw['license'] as Record<string, unknown>;
    config.license = {};
    if (l['mode'] !== undefined) {
      const mode = l['mode'];
      const allowed: readonly string[] = ['rsl-1.0', 'keep-existing', 'none'];
      recordIssues(issues, typeof mode !== 'string' || !allowed.includes(mode), 'license.mode must be one of rsl-1.0 | keep-existing | none');
      if (typeof mode === 'string') config.license.mode = mode as LicenseSection['mode'];
    }
    if (l['spdx'] !== undefined && typeof l['spdx'] === 'string') config.license.spdx = l['spdx'];
    if (l['recorded_at'] !== undefined && typeof l['recorded_at'] === 'string') {
      config.license.recorded_at = l['recorded_at'];
    }
  }

  if (raw['licensing'] !== undefined) {
    const licensing = raw['licensing'];
    if (typeof licensing !== 'object' || licensing === null || Array.isArray(licensing)) {
      issues.push('licensing must be a mapping');
    } else {
      // SAFETY: shape checked above.
      const l = licensing as Record<string, unknown>;
      config.licensing = {};
      if (l['schemes'] !== undefined) {
        const schemes = l['schemes'];
        if (typeof schemes !== 'object' || schemes === null || Array.isArray(schemes)) {
          issues.push('licensing.schemes must be a mapping keyed by scheme id');
        } else {
          // SAFETY: shape checked above.
          const schemesRecord = schemes as Record<string, unknown>;
          config.licensing.schemes = {};
          for (const id of Object.keys(schemesRecord).sort()) {
            const entry = schemesRecord[id];
            if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
              issues.push(`licensing.schemes."${id}" must be a mapping`);
              continue;
            }
            // SAFETY: shape checked above.
            const sc = entry as Record<string, unknown>;
            const scheme: LicensingScheme = {};
            if (sc['name'] !== undefined && typeof sc['name'] === 'string') scheme.name = sc['name'];
            if (sc['template'] !== undefined && typeof sc['template'] === 'string') scheme.template = sc['template'];
            if (sc['description'] !== undefined && typeof sc['description'] === 'string') {
              scheme.description = sc['description'];
            }
            if (sc['billing'] !== undefined) {
              recordIssues(
                issues,
                typeof sc['billing'] !== 'string' || !BILLING_MODES.includes(sc['billing']),
                `licensing.schemes."${id}".billing must be "one-time" or "recurring"`,
              );
              if (typeof sc['billing'] === 'string' && BILLING_MODES.includes(sc['billing'])) {
                scheme.billing = sc['billing'] as BillingMode;
              }
            }
            if (sc['interval'] !== undefined) {
              recordIssues(
                issues,
                typeof sc['interval'] !== 'string' || !BILLING_INTERVALS.includes(sc['interval']),
                `licensing.schemes."${id}".interval must be "month" or "year"`,
              );
              if (typeof sc['interval'] === 'string' && BILLING_INTERVALS.includes(sc['interval'])) {
                scheme.interval = sc['interval'] as BillingInterval;
              }
            }
            if (sc['seats'] !== undefined) {
              recordIssues(
                issues,
                typeof sc['seats'] !== 'number' || !Number.isInteger(sc['seats']) || sc['seats'] < 1,
                `licensing.schemes."${id}".seats must be a positive integer`,
              );
              if (typeof sc['seats'] === 'number' && Number.isInteger(sc['seats']) && sc['seats'] >= 1) {
                scheme.seats = sc['seats'];
              }
            }
            if (scheme.billing === 'recurring' && scheme.interval === undefined) {
              issues.push(`licensing.schemes."${id}": recurring billing requires an interval ("month" or "year")`);
            }
            if (scheme.billing === 'one-time' && scheme.interval !== undefined) {
              issues.push(`licensing.schemes."${id}": interval is only valid for recurring billing`);
            }
            config.licensing.schemes[id] = scheme;
          }
        }
      }
    }
  }

  if (raw['releases'] !== undefined) {
    const releases = raw['releases'];
    if (typeof releases !== 'object' || releases === null || Array.isArray(releases)) {
      issues.push('releases must be a mapping');
    } else {
      // SAFETY: shape checked above.
      const r = releases as Record<string, unknown>;
      config.releases = {};
      if (r['mode'] !== undefined) {
        recordIssues(
          issues,
          typeof r['mode'] !== 'string' || !RELEASE_MODES.includes(r['mode']),
          'releases.mode must be "manual" or "automatic"',
        );
        if (typeof r['mode'] === 'string' && RELEASE_MODES.includes(r['mode'])) {
          config.releases.mode = r['mode'] as ReleaseMode;
        }
      }
      if (r['definitions'] !== undefined) {
        const defs = r['definitions'];
        if (typeof defs !== 'object' || defs === null || Array.isArray(defs)) {
          issues.push('releases.definitions must be a mapping keyed by release tag');
        } else {
          // SAFETY: shape checked above.
          const defsRecord = defs as Record<string, unknown>;
          config.releases.definitions = {};
          for (const tag of Object.keys(defsRecord).sort()) {
            const entry = defsRecord[tag];
            if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
              issues.push(`release "${tag}" must be a mapping`);
              continue;
            }
            // SAFETY: shape checked above.
            const e = entry as Record<string, unknown>;
            const definition: ReleaseDefinition = {};
            if (e['status'] !== undefined) {
              recordIssues(
                issues,
                typeof e['status'] !== 'string' || !RELEASE_STATUSES.includes(e['status']),
                `release "${tag}" status must be "draft" or "published"`,
              );
              if (typeof e['status'] === 'string' && RELEASE_STATUSES.includes(e['status'])) {
                definition.status = e['status'] as ReleaseStatus;
              }
            }
            if (e['offers'] !== undefined) {
              const offers = e['offers'];
              if (!Array.isArray(offers)) {
                issues.push(`release "${tag}" offers must be a list`);
              } else {
                definition.offers = [];
                const seenSchemes = new Set<string>();
                for (const [index, rawOffer] of offers.entries()) {
                  const offerPath = `release "${tag}" offers[${index}]`;
                  if (typeof rawOffer !== 'object' || rawOffer === null || Array.isArray(rawOffer)) {
                    issues.push(`${offerPath} must be a mapping`);
                    continue;
                  }
                  // SAFETY: shape checked above.
                  const o = rawOffer as Record<string, unknown>;
                  const offer: OfferDeclaration = {};
                  if (o['scheme'] !== undefined && typeof o['scheme'] === 'string') {
                    offer.scheme = o['scheme'];
                    if (seenSchemes.has(o['scheme'])) {
                      issues.push(`${offerPath}: duplicate scheme "${String(o['scheme'])}"`);
                    }
                    seenSchemes.add(o['scheme']);
                  } else {
                    issues.push(`${offerPath}.scheme is required`);
                  }
                  if (o['pricing'] !== undefined && typeof o['pricing'] === 'object' && o['pricing'] !== null && !Array.isArray(o['pricing'])) {
                    // SAFETY: shape checked above.
                    const pr = o['pricing'] as Record<string, unknown>;
                    offer.pricing = {};
                    if (pr['amount'] !== undefined) {
                      recordIssues(
                        issues,
                        typeof pr['amount'] !== 'number' || !Number.isFinite(pr['amount']),
                        `${offerPath}.pricing.amount must be a number`,
                      );
                      if (typeof pr['amount'] === 'number' && Number.isFinite(pr['amount'])) {
                        offer.pricing.amount = pr['amount'];
                      }
                    }
                    if (pr['currency'] !== undefined) {
                      recordIssues(
                        issues,
                        typeof pr['currency'] !== 'string' || pr['currency'].length !== 3,
                        `${offerPath}.pricing.currency must be a 3-letter code (e.g. USD)`,
                      );
                      if (typeof pr['currency'] === 'string') offer.pricing.currency = pr['currency'].toUpperCase();
                    }
                  }
                  if (o['payment'] !== undefined && typeof o['payment'] === 'object' && o['payment'] !== null && !Array.isArray(o['payment'])) {
                    // SAFETY: shape checked above.
                    const pm = o['payment'] as Record<string, unknown>;
                    offer.payment = {};
                    if (pm['provider'] !== undefined) {
                      recordIssues(issues, typeof pm['provider'] !== 'string', `${offerPath}.payment.provider must be a string`);
                      if (typeof pm['provider'] === 'string') offer.payment.provider = pm['provider'];
                    }
                    if (pm['payment_link'] !== undefined) {
                      recordIssues(issues, typeof pm['payment_link'] !== 'string', `${offerPath}.payment.payment_link must be a string`);
                      if (typeof pm['payment_link'] === 'string') offer.payment.payment_link = pm['payment_link'];
                    }
                    if (pm['payment_link_id'] !== undefined) {
                      recordIssues(issues, typeof pm['payment_link_id'] !== 'string', `${offerPath}.payment.payment_link_id must be a string`);
                      if (typeof pm['payment_link_id'] === 'string') offer.payment.payment_link_id = pm['payment_link_id'];
                    }
                  }
                  definition.offers.push(offer);
                }
                if (definition.offers.length === 0) delete definition.offers;
              }
            }
            config.releases.definitions[tag] = definition;
          }
        }
      }
    }
  }

  return { config, issues };
}

export function sortedTags(config: ReposellYml): string[] {
  return Object.keys(config.releases?.definitions ?? {}).sort(compareTags);
}

function compareTags(a: string, b: string): number {
  const pa = parseLoose(a);
  const pb = parseLoose(b);
  if (pa !== null && pb !== null) {
    const [aMaj, aMin, aPatch] = pa;
    const [bMaj, bMin, bPatch] = pb;
    if (aMaj !== bMaj) return aMaj - bMaj;
    if (aMin !== bMin) return aMin - bMin;
    if (aPatch !== bPatch) return aPatch - bPatch;
  }
  return a.localeCompare(b);
}

function parseLoose(tag: string): [number, number, number] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(tag);
  if (match === null) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
