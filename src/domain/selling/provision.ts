/**
 * Buyer fork provisioning artifacts (spec §14, D7): after the seller's
 * transaction succeeds, the seller's workflow provisions the buyer's
 * licensed fork. This module generates the deterministic artifacts the
 * fork receives — the actual GitHub fork API call stays in the seller's
 * CI (token-gated), never in the CLI.
 *
 * The fork is bound to: buyer + seller repository + specific release +
 * license scheme + purchase session + price schema.
 */

import { createHash } from 'crypto';

import type { ReciprocityManifest } from '../reciprocity/program.js';

export interface PurchaseFacts {
  buyer: string;
  buyerEmail?: string;
  repository: string;
  release: string;
  scheme: string;
  /** License terms bound into the fork — decided by the repository owner. */
  license?: string;
  amount: number;
  currency: string;
  session: string;
  paymentIntent?: string;
}

export const PURCHASE_SCHEMA = 'reposell/purchase/v1';

export interface PurchaseArtifact {
  schema: typeof PURCHASE_SCHEMA;
  purchase: {
    buyer: string;
    buyer_email?: string;
    session: string;
    payment_intent?: string;
    amount: number;
    currency: string;
  };
  entitlement: {
    repository: string;
    release: string;
    scheme: string;
    license?: string;
    licensed_fork: string;
  };
  fingerprint: string;
}

/**
 * Deterministic purchase artifact: same facts → byte-identical output.
 * The fingerprint binds buyer + repository + release + scheme + session.
 */
export function buildPurchaseArtifact(facts: PurchaseFacts): PurchaseArtifact {
  const fingerprint = createHash('sha256')
    .update(
      [
        facts.buyer,
        facts.repository,
        facts.release,
        facts.scheme,
        facts.session,
        facts.amount.toFixed(2),
        facts.currency.toLowerCase(),
      ].join('\u0000'),
    )
    .digest('hex');
  return {
    schema: PURCHASE_SCHEMA,
    purchase: {
      buyer: facts.buyer,
      ...(facts.buyerEmail !== undefined ? { buyer_email: facts.buyerEmail } : {}),
      session: facts.session,
      ...(facts.paymentIntent !== undefined ? { payment_intent: facts.paymentIntent } : {}),
      amount: facts.amount,
      currency: facts.currency,
    },
    entitlement: {
      repository: facts.repository,
      release: facts.release,
      scheme: facts.scheme,
      ...(facts.license !== undefined ? { license: facts.license } : {}),
      licensed_fork: `${facts.buyer}/${facts.repository.split('/').pop() ?? 'fork'}`,
    },
    fingerprint,
  };
}

/** Canonical JSON for REPOSELL-PURCHASE.json (deterministic, signable). */
export function purchaseArtifactJson(artifact: PurchaseArtifact): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

/**
 * REPOSELL-RECIPROCITY.json — the seller's Reciprocity Program as carried
 * by the purchased fork. SELLER-CONFIGURED, BUYER-ENFORCED: the program
 * binds the FORK (if it becomes commercially successful it gives back);
 * it never binds the seller's own repository or revenue unless the seller
 * separately opted in via apply_to_own_use.
 */
export function reciprocityArtifactJson(
  manifest: ReciprocityManifest,
  forkFacts: { buyer: string; fork: string },
): string {
  const doc = {
    schema: 'reposell/reciprocity-fork/v1',
    fork: { buyer: forkFacts.buyer, name: forkFacts.fork },
    source: manifest.source,
    program: manifest.program,
    program_fingerprint: manifest.fingerprint,
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}

/**
 * Revocation marker content: refunded purchases flip the record to revoked
 * while keeping history verifiable (never delete — §15 semantics).
 */
export function revocationMarker(artifact: PurchaseArtifact, reason: string): string {
  return `${purchaseArtifactJson(artifact)}<!-- REVOKED: ${escapeComment(reason)} -->\n`;
}

function escapeComment(reason: string): string {
  return reason.replaceAll('--', '\\-\\-');
}
