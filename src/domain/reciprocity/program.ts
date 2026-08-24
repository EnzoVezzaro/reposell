/**
 * Reciprocity Program (seller-configured, buyer-enforced).
 *
 * THE FUNDAMENTAL DISTINCTION:
 *   The seller defines Reciprocity rules FOR THE FORKS GENERATED FROM
 *   PURCHASES of their /sell package. The seller's own repository and
 *   revenue are NOT subject to those rules unless the seller separately
 *   opts in (`apply_to_own_use`).
 *
 * A purchased fork carries the program manifest; if that fork becomes
 * commercially successful (crosses the threshold), it contributes back —
 * split across the original repository, upstream dependencies, and
 * contributors — making commercially successful forks give back to the
 * ecosystem that made them possible.
 */

import { createHash } from 'crypto';

export const RECIPROCITY_SCHEMA = 'reposell/reciprocity/v1';

export type ContributionBasis = 'revenue';
export type ThresholdPeriod = 'annual' | 'lifetime';
export type RecipientId = 'original_repository' | 'dependencies' | 'contributors' | 'reposell';

export interface ReciprocityProgram {
  enabled: boolean;
  /** Who the program binds: purchased forks (default) and optionally the seller's own use. */
  applies_to: Array<'purchased-forks' | 'seller-own-use'>;
  threshold: { amount: number; currency: string; period: ThresholdPeriod };
  contribution: { rate: number; basis: ContributionBasis };
  recipients: Array<{ recipient: RecipientId; share: number }>;
}

export interface ProgramValidationIssue {
  field: string;
  issue: string;
}

export interface ValidateProgramResult {
  ok: boolean;
  issues: ProgramValidationIssue[];
}

const RECIPIENT_IDS: readonly string[] = ['original_repository', 'dependencies', 'contributors', 'reposell'];

/**
 * Validates a program. Rules:
 * - recipients are known ids, shares within 0-100, and total exactly 100
 * - rate within 0-100
 * - threshold amount positive, currency 3 letters, known period
 * - at least one applies_to entry when enabled
 */
export function validateProgram(program: ReciprocityProgram): ValidateProgramResult {
  const issues: ProgramValidationIssue[] = [];

  const { threshold, contribution, recipients } = program;
  if (typeof threshold?.amount !== 'number' || !Number.isFinite(threshold.amount) || threshold.amount <= 0) {
    issues.push({ field: 'threshold.amount', issue: 'must be a positive number' });
  }
  if (typeof threshold?.currency !== 'string' || threshold.currency.length !== 3) {
    issues.push({ field: 'threshold.currency', issue: 'must be a 3-letter code' });
  }
  if (threshold?.period !== 'annual' && threshold?.period !== 'lifetime') {
    issues.push({ field: 'threshold.period', issue: 'must be "annual" or "lifetime"' });
  }

  if (typeof contribution?.rate !== 'number' || !Number.isFinite(contribution.rate) || contribution.rate < 0 || contribution.rate > 100) {
    issues.push({ field: 'contribution.rate', issue: 'must be a number between 0 and 100' });
  }
  if (contribution?.basis !== 'revenue') {
    issues.push({ field: 'contribution.basis', issue: 'must be "revenue"' });
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    issues.push({ field: 'recipients', issue: 'at least one recipient is required' });
  } else {
    let total = 0;
    const seen = new Set<string>();
    for (const [index, entry] of recipients.entries()) {
      const path = `recipients[${index}]`;
      if (!RECIPIENT_IDS.includes(entry.recipient)) {
        issues.push({ field: `${path}.recipient`, issue: `unknown recipient "${String(entry.recipient)}"` });
        continue;
      }
      if (seen.has(entry.recipient)) {
        issues.push({ field: `${path}.recipient`, issue: `duplicate recipient "${entry.recipient}"` });
      }
      seen.add(entry.recipient);
      if (typeof entry.share !== 'number' || !Number.isFinite(entry.share) || entry.share <= 0 || entry.share > 100) {
        issues.push({ field: `${path}.share`, issue: 'must be a number between 0 (exclusive) and 100' });
        continue;
      }
      total += entry.share;
    }
    if (Math.round(total) !== 100) {
      issues.push({ field: 'recipients', issue: `shares must total exactly 100 (got ${total})` });
    }
  }

  if (program.enabled && program.applies_to.length === 0) {
    issues.push({ field: 'applies_to', issue: 'enabled program must apply to at least "purchased-forks"' });
  }

  return { ok: issues.length === 0, issues };
}

/** Recursive key sort — canonical at every depth (replacer arrays would
 * filter nested keys and blind the fingerprint to inner rule changes). */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/** Canonical serialization (deep-sorted keys) — deterministic for signing/hashing. */
export function programJson(program: ReciprocityProgram): string {
  return `${JSON.stringify(canonicalize(program), null, 2)}\n`;
}

export function programFingerprint(program: ReciprocityProgram): string {
  return createHash('sha256').update(programJson(program)).digest('hex');
}

/** The manifest that lands inside every purchased fork. */
export interface ReciprocityManifest {
  schema: typeof RECIPROCITY_SCHEMA;
  source: { repository: string; release: string };
  program: ReciprocityProgram;
  fingerprint: string;
}

export function buildReciprocityManifest(input: {
  program: ReciprocityProgram;
  repository: string;
  release: string;
}): ReciprocityManifest {
  return {
    schema: RECIPROCITY_SCHEMA,
    source: { repository: input.repository, release: input.release },
    program: input.program,
    fingerprint: programFingerprint(input.program),
  };
}

export interface ContributionSplit {
  recipient: RecipientId;
  share: number;
  amount: number;
}

export interface ContributionResult {
  /** Whether the threshold is met for the declared period. */
  applicable: boolean;
  basis: ContributionBasis;
  rate: number;
  contributionAmount: number;
  split: ContributionSplit[];
}

/**
 * Pure computation: given the program and a fork's revenue for the period,
 * returns the contribution amount and its split — or `applicable: false`
 * when the threshold has not been met. No I/O, no clock.
 */
export function computeContribution(
  program: ReciprocityProgram,
  facts: { revenue: number },
): ContributionResult {
  const applicable =
    program.enabled &&
    facts.revenue >= program.threshold.amount;
  if (!applicable) {
    return { applicable: false, basis: program.contribution.basis, rate: program.contribution.rate, contributionAmount: 0, split: [] };
  }
  const contributionAmount = Math.round(facts.revenue * program.contribution.rate) / 100;
  const split = program.recipients.map((entry) => ({
    recipient: entry.recipient,
    share: entry.share,
    amount: Math.round(((contributionAmount * entry.share) / 100) * 100) / 100,
  }));
  return { applicable: true, basis: program.contribution.basis, rate: program.contribution.rate, contributionAmount, split };
}
