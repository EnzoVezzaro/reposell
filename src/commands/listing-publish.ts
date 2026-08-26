/**
 * `reposell listing publish <tag>` — prepare a Listing publication request.
 *
 * Builds the reposell-listing/v1 PR payload from the seller's own config,
 * validates it fail-closed, health-checks the live /sell page, and writes
 * `.reposell/listing-pr.json` for the Listing PR (D13: the PR carries the
 * pointer; the Listing CI independently verifies everything).
 *
 * The discovery price is the LISTING's own price (default $5 USD per D16).
 * It is structurally independent from the seller's software price — the buyer
 * pays this ON TOP of the seller's price. The seller keeps 100% of their
 * /sell revenue. Community referral economics are not yet implemented.
 */

import { promises as fs } from 'fs';
import path from 'path';

import { loadConfigFile } from '../app/config-service.js';
import { detectGitInfo } from '../utils/git.js';
import { resolveOffers } from '../domain/licensing/schemes.js';
import {
  buildListingPr,
  validateListingPr,
  type ListingPrPayload,
} from '../domain/listing/pr.js';
import { checkSellerSell, type SellHealthIssue } from '../domain/listing/health.js';

export interface ListingPublishArgs {
  tag: string;
  sellUrl?: string;
  discoveryAmount?: number;
  discoveryCurrency?: string;
  skipVerify?: boolean;
}

export class ListingPublishError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join('; '));
    this.name = 'ListingPublishError';
    this.issues = issues;
  }
}

export interface ListingPublishReport {
  payload: ListingPrPayload;
  writtenTo: string;
  healthChecked: boolean;
  healthIssues: SellHealthIssue[];
}

export async function listingPublishCommand(
  cwd: string,
  args: ListingPublishArgs,
): Promise<ListingPublishReport> {
  const { config } = await loadConfigFile(cwd);
  const git = await detectGitInfo(cwd, 'github');

  const definition = config.releases?.definitions?.[args.tag];
  if (definition === undefined) {
    throw new ListingPublishError([`release "${args.tag}" is not configured in reposell.yml`]);
  }

  // Seller payment link comes from the release's FIRST offer (the seller's
  // own Stripe link, already gate-checked by `reposell build`).
  const resolution = resolveOffers({ definition, schemes: config.licensing?.schemes });
  const primaryOffer = resolution.offers[0];
  const sellerPaymentLink = primaryOffer?.paymentLink;
  if (sellerPaymentLink === undefined) {
    throw new ListingPublishError([
      `release "${args.tag}" has no offer with a payment link — run \`reposell release ${args.tag}\` first`,
    ]);
  }

  const sellUrl =
    args.sellUrl ?? `https://${git.owner}.github.io/${git.repo}/sell/`;
  // Contribution preference recorded by the init wizard wins over the $5
  // default (D16); explicit flags win over both.
  const wizardAmount = config.listing?.contribution?.amount;
  const wizardCurrency = config.listing?.contribution?.currency;
  const discoveryAmount = args.discoveryAmount ?? wizardAmount ?? 5;
  const discoveryCurrency = (args.discoveryCurrency ?? wizardCurrency ?? 'USD').toUpperCase();

  // Fetch README from the seller's repo (works for both public and private repos
  // because the CLI runs locally with the user's git credentials).
  let readme: string | undefined;
  try {
    const readmePath = path.join(cwd, 'README.md');
    readme = await fs.readFile(readmePath, 'utf8');
  } catch {
    // README is optional — not all repos have one.
  }

  const payload = buildListingPr({
    repositoryUrl: `https://github.com/${git.owner}/${git.repo}`,
    owner: git.owner,
    repo: git.repo,
    version: args.tag,
    sellUrl,
    sellerPaymentLink,
    discoveryPrice: { amount: discoveryAmount, currency: discoveryCurrency },
    readme,
  });

  const validation = validateListingPr(payload);
  if (!validation.ok) {
    throw new ListingPublishError(validation.issues.map((issue) => `${issue.field}: ${issue.issue}`));
  }

  let healthIssues: SellHealthIssue[] = [];
  let healthChecked = false;
  if (args.skipVerify !== true) {
    healthChecked = true;
    const health = await checkSellerSell({
      sellUrl,
      repository: `${git.owner}/${git.repo}`,
      version: args.tag,
      sellerPaymentLink,
    });
    healthIssues = health.issues;
  }

  const outPath = path.join(cwd, '.reposell', 'listing-pr.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`);

  return { payload, writtenTo: '.reposell/listing-pr.json', healthChecked, healthIssues };
}

export function formatListingPublish(report: ListingPublishReport): string {
  const lines = [
    `✓ Listing PR payload written to ${report.writtenTo}`,
    `  Repository: ${report.payload.repository.url}`,
    `  Release: ${report.payload.release.version}`,
    `  Seller /sell: ${report.payload.sell.url}`,
    `  Discovery price: ${report.payload.listing.discovery_price.amount} ${report.payload.listing.discovery_price.currency} (buyer-paid, on top of seller's price; seller keeps 100%)`,
  ];
  if (!report.healthChecked) {
    lines.push('– Live /sell verification skipped (--skip-verify)');
  } else if (report.healthIssues.length === 0) {
    lines.push('✓ Live /sell health check passed');
  } else {
    lines.push(`✗ Live /sell health check failed (${report.healthIssues.length} issue(s)):`);
    for (const issue of report.healthIssues) lines.push(`    - ${issue.check}: ${issue.detail}`);
    lines.push('  The Listing PR should NOT be opened until these pass (fail-closed).');
  }
  lines.push('! Open the Listing PR with this payload — Listing CI verifies everything independently.');
  return lines.join('\n');
}
