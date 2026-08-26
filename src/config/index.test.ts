import { describe, it, expect } from 'vitest';
import { validateConfig } from './index.js';

describe('listing section', () => {
  it('parses enabled flag and contribution', () => {
    const { config, issues } = validateConfig({
      listing: { enabled: true, contribution: { amount: 10, currency: 'usd' } },
    });
    expect(issues).toEqual([]);
    expect(config.listing).toEqual({
      enabled: true,
      contribution: { amount: 10, currency: 'USD' },
    });
  });

  it('rejects non-positive amounts and non-boolean flags', () => {
    const { issues } = validateConfig({
      listing: { enabled: 'yes', contribution: { amount: -5 } },
    });
    expect(issues).toContain('listing.enabled must be a boolean');
    expect(issues).toContain('listing.contribution.amount must be a positive number');
  });

  it('accepts a bare opt-in without contribution', () => {
    const { config, issues } = validateConfig({ listing: { enabled: false } });
    expect(issues).toEqual([]);
    expect(config.listing).toEqual({ enabled: false });
  });
});
