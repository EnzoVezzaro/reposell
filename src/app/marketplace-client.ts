/**
 * Protocol-pure marketplace client (spec §48-49). Consumes exactly the same
 * public /reposell/* endpoints as the web marketplace — no separate API.
 */

import { pemToPublicKey } from '../utils/crypto.js';
import { verifyFileSet, type SignatureDoc } from '../domain/signature/envelope.js';
import type { HealthDoc, RepoManifestDoc, ReleasesIndexDoc } from '../domain/protocol/documents.js';

export interface HttpTextResult {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type MarketFetchLike = (url: string) => Promise<HttpTextResult>;

export const DEFAULT_MARKET_FETCH: MarketFetchLike = async (url) => {
  const res = await fetch(url);
  return { ok: res.ok, status: res.status, text: () => res.text() };
};

export class RemoteProtocolError extends Error {
  readonly code = 'REMOTE_PROTOCOL_ERROR';
  readonly url: string;
  constructor(url: string, detail: string) {
    super(`${url}: ${detail}`);
    this.name = 'RemoteProtocolError';
    this.url = url;
  }
}

export interface RemoteTarget {
  owner: string;
  repo: string;
  baseUrl?: string;
}

export function pagesUrl(owner: string, repo: string, baseUrl?: string): string {
  const trimmed = baseUrl?.replace(/\/+$/, '');
  if (trimmed !== undefined && trimmed.length > 0) return trimmed;
  return `https://${owner}.github.io/${repo}`;
}

async function fetchJson<T>(input: {
  url: string;
  guard: (value: unknown) => T | undefined;
  doFetch: MarketFetchLike;
  label: string;
}): Promise<T> {
  let res: HttpTextResult;
  try {
    res = await input.doFetch(input.url);
  } catch (error) {
    throw new RemoteProtocolError(input.url, error instanceof Error ? error.message : String(error));
  }
  if (!res.ok) throw new RemoteProtocolError(input.url, `${input.label}: HTTP ${res.status}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await res.text());
  } catch {
    throw new RemoteProtocolError(input.url, `${input.label}: response is not valid JSON`);
  }
  const guarded = input.guard(parsed);
  if (guarded === undefined) throw new RemoteProtocolError(input.url, `${input.label}: unexpected document shape`);
  return guarded;
}

function guardObject(value: unknown): Record<string, unknown> | undefined {
  // SAFETY: the condition above establishes the record shape before this cast.
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export async function fetchManifest(target: RemoteTarget, doFetch: MarketFetchLike = DEFAULT_MARKET_FETCH): Promise<RepoManifestDoc> {
  const base = pagesUrl(target.owner, target.repo, target.baseUrl);
  const doc = await fetchJson({
    url: `${base}/reposell/manifest.json`,
    doFetch,
    label: 'manifest',
    guard: (value) => {
      const obj = guardObject(value);
      if (obj === undefined || obj['schema'] !== 'reposell/manifest/v1') return undefined;
      // SAFETY: schema string discriminates the documented manifest shape.
      return obj as unknown as RepoManifestDoc;
    },
  });
  return doc;
}

export async function fetchHealth(target: RemoteTarget, doFetch: MarketFetchLike = DEFAULT_MARKET_FETCH): Promise<HealthDoc> {
  const base = pagesUrl(target.owner, target.repo, target.baseUrl);
  const doc = await fetchJson({
    url: `${base}/reposell/health.json`,
    doFetch,
    label: 'health',
    guard: (value) => {
      const obj = guardObject(value);
      if (obj === undefined || obj['schema'] !== 'reposell/health/v1') return undefined;
      // SAFETY: schema string discriminates the documented health shape.
      return obj as unknown as HealthDoc;
    },
  });
  return doc;
}

export async function fetchReleases(target: RemoteTarget, doFetch: MarketFetchLike = DEFAULT_MARKET_FETCH): Promise<ReleasesIndexDoc> {
  const base = pagesUrl(target.owner, target.repo, target.baseUrl);
  const doc = await fetchJson({
    url: `${base}/reposell/releases/index.json`,
    doFetch,
    label: 'releases index',
    guard: (value) => {
      const obj = guardObject(value);
      if (obj === undefined || obj['schema'] !== 'reposell/releases/v1' || !Array.isArray(obj['releases'])) {
        return undefined;
      }
      // SAFETY: schema + array presence discriminate the documented catalog.
      return obj as unknown as ReleasesIndexDoc;
    },
  });
  return doc;
}

/** Resolves the verified Stripe Payment Link for a specific release. */
export async function fetchReleasePaymentLink(input: {
  target: RemoteTarget;
  tag: string;
  doFetch?: MarketFetchLike;
}): Promise<string> {
  const doFetch = input.doFetch ?? DEFAULT_MARKET_FETCH;
  const base = pagesUrl(input.target.owner, input.target.repo, input.target.baseUrl);
  const doc = await fetchJson({
    url: `${base}/reposell/releases/${encodeURIComponent(input.tag)}/manifest.json`,
    doFetch,
    label: `release ${input.tag}`,
    guard: (value) => {
      const obj = guardObject(value);
      if (obj === undefined || obj['schema'] !== 'reposell/release/v1') return undefined;
      const payment = guardObject(obj['payment']);
      const link = payment?.['payment_link'];
      if (typeof link !== 'string' || link.length === 0) return undefined;
      return link;
    },
  });
  return doc;
}

/**
 * Registry search: a static JSON index of listed repositories, filtered
 * locally. The official marketplace publishes this file; any community
 * mirror can serve the same document.
 */
export interface RegistryEntry {
  repository: string;
  name?: string;
  description?: string;
}

export async function searchRegistry(input: {
  query: string;
  registryUrl: string;
  doFetch?: MarketFetchLike;
}): Promise<RegistryEntry[]> {
  const doFetch = input.doFetch ?? DEFAULT_MARKET_FETCH;
  const doc = await fetchJson({
    url: input.registryUrl,
    doFetch,
    label: 'registry',
    guard: (value) => {
      const obj = guardObject(value);
      const list = obj?.['repositories'];
      if (!Array.isArray(list)) return undefined;
      const entries: RegistryEntry[] = [];
      for (const item of list) {
        const rec = guardObject(item);
        if (rec === undefined || typeof rec['repository'] !== 'string') continue;
        entries.push({
          repository: rec['repository'],
          ...(typeof rec['name'] === 'string' ? { name: rec['name'] } : {}),
          ...(typeof rec['description'] === 'string' ? { description: rec['description'] } : {}),
        });
      }
      return entries;
    },
  });
  const q = input.query.trim().toLowerCase();
  if (q.length === 0) return doc;
  return doc.filter((entry) =>
    [entry.repository, entry.name ?? '', entry.description ?? '']
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
}

/**
 * Trust chain against a remote build (spec §45): verifies signature.json
 * using the repository's distributed public verification key.
 */
export async function verifyRemoteTrust(input: {
  target: RemoteTarget;
  branch?: string;
  doFetch?: MarketFetchLike;
}): Promise<{ trusted: boolean; checkedFiles: number; failures: string[] }> {
  const doFetch = input.doFetch ?? DEFAULT_MARKET_FETCH;
  const base = pagesUrl(input.target.owner, input.target.repo, input.target.baseUrl);
  const branch = input.branch ?? 'main';

  let envelopeRaw: string;
  let keyRaw: string;
  try {
    const envelopeRes = await doFetch(`${base}/reposell/signature.json`);
    if (!envelopeRes.ok) {
      return { trusted: false, checkedFiles: 0, failures: [`signature.json: HTTP ${envelopeRes.status}`] };
    }
    envelopeRaw = await envelopeRes.text();
    const keyRes = await doFetch(
      `https://raw.githubusercontent.com/${input.target.owner}/${input.target.repo}/${branch}/.github/reposell/verification-key.pem`,
    );
    if (!keyRes.ok) {
      return { trusted: false, checkedFiles: 0, failures: [`verification key: HTTP ${keyRes.status}`] };
    }
    keyRaw = await keyRes.text();
  } catch (error) {
    return {
      trusted: false,
      checkedFiles: 0,
      failures: [error instanceof Error ? error.message : String(error)],
    };
  }

  let envelope: SignatureDoc;
  try {
    const parsed: unknown = JSON.parse(envelopeRaw);
    const obj = guardObject(parsed);
    if (obj === undefined) throw new Error('signature.json is not an object');
    // SAFETY: fields validated by verifyFileSet below.
    envelope = obj as unknown as SignatureDoc;
  } catch (error) {
    return {
      trusted: false,
      checkedFiles: 0,
      failures: [error instanceof Error ? error.message : String(error)],
    };
  }

  const publicKey = pemToPublicKey(keyRaw);
  const files: Record<string, string> = {};
  const failures: string[] = [];
  const paths = Object.keys(envelope.files ?? {}).sort();
  for (const relPath of paths) {
    try {
      const res = await doFetch(`${base}/reposell/${relPath}`);
      if (!res.ok) {
        failures.push(`${relPath}: HTTP ${res.status}`);
        continue;
      }
      files[relPath] = await res.text();
    } catch (error) {
      failures.push(`${relPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const result = await verifyFileSet({ files, envelope, publicKey });
  return {
    trusted: result.valid && failures.length === 0,
    checkedFiles: Object.keys(files).length,
    failures: [...failures, ...result.failures],
  };
}
