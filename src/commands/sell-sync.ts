/**
 * `reposell sell sync` (spec §13-§14, D7): pull-based fulfillment from the
 * seller's own Stripe account. Records purchases to `.reposell/purchases/`,
 * renders fork-provisioning artifacts, and flags refunds for revocation.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { detectGitInfo } from '../utils/git.js';
import { loadEnvSource, resolveValue, type EnvSource } from '../utils/env.js';
import {
  syncSell,
  SellSyncKeyError,
  type PurchaseRecord,
} from '../domain/selling/sync.js';
import {
  buildPurchaseArtifact,
  purchaseArtifactJson,
  revocationMarker,
} from '../domain/selling/provision.js';
import { buildReciprocityManifest, type ReciprocityProgram } from '../domain/reciprocity/program.js';

export interface SellSyncOptions {
  paymentLinkId?: string;
  env?: EnvSource;
  fetchImpl?: Parameters<typeof syncSell>[0]['fetchImpl'];
  /** Active Reciprocity Program from reposell.yml — carried by every purchased fork. */
  reciprocity?: ReciprocityProgram;
}

export interface SellSyncReport {
  purchased: number;
  refunded: number;
  /** Purchases whose buyer+release entitlement was already provisioned. */
  alreadyEntitled: number;
  written: string[];
}

function resolveKey(env: EnvSource): string {
  const key =
    resolveValue(env, 'REPOSELL_STRIPE_SECRET_KEY') ?? resolveValue(env, 'STRIPE_SECRET_KEY');
  if (key === undefined || !key.startsWith('sk_')) throw new SellSyncKeyError();
  return key;
}

interface ForkLedger {
  // entitlement key (buyer|repo|release|scheme) → first session that created it
  [key: string]: { session: string; provisioned_at: string };
}

const FORKS_LEDGER = 'forks.json';

async function loadForkLedger(purchasesDir: string): Promise<ForkLedger> {
  try {
    // SAFETY: ledger file is written by this command; shape guarded below.
    const raw = JSON.parse(await readFile(path.join(purchasesDir, FORKS_LEDGER), 'utf8')) as ForkLedger;
    return typeof raw === 'object' && raw !== null ? raw : {};
  } catch {
    return {};
  }
}

/**
 * Forks happen exactly ONCE per buyer+release+scheme: the ledger remembers
 * every provisioned fork so repeat purchases by the same buyer never
 * double-provision — they are recorded, but the fork is not recreated.
 */
export function entitlementKey(parts: {
  buyer: string;
  repository: string;
  release: string;
  scheme: string;
}): string {
  return [parts.buyer.toLowerCase(), parts.repository, parts.release, parts.scheme].join('|');
}

function offerForRelease(
  definitions: Record<string, { offers?: Array<{ pricing?: { amount?: number; currency?: string } }> }> | undefined,
  tag: string | undefined,
): { amount: number; currency: string } {
  if (tag === undefined) return { amount: 0, currency: 'USD' };
  const offer = definitions?.[tag]?.offers?.[0];
  return { amount: offer?.pricing?.amount ?? 0, currency: offer?.pricing?.currency ?? 'USD' };
}

export async function sellSyncCommand(cwd: string, options: SellSyncOptions = {}): Promise<SellSyncReport> {
  // Keys saved by init live in .env — merge it under the process env.
  const env: EnvSource =
    options.env ??
    (await (async () => {
      const { loadEnvSource } = await import('../utils/env.js');
      return loadEnvSource(cwd, process.env, async (filePath) => {
        try {
          return await readFile(filePath, 'utf8');
        } catch {
          return undefined;
        }
      });
    })());
  const apiKey = resolveKey(env);

  const result = await syncSell({
    apiKey,
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.paymentLinkId !== undefined ? { paymentLinkId: options.paymentLinkId } : {}),
  });

  const purchasesDir = path.join(cwd, '.reposell', 'purchases');
  await mkdir(purchasesDir, { recursive: true });
  const written: string[] = [];

  const { loadConfigFile } = await import('../app/config-service.js');
  const { config } = await loadConfigFile(cwd);

  // The fork binds to THIS repository and the owner's decided license.
  const git = await detectGitInfo(cwd, 'github').catch(() => ({ owner: 'seller', repo: 'project' }));
  const repositorySlug = `${git.owner}/${git.repo}`;
  const licenseType = config.license?.mode === 'rsl-1.0' ? 'RSL-1.0' : (config.license?.mode ?? 'UNLICENSED');

  const forkLedger = await loadForkLedger(purchasesDir);
  let alreadyEntitled = 0;

  // Dashboard-created Payment Links carry no release metadata — infer the
  // release by matching the session's link, else amount+currency, against
  // recorded offers.
  const tagByLink = new Map<string, string>();
  const tagByAmount = new Map<string, string>();
  for (const [tag, definition] of Object.entries(config.releases?.definitions ?? {})) {
    for (const offer of definition.offers ?? []) {
      const link = offer.payment?.payment_link;
      if (typeof link === 'string' && link.length > 0) tagByLink.set(link, tag);
      if (offer.pricing?.amount !== undefined) {
        tagByAmount.set(
          `${Math.round(offer.pricing.amount * 100)}:${(offer.pricing.currency ?? 'USD').toLowerCase()}`,
          tag,
        );
      }
    }
  }

  const persist = async (record: PurchaseRecord): Promise<void> => {
    if (record.release === undefined) {
      record.release =
        (record.paymentLink !== undefined ? tagByLink.get(record.paymentLink) : undefined) ??
        (record.amountTotal !== undefined
          ? tagByAmount.get(`${record.amountTotal}:${(record.currency ?? 'USD').toLowerCase()}`)
          : undefined);
    }
    const price = offerForRelease(config.releases?.definitions, record.release);
    const artifact = buildPurchaseArtifact({
      buyer: record.buyerEmail ?? record.session,
      buyerEmail: record.buyerEmail,
      repository: repositorySlug,
      release: record.release ?? 'unknown',
      scheme: record.scheme ?? 'standard',
      license: licenseType,
      amount: price.amount,
      currency: price.currency,
      session: record.session,
      paymentIntent: record.paymentIntent,
    });
    const file = path.join(purchasesDir, `${record.session}.json`);
    const content =
      record.status === 'refunded'
        ? revocationMarker(artifact, 'payment refunded')
        : purchaseArtifactJson(artifact);
    await writeFile(file, content);
    written.push(path.relative(cwd, file));

    const entitlement = entitlementKey({
      buyer: artifact.purchase.buyer,
      repository: artifact.entitlement.repository,
      release: artifact.entitlement.release,
      scheme: artifact.entitlement.scheme,
    });

    if (record.status !== 'refunded' && forkLedger[entitlement] !== undefined) {
      // Already provisioned: remember this purchase, never double-fork.
      alreadyEntitled += 1;
      return;
    }

    // Purchased forks carry the seller's Reciprocity Program (buyer-enforced).
    if (options.reciprocity !== undefined && options.reciprocity.enabled) {
      const manifest = buildReciprocityManifest({
        program: options.reciprocity,
        repository: artifact.entitlement.repository,
        release: artifact.entitlement.release,
      });
      const reciprocityFile = path.join(purchasesDir, `${record.session}.reciprocity.json`);
      await writeFile(reciprocityFile, `${JSON.stringify({
        schema: 'reposell/reciprocity-fork/v1',
        fork: { buyer: artifact.purchase.buyer, name: artifact.entitlement.licensed_fork },
        source: manifest.source,
        program: manifest.program,
        program_fingerprint: manifest.fingerprint,
      }, null, 2)}\n`);
      written.push(path.relative(cwd, reciprocityFile));
    }

    if (record.status !== 'refunded') {
      forkLedger[entitlement] = {
        session: record.session,
        provisioned_at: new Date().toISOString(),
      };
      const ledgerFile = path.join(purchasesDir, FORKS_LEDGER);
      await writeFile(ledgerFile, `${JSON.stringify(forkLedger, null, 2)}\n`);
      written.push(path.relative(cwd, ledgerFile));
    }
  };

  for (const record of result.purchased) await persist(record);
  for (const record of result.refunded) {
    const file = path.join(purchasesDir, `${record.session}.json`);
    let existing: string | undefined;
    try {
      existing = await readFile(file, 'utf8');
    } catch {
      existing = undefined;
    }
    if (existing !== undefined && existing.includes('REVOKED')) continue;
    await persist(record);
  }

  return {
    purchased: result.purchased.length,
    refunded: result.refunded.length,
    alreadyEntitled,
    written,
  };
}
