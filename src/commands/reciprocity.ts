/**
 * `reposell reciprocity` — show, validate and simulate the seller's
 * Reciprocity Program.
 *
 * SEMANTICS (fundamental): the program binds FORKS CREATED FROM PURCHASES
 * of this /sell package. The seller's own revenue is not subject to it
 * unless `apply_to_own_use: true` is set — that is an independent decision.
 */

import { loadConfigFile } from '../app/config-service.js';
import {
  computeContribution,
  programFingerprint,
  validateProgram,
  type RecipientId,
  type ReciprocityProgram,
} from '../domain/reciprocity/program.js';

const DEFAULT_PROGRAM: ReciprocityProgram = {
  enabled: false,
  applies_to: [],
  threshold: { amount: 0, currency: 'USD', period: 'annual' },
  contribution: { rate: 0, basis: 'revenue' },
  recipients: [],
};

export function programFromConfig(config: {
  reciprocity?: {
    enabled?: boolean;
    apply_to_own_use?: boolean;
    threshold?: { amount?: number; currency?: string; period?: 'annual' | 'lifetime' };
    contribution?: { rate?: number; basis?: 'revenue' };
    recipients?: Array<{ recipient?: RecipientId; share?: number }>;
  };
}): ReciprocityProgram {
  const rec = config.reciprocity ?? {};
  return {
    enabled: rec.enabled ?? false,
    applies_to: [
      // Purchased forks ALWAYS carry the program when enabled (fundamental
      // semantics); the seller's own use only with the explicit opt-in.
      ...((rec.enabled ?? false) ? ['purchased-forks' as const] : []),
      ...((rec.enabled ?? false) && rec.apply_to_own_use === true ? ['seller-own-use' as const] : []),
    ],
    threshold: {
      amount: rec.threshold?.amount ?? 0,
      currency: rec.threshold?.currency ?? 'USD',
      period: rec.threshold?.period ?? 'annual',
    },
    contribution: { rate: rec.contribution?.rate ?? 0, basis: rec.contribution?.basis ?? 'revenue' },
    recipients: (rec.recipients ?? []).map((entry) => ({
      recipient: entry.recipient ?? 'original_repository',
      share: entry.share ?? 0,
    })),
  };
}

export async function reciprocityCommand(cwd: string, argv: string[]): Promise<string> {
  const { config } = await loadConfigFile(cwd);
  const program = config.reciprocity === undefined ? DEFAULT_PROGRAM : programFromConfig(config);
  const validation = validateProgram(program);
  const fingerprint = programFingerprint(program);

  const lines: string[] = [];
  if (program.enabled === false) {
    lines.push('– Reciprocity is disabled. Purchased forks carry no reciprocity program.');
    lines.push('? Enable it under `reciprocity:` in reposell.yml');
  } else {
    lines.push('✓ Reciprocity Program — seller-configured, buyer-enforced');
    lines.push(`  Binds: ${program.applies_to.join(', ')}`);
    lines.push(`  Threshold: ${program.threshold.amount} ${program.threshold.currency} ${program.threshold.period}`);
    lines.push(`  Contribution: ${program.contribution.rate}% of ${program.contribution.basis}`);
    lines.push('  Recipients:');
    for (const entry of program.recipients) {
      lines.push(`    - ${entry.recipient}: ${entry.share}%`);
    }
    lines.push(`  Fingerprint: ${fingerprint.slice(0, 16)}…`);
  }

  // Simulation: --revenue N (the FORK's revenue — never the seller's).
  const flagIndex = argv.indexOf('--revenue');
  if (flagIndex !== -1) {
    const raw = argv[flagIndex + 1];
    const revenue = raw === undefined ? Number.NaN : Number(raw);
    if (!Number.isFinite(revenue) || revenue < 0) {
      lines.push('✗ --revenue must be a non-negative number');
      return lines.join('\n');
    }
    const simulation = computeContribution(program, { revenue });
    if (!simulation.applicable) {
      lines.push(`  Simulation: ${revenue} ${program.threshold.currency} — below threshold (${program.threshold.amount} ${program.threshold.period}), no contribution due`);
    } else {
      lines.push(`  Simulation at ${revenue} ${program.threshold.currency} ${program.threshold.period} revenue:`);
      lines.push(`    contribution (${simulation.rate}%): ${simulation.contributionAmount}`);
      for (const entry of simulation.split) {
        lines.push(`      → ${entry.recipient}: ${entry.amount}`);
      }
    }
  }

  if (!validation.ok) {
    lines.push('');
    lines.push('✗ Program issues:');
    for (const issue of validation.issues) lines.push(`  - ${issue.field}: ${issue.issue}`);
  }
  return lines.join('\n');
}
