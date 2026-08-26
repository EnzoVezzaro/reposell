/**
 * Opens the Listing PR on the official listing repository (Git-native
 * registry, spec §6/D13): fork → branch → pointer request → PR.
 *
 * POINTER-ONLY: the request carries just repository@release + sell_url.
 * Every piece of listing information is derived by Listing CI from the
 * seller's LIVE /sell page and manifest at verification time — nothing
 * seller-authored passes through the PR.
 */

import { execFileSync } from 'child_process';

import type { ListingPrPayload } from '../domain/listing/pr.js';

export const LISTING_UPSTREAM = 'EnzoVezzaro/reposell-listing';

export interface ListingRequest {
  schema: 'reposell-listing-request/v1';
  repository: string;
  release: string;
  sell_url: string;
}

/** Pure: the minimal pointer the seller's publication puts on the PR. */
export function requestFromPayload(payload: ListingPrPayload): ListingRequest {
  return {
    schema: 'reposell-listing-request/v1',
    repository: `${payload.repository.owner}/${payload.repository.name}`,
    release: payload.release.version,
    sell_url: payload.sell.url,
  };
}

/** Pure: file path inside the registry's listing/ directory. */
export function listingRequestPath(payload: ListingPrPayload): string {
  const base = `${payload.repository.owner}-${payload.repository.name}-${payload.release.version}`
    .replace(/[^A-Za-z0-9._-]/g, '-');
  return `listing/${base}.request.json`;
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
  const request = requestFromPayload(payload);
  const content = `${JSON.stringify(request, null, 2)}\n`;
  const requestPath = listingRequestPath(payload);
  const branch = `listing/${payload.repository.name}-${payload.release.version}`.replace(/[^A-Za-z0-9/._-]/g, '-');

  try {
    // Fork is idempotent ("already exists" is not an error for our purpose).
    try {
      gh(['repo', 'fork', LISTING_UPSTREAM, '--clone=false']);
    } catch {
      // Existing forks error here; resolve the actual login below anyway.
    }

    const login = gh(['api', 'user', '--jq', '.login']).trim();
    const repoFull =
      login === 'EnzoVezzaro'
        ? LISTING_UPSTREAM // same owner — branch directly on upstream
        : `${login}/reposell-listing`;

    const baseSha = gh(['api', `repos/${repoFull}/git/ref/heads/main`, '--jq', '.object.sha']).trim();

    gh(
      [
        'api', '--method', 'POST',
        `repos/${repoFull}/git/refs`,
        '-f', `ref=refs/heads/${branch}`,
        '-f', `sha=${baseSha}`,
      ],
      // A previous attempt may have created the branch already.
    );

    gh(
      [
        'api', '--method', 'PUT',
        `repos/${repoFull}/contents/${requestPath}`,
        '-f', `message=list ${request.repository} @ ${request.release}`,
        '-f', `content=${Buffer.from(content, 'utf8').toString('base64')}`,
        '-f', `branch=${branch}`,
      ],
    );

    const body = [
      `Listing request for **${request.repository} @ ${request.release}**.`,
      '',
      `- Seller /sell endpoint: ${request.sell_url}`,
      '',
      'Listing CI derives every listed field live from this endpoint (identity,',
      'release, verified Payment Link, seller-declared discovery contribution)',
      'and commits the registry record into this branch before merge.',
    ].join('\n');

    const head = login === 'EnzoVezzaro' ? branch : `${login}:${branch}`;
    const prUrl = gh([
      'api', '--method', 'POST',
      `repos/${LISTING_UPSTREAM}/pulls`,
      '-f', `title=${request.repository} @ ${request.release}`,
      '-f', `head=${head}`,
      '-f', 'base=main',
      '-f', `body=${body}`,
      '--jq', '.html_url',
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
