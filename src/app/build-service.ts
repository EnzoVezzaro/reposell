/**
 * Static site generator for the /reposell/* protocol surface (spec §4, §27,
 * §53). Owns ONLY its output namespace: <out>/reposell/** — never touches
 * developer files (spec §26).
 *
 * Pipeline per CI run: load config -> evaluate every release independently
 * (§10 isolation) -> render deterministic JSON + HTML documents -> sign the
 * file set when a signing key is configured (§21) -> write tree.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ConfigNotFoundError, loadConfigFile } from './config-service.js';
import { LicenseService } from './license-service.js';
import { detectGitInfo } from '../utils/git.js';
import { resolveValue, type EnvSource } from '../utils/env.js';
import {
  buildHealthDoc,
  buildMarketplaceDoc,
  buildProtocolIndex,
  buildReleaseManifest,
  buildReleasesIndex,
  buildRepoManifest,
  type HealthChecks,
  type ReleasesIndexEntry,
} from '../domain/protocol/documents.js';
import { verifyPaymentLinkAgainstPricing } from '../domain/payment/stripe-links.js';
import type { FetchLike } from '../domain/payment/stripe.js';
import { evaluateRelease, type DeepLinkOutcome, type OfferDeepLink, type ReleaseEvaluation } from './evaluate-release.js';
import { resolveOffers, type ResolvedOffer } from '../domain/licensing/schemes.js';
import { activePolicy } from './license-compose-service.js';
import { policyHash } from '../domain/licensing/policy.js';
import { resolveSigningKey, signBuild } from './signing-service.js';
import {
  renderLandingPage,
  renderMarketplacePage,
  renderSellPage,
} from './pages.js';
import type { LicenseCheckResult } from './license-service.js';

type OfferResolutionOffer = ResolvedOffer;

export interface BuildOptions {
  outDir?: string;
  env?: Record<string, string | undefined>;
  fetchImpl?: FetchLike;
  licenseCheck?: LicenseCheckResult;
}

export interface BuildResult {
  outRoot: string;
  written: Array<{ path: string; bytes: number }>;
  evaluations: ReleaseEvaluation[];
  signed: boolean;
  availableTags: string[];
  blockedTags: string[];
}

function licenseGateMode(check: LicenseCheckResult): 'ok' | 'missing' | 'unrecognized' {
  if (check.status === 'missing') return 'missing';
  if (check.status === 'unrecognized') return 'unrecognized';
  return 'ok';
}

async function deepLinkOutcome(input: {
  offer: OfferResolutionOffer;
  envSource: EnvSource;
  fetchImpl?: FetchLike;
}): Promise<DeepLinkOutcome | undefined> {
  const linkId = input.offer.paymentLinkId;
  const amount = input.offer.amount;
  const currency = input.offer.currency;
  if (linkId === undefined || amount === undefined || currency === undefined) return undefined;

  const apiKey =
    resolveValue(input.envSource, 'REPOSELL_STRIPE_SECRET_KEY') ??
    resolveValue(input.envSource, 'STRIPE_SECRET_KEY');
  if (apiKey === undefined || !apiKey.startsWith('sk_')) {
    return { kind: 'not-configured' };
  }

  const result = await verifyPaymentLinkAgainstPricing({
    apiKey,
    paymentLinkId: linkId,
    pricing: {
      amount,
      currency,
      billing: input.offer.billing,
      ...(input.offer.interval !== undefined ? { interval: input.offer.interval } : {}),
    },
    ...(input.fetchImpl !== undefined ? { fetchImpl: input.fetchImpl } : {}),
  });

  if (result.status === 'verified') return { kind: 'verified' };
  if (result.status === 'mismatch' || result.status === 'inactive' || result.status === 'not_found') {
    return { kind: 'failed', detail: result.detail ?? result.status };
  }
  return { kind: 'unavailable', detail: result.detail ?? result.status };
}

export interface RepositoryEvaluation {
  config: Awaited<ReturnType<typeof loadConfigFile>>['config'];
  outRoot: string;
  repositorySlug: string;
  owner: string;
  repo: string;
  productName: string;
  description: string;
  releaseMode: 'manual' | 'automatic';
  sellEnabled: boolean;
  marketplaceEnabled: boolean;
  licenseSpdx?: string;
  licenseType: string;
  evaluations: ReleaseEvaluation[];
}

/**
 * Shared front half of every command: load config, resolve identity and
 * license, deep-check payment links where credentials permit, evaluate each
 * release independently.
 */
export async function evaluateRepository(
  cwd: string,
  options: BuildOptions = {},
): Promise<RepositoryEvaluation> {
  const env = options.env ?? process.env;
  const outDir = options.outDir ?? 'dist';

  const loaded = await loadConfigFile(cwd);
  const config = loaded.config;

  const gitInfo = await detectGitInfo(cwd, 'github');
  const repositorySlug = `${gitInfo.owner}/${gitInfo.repo}`;

  const licenseService = new LicenseService(cwd);
  const license = options.licenseCheck ?? (await licenseService.check());
  const licenseMode = licenseGateMode(license);

  const releaseMode = config.releases?.mode ?? 'manual';
  const sellEnabled = config.sell?.enabled !== false;
  const marketplaceEnabled = config.marketplace?.enabled === true;
  const productName = config.product?.name ?? gitInfo.repo;
  const description = config.product?.description ?? '';

  const tags = Object.keys(config.releases?.definitions ?? {}).sort();
  const definitions = config.releases?.definitions ?? {};

  // Evaluate every release independently — one unhealthy release never
  // invalidates another (spec §10).
  const evaluations: ReleaseEvaluation[] = [];
  for (const tag of tags) {
    // SAFETY: tag comes from Object.keys of the validated definitions record.
    const definition = definitions[tag];
    if (definition === undefined) continue;
    const resolution = resolveOffers({ definition, schemes: config.licensing?.schemes });
    const offerDeepLinks: OfferDeepLink[] = [];
    for (const offer of resolution.offers) {
      const outcome = await deepLinkOutcome({
        offer,
        envSource: { processEnv: env, envFileValues: {} },
        ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
      });
      if (outcome !== undefined) offerDeepLinks.push({ scheme: offer.scheme, outcome });
    }
    evaluations.push(
      evaluateRelease({
        tag,
        definition,
        releaseMode,
        licenseMode,
        ...(config.licensing?.schemes !== undefined ? { schemes: config.licensing.schemes } : {}),
        offerDeepLinks,
        integrity: resolveSigningKeyQuietly(env) ? 'valid' : 'unsigned',
      }),
    );
  }

  return {
    config,
    outRoot: path.join(cwd, outDir, 'reposell'),
    repositorySlug,
    owner: gitInfo.owner,
    repo: gitInfo.repo,
    productName,
    description,
    releaseMode,
    sellEnabled,
    marketplaceEnabled,
    ...(license.spdx !== undefined ? { licenseSpdx: license.spdx } : {}),
    licenseType: config.license?.mode === 'rsl-1.0' ? 'reposell' : (license.spdx ?? 'unlicensed'),
    evaluations,
  };
}

export async function buildSite(cwd: string, options: BuildOptions = {}): Promise<BuildResult> {
  const env = options.env ?? process.env;
  const evaluation = await evaluateRepository(cwd, options);
  const outRoot = evaluation.outRoot;

  const publicEvaluations = evaluation.evaluations.filter((item) => isPublic(item, evaluation.releaseMode));
  const catalogEntries: ReleasesIndexEntry[] = publicEvaluations.map((item) => ({
    version: item.tag,
    price: firstOfferPrice(item),
    currency: firstOfferCurrency(item),
    status: item.available ? 'available' : 'blocked',
    health: item.health,
    offers: catalogOffers(item),
  }));

  const latestPublished = publicEvaluations
    .filter((item) => item.state === 'published')
    .sort((a, b) => b.tag.localeCompare(a.tag))[0];

  // ---- Render deterministic document set -------------------------------
  // License policy hash (when a policy exists) is bound into every release
  // manifest — license + policy + release metadata travel together (§30).
  const activePolicyDoc = await activePolicy(cwd, { licensing: evaluation.config.licensing === undefined ? undefined : { policy: undefined } }).catch(() => undefined);
  const policyHashHex = activePolicyDoc === undefined ? undefined : policyHash(activePolicyDoc);
  const files: Record<string, string> = {};

  files['index.json'] = stableJson(buildProtocolIndex());

  files['manifest.json'] = stableJson(
    buildRepoManifest({
      identity: {
        owner: evaluation.owner,
        name: evaluation.repo,
        url: `https://github.com/${evaluation.repositorySlug}`,
      },
      product: { name: evaluation.productName, description: evaluation.description },
      releaseMode: evaluation.releaseMode,
      sellEnabled: evaluation.sellEnabled,
      marketplaceEnabled: evaluation.marketplaceEnabled,
    }),
  );

  const overallChecks: HealthChecks = aggregateChecks(publicEvaluations);
  files['health.json'] = stableJson(
    buildHealthDoc({
      repositorySlug: evaluation.repositorySlug,
      ...(latestPublished !== undefined ? { release: latestPublished.tag } : {}),
      checks: overallChecks,
    }),
  );

  files['marketplace.json'] = stableJson(
    buildMarketplaceDoc({ repositorySlug: evaluation.repositorySlug, enabled: evaluation.marketplaceEnabled }),
  );
  files['marketplace/index.html'] = renderMarketplacePage({
    repositorySlug: evaluation.repositorySlug,
    enabled: evaluation.marketplaceEnabled,
    listingUrl: null,
  });

  files['releases/index.json'] = stableJson(buildReleasesIndex(catalogEntries));

  for (const item of publicEvaluations) {
    const dir = `releases/${item.tag}`;
    const offers = resolvedOffers(item);
    const primary = offers[0];
    files[`${dir}/manifest.json`] = stableJson(
      buildReleaseManifest({
        repositorySlug: evaluation.repositorySlug,
        version: item.tag,
        tag: item.tag,
        pricing: {
          amount: primary?.amount ?? 0,
          currency: primary?.currency ?? 'USD',
        },
        paymentLink: primary?.paymentLink ?? '',
        licenseType: evaluation.licenseType,
        offers: offers.map((offer) => ({
          scheme: offer.scheme,
          name: offer.name,
          billing: offer.billing,
          ...(offer.interval !== undefined ? { interval: offer.interval } : {}),
          ...(offer.seats !== undefined ? { seats: offer.seats } : {}),
          pricing: { amount: offer.amount ?? 0, currency: offer.currency ?? 'USD' },
          payment: {
            provider: 'stripe' as const,
            payment_link: offer.paymentLink ?? '',
          },
        })),
        ...(policyHashHex !== undefined ? { licensePolicyHash: policyHashHex } : {}),
      }),
    );
    files[`${dir}/health.json`] = stableJson({
      ...item.healthDoc,
      repository: evaluation.repositorySlug,
    });
  }

  const availableEntries = catalogEntries.filter((entry) => entry.status === 'available');
  const customSell = await renderCustomStorefront({
    cwd,
    repositorySlug: evaluation.repositorySlug,
    repositoryUrl: `https://github.com/${evaluation.repositorySlug}`,
    catalogEntries,
  });
  files['sell/index.html'] =
    customSell ??
    renderSellPage({
      productName: evaluation.productName,
      description: evaluation.description,
      entries: catalogEntries,
    });

  files['index.html'] = renderLandingPage({
    productName: evaluation.productName,
    description: evaluation.description,
    owner: evaluation.owner,
    repo: evaluation.repo,
    releaseCount: availableEntries.length,
    sellEnabled: evaluation.sellEnabled,
    marketplaceEnabled: evaluation.marketplaceEnabled,
  });

  // ---- Sign when configured (spec §21); signature covers all files above.
  let signed = false;
  if (resolveSigningKeyQuietly(env)) {
    const privateKey = resolveSigningKey(env);
    const { rendered } = await signBuild({ files, privateKey });
    files['signature.json'] = rendered;
    signed = true;
  }

  // ---- Write tree (namespace-isolated writes only) ----------------------
  const written: BuildResult['written'] = [];
  const paths = Object.keys(files).sort();
  for (const relPath of paths) {
    // SAFETY: relPath comes from Object.keys of the local files record.
    const content: string | undefined = files[relPath];
    if (content === undefined) {
      throw new Error(`internal: missing generated file content for ${relPath}`);
    }
    const target = path.join(outRoot, relPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
    written.push({ path: relPath, bytes: Buffer.byteLength(content) });
  }

  return {
    outRoot,
    written,
    evaluations: evaluation.evaluations,
    signed,
    availableTags: catalogEntries.filter((e) => e.status === 'available').map((e) => e.version),
    blockedTags: catalogEntries.filter((e) => e.status !== 'available').map((e) => e.version),
  };
}

/** Drafts never reach the public surface; published-but-unhealthy stay visible as blocked. */
function isPublic(evaluation: ReleaseEvaluation, releaseMode: 'manual' | 'automatic'): boolean {
  if (releaseMode === 'automatic') return true;
  return evaluation.persistedStatus === 'published';
}

function resolvedOffers(evaluation: ReleaseEvaluation): ResolvedOffer[] {
  return evaluation.gates.offers;
}

function firstOfferPrice(evaluation: ReleaseEvaluation): number {
  return resolvedOffers(evaluation)[0]?.amount ?? 0;
}

function firstOfferCurrency(evaluation: ReleaseEvaluation): string {
  return resolvedOffers(evaluation)[0]?.currency ?? 'USD';
}

function catalogOffers(evaluation: ReleaseEvaluation) {
  return resolvedOffers(evaluation).map((offer) => ({
    scheme: offer.scheme,
    name: offer.name,
    billing: offer.billing,
    ...(offer.interval !== undefined ? { interval: offer.interval } : {}),
    ...(offer.seats !== undefined ? { seats: offer.seats } : {}),
    price: offer.amount ?? 0,
    currency: offer.currency ?? 'USD',
    status: evaluation.available ? ('available' as const) : ('blocked' as const),
    paymentLink: offer.paymentLink,
  }));
}

function aggregateChecks(evaluations: ReleaseEvaluation[]): HealthChecks {
  if (evaluations.length === 0) {
    return { manifest: 'valid', release: 'valid', payment: 'valid', pricing: 'valid', license: 'valid', integrity: 'valid' };
  }
  const names: Array<keyof HealthChecks> = ['manifest', 'release', 'payment', 'pricing', 'license', 'integrity'];
  // SAFETY: shape guarded by the validation immediately above before this cast.
  const checks = {} as HealthChecks;
  for (const name of names) {
    checks[name] = evaluations.every((evaluation) => evaluation.checks[name] === 'valid') ? 'valid' : 'failed';
  }
  return checks;
}

interface StorefrontCoreModule {
  parseStorefrontDocument: (input: unknown) => { ok: boolean; document?: unknown; errors: string[] };
  renderStorefront: (document: unknown, context: unknown) => { html: string };
}

/**
 * Renders sell/index.html from `.reposell/storefront.json` when the seller
 * customized their storefront (Studio output). The core module is an
 * OPTIONAL dependency: absent (published CLI) or invalid document →
 * undefined → caller falls back to the built-in page. Fail-open by design.
 */
export async function renderCustomStorefront(input: {
  cwd: string;
  repositorySlug: string;
  repositoryUrl: string;
  catalogEntries: ReleasesIndexEntry[];
}): Promise<string | undefined> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(input.cwd, '.reposell', 'storefront.json'), 'utf8');
  } catch {
    return undefined;
  }
  let core: StorefrontCoreModule;
  try {
    // SAFETY: optional peer dependency; absence is a supported state.
    // @ts-expect-error — optional peer dependency, not always installed
    core = (await import('@reposell/storefront-core')) as unknown as StorefrontCoreModule;
  } catch {
    console.warn('storefront.json found but @reposell/storefront-core is not installed — using built-in sell page');
    return undefined;
  }
  try {
    const parsed = core.parseStorefrontDocument(JSON.parse(raw) as unknown);
    if (!parsed.ok || parsed.document === undefined) {
      console.warn(`storefront.json invalid (${parsed.errors.join('; ')}) — using built-in sell page`);
      return undefined;
    }
    const context = {
      repositorySlug: input.repositorySlug,
      repositoryUrl: input.repositoryUrl,
      releases: input.catalogEntries,
    };
    // SAFETY: parsed.document validated by parseStorefrontDocument above.
    return core.renderStorefront(parsed.document as never, context as never).html;
  } catch (error) {
    console.warn(`custom storefront render failed (${error instanceof Error ? error.message : String(error)}) — using built-in sell page`);
    return undefined;
  }
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

function resolveSigningKeyQuietly(env: Record<string, string | undefined>): boolean {
  try {
    resolveSigningKey(env);
    return true;
  } catch {
    return false;
  }
}

export { ConfigNotFoundError };
