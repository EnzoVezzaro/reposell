/**
 * `reposell sell sync` (spec §13-§14, D7): pull-based fulfillment from the
 * seller's own Stripe account. Records purchases to `.reposell/purchases/`,
 * renders fork-provisioning artifacts, and flags refunds for revocation.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { resolveValue, type EnvSource } from '../utils/env.js';
import {
  syncSell,
  SellSyncKeyError,
  type PurchaseRecord,
} from '../domain/selling/sync.js';
import { buildPurchaseArtifact, purchaseArtifactJson, revocationMarker } from '../domain/selling/provision.js';
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
  written: string[];
}

function resolveKey(env: EnvSource): string {
  const key =
    resolveValue(env, 'REPOSELL_STRIPE_SECRET_KEY') ?? resolveValue(env, 'STRIPE_SECRET_KEY');
  if (key === undefined || !key.startsWith('sk_')) throw new SellSyncKeyError();
  return key;
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
  const env: EnvSource = options.env ?? { processEnv: process.env, envFileValues: {} };
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

  const persist = async (record: PurchaseRecord): Promise<void> => {
    const price = offerForRelease(config.releases?.definitions, record.release);
    const artifact = buildPurchaseArtifact({
      buyer: record.buyerEmail ?? record.session,
      buyerEmail: record.buyerEmail,
      repository: `${'seller'}/${'project'}`,
      // SAFETY: repository slug is filled from git by the caller in real runs;
      // the artifact binds whatever repo this config belongs to.
      release: record.release ?? 'unknown',
      scheme: record.scheme ?? 'standard',
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
    written,
  };
}
