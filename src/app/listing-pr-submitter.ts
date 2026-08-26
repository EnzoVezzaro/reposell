/**
 * Opens the Listing PR on the official listing repository (Git-native
 * registry, spec §6/D13): fork → branch → put record + PR payload → PR.
 *
 * Uses the seller's authenticated `gh` session — the registry accepts
 * contributions only through pull requests, never through an API server.
 */

import { execFileSync } from 'child_process';

import type { ListingPrPayload } from '../domain/listing/pr.js';

export const LISTING_UPSTREAM = 'EnzoVezzaro/reposell-listing';

/** Registry record shape (spec §8) derived from the verified PR payload. */
export function recordFromPayload(payload: ListingPrPayload): Record<string, unknown> {
  return {
    schema: 'reposell-listing-record/v1',
    product: {
      repository: `${payload.repository.owner}/${payload.repository.name}`,
      release: payload.release.version,
    },
    seller: {
      sell_url: payload.sell.url,
      payment_link: payload.sell.payment_link,
    },
    listing: {
      discovery_price: payload.listing.discovery_price,
    },
  };
}

/** Pure: file paths inside the registry's listing/ directory. */
export function listingFilePaths(payload: ListingPrPayload): { record: string; pr: string } {
  const base = `${payload.repository.owner}-${payload.repository.name}-${payload.release.version}`
    .replace(/[^A-Za-z0-9._-]/g, '-');
  return { record: `listing/${base}.json`, pr: `listing/${base}.pr.json` };
}

function gh(args: string[], input?: string): string {
  return execFileSync('gh', args, { encoding: 'utf8', ...(input !== undefined ? { input } : {}) });
}

export interface ListingPrResult {
  opened: boolean;
  url?: string;
  detail?: string;
}

/**
 * Best-effort PR creation. Never throws: failures return a detail the
 * caller can print so publication itself is never blocked by the listing.
 */
export function openListingPr(payload: ListingPrPayload): ListingPrResult {
  const record = JSON.stringify(recordFromPayload(payload), null, 2);
  const prJson = JSON.stringify(payload, null, 2);
  const paths = listingFilePaths(payload);
  const branch = `listing/${payload.repository.name}-${payload.release.version}`.replace(/[^A-Za-z0-9/._-]/g, '-');

  try {
    // Fork is idempotent ("already exists" is not an error for our purpose).
    try {
      gh(['repo', 'fork', LISTING_UPSTREAM, '--clone=false']);
    } catch {
      // Existing forks error here; resolve the actual login below anyway.
    }

    const login = gh(['api', 'user', '--jq', '.login']).trim();
    const baseSha = gh([
      'api',
      `repos/${login}/reposell-listing/git/ref/heads/main`,
      '--jq',
      '.object.sha',
    ]).trim();

    gh(
      [
        'api',
        '--method',
        'POST',
        `repos/${login}/reposell-listing/git/refs`,
        '-f',
        `ref=refs/heads/${branch}`,
        '-f',
        `sha=${baseSha}`,
      ],
      // A previous attempt may have created the branch already.
    );

    for (const [path, content] of [
      [paths.record, record],
      [paths.pr, prJson],
    ] as const) {
      gh(
        [
          'api',
          '--method',
          'PUT',
          `repos/${login}/reposell-listing/contents/${path}`,
          '-f',
          `message=list ${payload.repository.owner}/${payload.repository.name} @ ${payload.release.version}`,
          '-f',
          `content=${Buffer.from(content, 'utf8').toString('base64')}`,
          '-f',
          `branch=${branch}`,
        ],
      );
    }

    const body = [
      `Listing request for **${payload.repository.owner}/${payload.repository.name} @ ${payload.release.version}**.`,
      '',
      `- Seller /sell: ${payload.sell.url}`,
      `- Seller Payment Link: ${payload.sell.payment_link}`,
      `- Discovery price: ${payload.listing.discovery_price.amount} ${payload.listing.discovery_price.currency} (buyer-paid, immutable per release)`,
      '',
      'Listing CI: verify fail-closed against the live /sell endpoint.',
    ].join('\n');

    const prUrl = gh([
      'api',
      '--method',
      'POST',
      `repos/${LISTING_UPSTREAM}/pulls`,
      '-f',
      `title=${payload.repository.owner}/${payload.repository.name} @ ${payload.release.version}`,
      '-f',
      `head=${login}:${branch}`,
      '-f',
      'base=main',
      '-f',
      `body=${body}`,
      '--jq',
      '.html_url',
    ]).trim();

    return { opened: true, url: prUrl };
  } catch (error) {
    return {
      opened: false,
      detail:
        error instanceof Error
          ? error.message.split('\n')[0]
          : 'unknown error while opening the Listing PR',
    };
  }
}
