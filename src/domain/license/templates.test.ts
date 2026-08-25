import { describe, it, expect } from 'vitest';
import {
  renderRslLicense,
  renderForkLicense,
  generateAiPolicy,
  renderAiPolicy,
} from './templates.js';

describe('renderRslLicense', () => {
  const input = { year: '2026', holder: 'Enzo Vezzaro', repository: 'https://github.com/a/b' };

  it('is deterministic — same input, byte-identical output', () => {
    expect(renderRslLicense(input)).toBe(renderRslLicense({ ...input }));
  });

  it('substitutes placeholders with owner info', () => {
    const text = renderRslLicense(input);
    expect(text).toContain('Copyright (c) 2026 Enzo Vezzaro');
    expect(text).not.toContain('[YEAR]');
    expect(text).not.toContain('[COPYRIGHT HOLDER]');
    // No silent legal defaults: the placeholder stays until --jurisdiction is set.
    expect(text).toContain('[JURISDICTION]');
  });

  it('contains all 22 sections and the AI prohibitions', () => {
    const text = renderRslLicense(input);
    for (let section = 1; section <= 22; section += 1) {
      expect(text).toContain(`${section}. `);
    }
    expect(text).toContain('AI TRAINING PROHIBITION');
    expect(text).toContain('NON-CONSENSUAL AI SCRAPING');
  });

  it('ends with exactly one trailing newline', () => {
    const text = renderRslLicense(input);
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
  });
});

describe('renderForkLicense', () => {
  it('includes every binding field', () => {
    const text = renderForkLicense({
      licenseId: 'lic_123',
      productName: 'widget',
      repository: 'https://github.com/a/b',
      owner: 'Enzo Vezzaro',
      licensee: 'Buyer Inc',
      release: 'v1.2.3 @ abcdef',
      forkUrl: 'https://github.com/buyer/widget',
      issued: '2026-01-01',
      expiration: 'perpetual',
    });
    for (const field of ['lic_123', 'widget', 'Buyer Inc', 'v1.2.3 @ abcdef', 'perpetual']) {
      expect(text).toContain(field);
    }
    expect(text).toContain('Unauthorized copies are not covered by this License.');
  });
});

describe('ai-policy', () => {
  it('denies AI uses but allows development agents', () => {
    const policy = generateAiPolicy();
    expect(policy.ai.training).toBe(false);
    expect(policy.ai.code_scraping).toBe(false);
    expect(policy.text_and_data_mining.non_commercial).toBe(false);
    expect(policy.automated_agents.development_use).toBe(true);
    expect(policy.automated_agents.retention_for_training).toBe(false);
  });

  it('renders valid JSON deterministically', () => {
    const a = renderAiPolicy();
    const b = renderAiPolicy(generateAiPolicy());
    expect(a).toBe(b);
    expect(JSON.parse(a)).toEqual(generateAiPolicy());
  });
});
