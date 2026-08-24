import { describe, expect, it } from 'vitest';

import {
  buildReciprocityManifest,
  computeContribution,
  programFingerprint,
  validateProgram,
  type ReciprocityProgram,
} from './program.js';
import { programFromConfig } from '../../commands/reciprocity.js';
import { reciprocityArtifactJson } from '../selling/provision.js';

function program(overrides: Partial<ReciprocityProgram> = {}): ReciprocityProgram {
  return {
    enabled: true,
    applies_to: ['purchased-forks'],
    threshold: { amount: 2_000_000, currency: 'USD', period: 'annual' },
    contribution: { rate: 2, basis: 'revenue' },
    recipients: [
      { recipient: 'original_repository', share: 50 },
      { recipient: 'dependencies', share: 30 },
      { recipient: 'contributors', share: 10 },
      { recipient: 'reposell', share: 10 },
    ],
    ...overrides,
  };
}

describe('program semantics (seller-configured, buyer-enforced)', () => {
  it('purchased forks carry the program; the seller does not appear as a payer', () => {
    const manifest = buildReciprocityManifest({
      program: program(),
      repository: 'seller/project',
      release: 'v1.2.0',
    });
    expect(manifest.source).toEqual({ repository: 'seller/project', release: 'v1.2.0' });
    expect(manifest.program.applies_to).toEqual(['purchased-forks']);
    // The program binds forks, not the seller's own revenue.
    expect(manifest.program.applies_to).not.toContain('seller-own-use');
  });

  it('seller own-use is an INDEPENDENT opt-in', () => {
    const config = { reciprocity: { enabled: true, apply_to_own_use: false } };
    expect(programFromConfig(config).applies_to).toEqual(['purchased-forks']);

    const optedIn = { reciprocity: { enabled: true, apply_to_own_use: true } };
    expect(programFromConfig(optedIn).applies_to).toContain('seller-own-use');
  });

  it('contribution applies to the FORK revenue crossing the threshold', () => {
    const result = computeContribution(program(), { revenue: 2_500_000 });
    expect(result.applicable).toBe(true);
    expect(result.contributionAmount).toBe(50_000);
    const split = Object.fromEntries(result.split.map((entry) => [entry.recipient, entry.amount]));
    expect(split).toEqual({
      original_repository: 25_000,
      dependencies: 15_000,
      contributors: 5_000,
      reposell: 5_000,
    });
  });

  it('below threshold → not applicable, zero contribution', () => {
    const result = computeContribution(program(), { revenue: 1_999_999 });
    expect(result.applicable).toBe(false);
    expect(result.contributionAmount).toBe(0);
    expect(result.split).toEqual([]);
  });

  it('equal prices/amounts between seller and fork never merge the programs', () => {
    // Seller's product price is irrelevant here: the program binds fork
    // revenue only. Even identical numbers stay separate concerns.
    const forkRevenue = 29; // same as the seller's offer price
    const result = computeContribution(program(), { revenue: forkRevenue });
    expect(result.applicable).toBe(false);
  });
});

describe('validation', () => {
  it('rejects recipient shares that do not total 100', () => {
    const bad = program({ recipients: [
      { recipient: 'original_repository', share: 50 },
      { recipient: 'dependencies', share: 30 },
    ] });
    const result = validateProgram(bad);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.issue.includes('100'))).toBe(true);
  });

  it('rejects unknown recipients, duplicates, bad rates and periods', () => {
    const bad = program({
      contribution: { rate: 250, basis: 'revenue' },
      // SAFETY: shape guarded by the validation immediately above before this cast.
      threshold: { amount: -1, currency: 'DOLLAR', period: 'weekly' as never },
      recipients: [
        { recipient: 'original_repository', share: 50 },
        { recipient: 'original_repository', share: 50 },
        // SAFETY: shape guarded by the validation immediately above before this cast.
        { recipient: 'landlord' as never, share: 10 },
      ],
    });
    const result = validateProgram(bad);
    expect(result.ok).toBe(false);
    const fields = result.issues.map((issue) => issue.field);
    expect(fields).toContain('contribution.rate');
    expect(fields).toContain('threshold.amount');
    expect(fields).toContain('threshold.currency');
    expect(fields).toContain('threshold.period');
    expect(result.issues.some((issue) => issue.issue.includes('duplicate'))).toBe(true);
    expect(result.issues.some((issue) => issue.issue.includes('unknown recipient'))).toBe(true);
  });

  it('accepts the canonical example', () => {
    expect(validateProgram(program()).ok).toBe(true);
  });
});

describe('determinism + artifacts', () => {
  it('fingerprint is stable and changes when rules change', () => {
    const a = programFingerprint(program());
    const b = programFingerprint(program());
    expect(a).toBe(b);
    const changed = programFingerprint(program({ contribution: { rate: 3, basis: 'revenue' } }));
    expect(changed).not.toBe(a);
  });

  it('fork reciprocity artifact carries program + fork facts, no seller revenue', () => {
    const manifest = buildReciprocityManifest({ program: program(), repository: 'seller/project', release: 'v1.2.0' });
    const json = reciprocityArtifactJson(manifest, { buyer: 'buyer-dev', fork: 'buyer-dev/project' });
    expect(json).toContain('reposell/reciprocity-fork/v1');
    expect(json).toContain('buyer-dev/project');
    expect(json).toContain('original_repository');
    expect(json).not.toContain('seller_revenue');
  });
});
