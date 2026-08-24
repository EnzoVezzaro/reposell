/**
 * Seller /sell health check (spec §5): the Listing CI verifies that the
 * seller's live /sell page actually corresponds to the Listing manifest —
 * repository identity, release catalog, and the seller's own Payment Link.
 * HTTP 200 alone is never sufficient.
 *
 * Pure given an injected fetch; fail-closed on any mismatch.
 */

export interface SellFetchLike {
  (url: string): Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
}

export const DEFAULT_SELL_FETCH: SellFetchLike = (url) =>
  // SAFETY: plain GET of a public page; Response is structurally compatible.
  fetch(url).then((res) => ({ ok: res.ok, status: res.status, text: () => res.text() }));

export interface SellHealthInput {
  sellUrl: string;
  /** Expected repository slug ("owner/name") from the Listing PR. */
  repository: string;
  /** Expected release version, when the PR targets one. */
  version?: string;
  /** The seller's Payment Link that must appear among the page offers. */
  sellerPaymentLink: string;
  fetchImpl?: SellFetchLike;
}

export interface SellHealthIssue {
  check: string;
  detail: string;
}

export interface SellHealthResult {
  healthy: boolean;
  issues: SellHealthIssue[];
  /** Parsed embedded catalog, when the page shape was valid. */
  catalog?: {
    schema: string;
    repository?: string;
    releases: Array<{
      version: string;
      status?: string;
      offers?: Array<{ paymentLink?: string }>;
    }>;
  };
}

interface EmbeddedSellPage {
  schema?: string;
  repository?: string;
  releases?: Array<{
    version?: string;
    status?: string;
    offers?: Array<{ paymentLink?: string }>;
  }>;
}

function parseEmbeddedData(html: string): EmbeddedSellPage | undefined {
  const marker = 'id="reposell-data"';
  const start = html.indexOf(marker);
  if (start === -1) return undefined;
  const open = html.indexOf('>', start);
  const close = html.indexOf('</script>', open);
  if (open === -1 || close === -1) return undefined;
  try {
    // SAFETY: shape guarded by the validation immediately above before this cast.
    return JSON.parse(html.slice(open + 1, close)) as EmbeddedSellPage;
  } catch {
    return undefined;
  }
}

/** Runs every health check; stops early only when the page is unreachable. */
export async function checkSellerSell(input: SellHealthInput): Promise<SellHealthResult> {
  const doFetch = input.fetchImpl ?? DEFAULT_SELL_FETCH;
  const issues: SellHealthIssue[] = [];

  let response: Awaited<ReturnType<SellFetchLike>>;
  try {
    response = await doFetch(input.sellUrl);
  } catch (error) {
    return {
      healthy: false,
      issues: [{ check: 'reachable', detail: `fetch failed: ${error instanceof Error ? error.message : String(error)}` }],
    };
  }

  if (!response.ok) {
    return {
      healthy: false,
      issues: [{ check: 'reachable', detail: `HTTP ${response.status}` }],
    };
  }

  const html = await response.text();
  const embedded = parseEmbeddedData(html);
  if (embedded === undefined) {
    return {
      healthy: false,
      issues: [{ check: 'reposell-metadata', detail: 'page carries no reposell-data block (not a reposell /sell page)' }],
    };
  }

  if (embedded.schema !== 'reposell/sell-page/v1') {
    issues.push({ check: 'schema', detail: `expected "reposell/sell-page/v1", got "${String(embedded.schema)}"` });
  }

  if (embedded.repository !== input.repository) {
    issues.push({
      check: 'repository-identity',
      detail: `page declares "${String(embedded.repository)}", Listing PR declares "${input.repository}"`,
    });
  }

  const releases = embedded.releases ?? [];
  if (input.version !== undefined) {
    const release = releases.find((entry) => entry.version === input.version);
    if (release === undefined) {
      issues.push({ check: 'release', detail: `release ${input.version} not present in the live catalog` });
    } else if (release.status !== 'available') {
      issues.push({ check: 'release-status', detail: `release ${input.version} is "${String(release.status)}", not available` });
    }
  }

  const offerLinks = releases.flatMap((entry) => (entry.offers ?? []).map((offer) => offer.paymentLink));
  if (!offerLinks.includes(input.sellerPaymentLink)) {
    issues.push({
      check: 'seller-payment-link',
      detail: 'the PR payment link does not appear among the live /sell offers — seller link changed or missing',
    });
  }

  return {
    healthy: issues.length === 0,
    issues,
    catalog: {
      schema: String(embedded.schema),
      ...(embedded.repository !== undefined ? { repository: embedded.repository } : {}),
      releases: releases.map((entry) => ({
        version: String(entry.version),
        ...(entry.status !== undefined ? { status: entry.status } : {}),
        offers: entry.offers ?? [],
      })),
    },
  };
}
