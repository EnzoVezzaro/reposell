/**
 * RepoSell Publisher — announces verified listings to the canonical
 * registry (reposell-listing) via GitHub repository_dispatch.
 *
 * Architecture (3 layers):
 *   seller /sell (source of truth) → Publisher verifies + derives →
 *   signed event → canonical registry (materialized index) → federation.
 *
 * The seller's repositories never talk to a listing repository directly,
 * and no listing data travels through pull requests.
 */

import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

import type { ListingPrPayload } from '../domain/listing/pr.js';

export const LISTING_REGISTRY = 'EnzoVezzaro/reposell-listing';

/**
 * Stable listing identity: derived from the repository slug so updates map
 * onto the same entity without filenames or paths leaking into the protocol.
 */
export function listingIdFor(repository: string): string {
  const hash = createHash('sha1').update(repository.trim().toLowerCase()).digest('hex').slice(0, 12);
  return `lst_${hash}`;
}

/** Embedded `/sell` document shape the publisher derives records from. */
export interface SellEmbeddedDocument {
  schema?: string;
  repository?: string;
  releases?: Array<{
    version?: string;
    status?: string;
    offers?: Array<{
      paymentLink?: string;
      price?: number;
      currency?: string;
      scheme?: string;
    }>;
  }>;
  listing?: {
    contribution?: {
      amount?: number;
      currency?: string;
    };
  };
}

export interface DerivedListingRecord {
  id: string;
  schema: 'reposell-listing-record/v1';
  product: { repository: string; release: string };
  seller: { sell_url: string; payment_link: string };
  listing: { discovery_price: { amount: number; currency: string } };
}

export class SellDataInvalidError extends Error {}

function fail(reason: string): never {
  throw new SellDataInvalidError(reason);
}

/**
 * Pure boundary between the seller protocol and the registry: maps a
 * verified embedded /sell document onto the canonical registry record.
 */
export function recordFromSellDocument(
  data: SellEmbeddedDocument,
    input: { sellUrl: string; requestedRelease?: string },
): DerivedListingRecord {
  if (data.schema !== 'reposell/sell-page/v1') fail(`unexpected schema ${String(data.schema)}`);
  const repository = typeof data.repository === 'string' ? data.repository : '';
  if (repository.length === 0) fail('sell page does not declare its repository identity');

  const available = (data.releases ?? []).filter(
    (release) => release.status === 'available' && (release.offers ?? []).length > 0,
  );
  const release =
    input.requestedRelease !== undefined
      ? available.find((entry) => entry.version === input.requestedRelease)
      : available[0];
  if (release === undefined || release.version === undefined) {
    fail('no available release on the /sell page — publish first');
  }

  const offer = release.offers?.[0];
  if (offer === undefined) fail(`release ${String(release.version)} has no offers`);
  const paymentLink = offer.paymentLink;
  if (typeof paymentLink !== 'string' || !/^https:\/\/(buy|checkout)\.stripe\.com\//.test(paymentLink)) {
    fail(`offer ${String(release.version)} has no valid Stripe Payment Link`);
  }
  const amount = offer.price;
  if (typeof amount !== 'number' || !(amount > 0)) {
    fail(`offer ${String(release.version)} has no positive price`);
  }

  const contributionAmount = data.listing?.contribution?.amount ?? 5;
  if (!(contributionAmount > 0)) fail('seller-declared discovery contribution must be positive');
  const contributionCurrency = String(data.listing?.contribution?.currency ?? 'USD').toUpperCase();

  return {
    id: listingIdFor(repository),
    schema: 'reposell-listing-record/v1',
    product: { repository, release: release.version },
    seller: { sell_url: input.sellUrl, payment_link: paymentLink },
    listing: {
      discovery_price: { amount: contributionAmount, currency: contributionCurrency },
    },
  };
}

function gh(args: string[], input?: string): string {
  return execFileSync('gh', args, { encoding: 'utf8', ...(input !== undefined ? { input } : {}) });
}

export interface AnnouncementResult {
  dispatched: boolean;
  event: 'listing.created' | 'listing.updated';
  id: string;
  detail?: string;
}

/**
 * Verifies the live /sell document, derives the record, and announces it to
 * the canonical registry. Best-effort at publication time: failures are
 * returned, never thrown — publishing the software always comes first.
 */
export async function announceListing(payload: ListingPrPayload): Promise<AnnouncementResult> {
  try {
    const res = await fetch(payload.sell.url, { headers: { 'user-agent': 'reposell-publisher' } });
    if (!res.ok) return { dispatched: false, event: 'listing.created', id: '', detail: `/sell unreachable (HTTP ${res.status})` };
    const html = await res.text();
    const match = html.match(/<script type="application\/json" id="reposell-data">(.*?)<\/script>/s);
    if (match === null) return { dispatched: false, event: 'listing.created', id: '', detail: '/sell has no embedded reposell-data' };

    // SAFETY: network JSON is narrowed by recordFromSellDocument's guards.
    const embedded = match[1];
    if (embedded === undefined) return { dispatched: false, event: 'listing.created', id: '', detail: 'empty reposell-data' };
    // SAFETY: network JSON is projected onto the embedded /sell document
    // shape; recordFromSellDocument guards every consumed field.
    const data = JSON.parse(embedded) as SellEmbeddedDocument;
    const record = recordFromSellDocument(data, {
      sellUrl: payload.sell.url,
      requestedRelease: payload.release.version,
    });

    // Created vs updated: does the stable id already exist upstream?
    let event: AnnouncementResult['event'] = 'listing.created';
    try {
      gh(['api', `repos/${LISTING_REGISTRY}/contents/listing/${record.id}.json`, '--jq', '.sha']);
      event = 'listing.updated';
    } catch {
      // 404 → genuinely new listing.
    }

    const args = [
      'api', '--method', 'POST',
      `repos/${LISTING_REGISTRY}/dispatches`,
      '-F', `event_type=${event}`,
      '-f', 'client_payload[schema]=reposell.event/v1',
      '-F', 'client_payload[version]=1.0',
      '-f', `client_payload[event]=${event}`,
      '-f', `client_payload[listing][id]=${record.id}`,
      '-f', `client_payload[source][repository]=${record.product.repository}`,
      '-f', 'client_payload[source][sell_path]=/sell',
      '-f', `client_payload[record][schema]=${record.schema}`,
      '-f', `client_payload[record][product][repository]=${record.product.repository}`,
      '-f', `client_payload[record][product][release]=${record.product.release}`,
      '-f', `client_payload[record][seller][sell_url]=${record.seller.sell_url}`,
      '-f', `client_payload[record][seller][payment_link]=${record.seller.payment_link}`,
      '-f', `client_payload[record][listing][discovery_price][amount]=${record.listing.discovery_price.amount}`,
      '-f', `client_payload[record][listing][discovery_price][currency]=${record.listing.discovery_price.currency}`,
    ];
    gh(args);

    return { dispatched: true, event, id: record.id };
  } catch (error) {
    return {
      dispatched: false,
      event: 'listing.created',
      id: '',
      detail: error instanceof Error ? error.message.split('\n')[0] : String(error),
    };
  }
}
