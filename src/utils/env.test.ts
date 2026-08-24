import { describe, it, expect } from 'vitest';
import { parseEnvFile, resolveValue } from './env.js';

describe('parseEnvFile', () => {
  it('parses KEY=VALUE lines and ignores comments', () => {
    const parsed = parseEnvFile(
      ['# reposell test keys', 'STRIPE_SECRET_KEY=sk_test_abc123', '', 'QUOTED="with spaces"'].join('\n'),
    );
    expect(parsed).toEqual({
      STRIPE_SECRET_KEY: 'sk_test_abc123',
      QUOTED: 'with spaces',
    });
  });

  it('ignores malformed lines without an = sign', () => {
    expect(parseEnvFile('JUST_A_WORD\nOK=1')).toEqual({ OK: '1' });
  });
});

describe('resolveValue precedence', () => {
  const base = { processEnv: { STRIPE_SECRET_KEY: 'sk_test_from_process' }, envFileValues: {} };

  it('prefers process env over .env file', () => {
    const source = { ...base, envFileValues: { STRIPE_SECRET_KEY: 'sk_test_from_file' } };
    expect(resolveValue(source, 'STRIPE_SECRET_KEY')).toBe('sk_test_from_process');
  });

  it('falls back to .env file when process env is missing', () => {
    const source = { processEnv: {}, envFileValues: { STRIPE_SECRET_KEY: 'sk_test_from_file' } };
    expect(resolveValue(source, 'STRIPE_SECRET_KEY')).toBe('sk_test_from_file');
  });

  it('returns undefined when missing everywhere', () => {
    const source = { processEnv: {}, envFileValues: {} };
    expect(resolveValue(source, 'STRIPE_SECRET_KEY')).toBeUndefined();
  });

  it('treats empty strings as missing', () => {
    const source = { processEnv: { STRIPE_SECRET_KEY: '' }, envFileValues: { STRIPE_SECRET_KEY: 'sk_test_file' } };
    expect(resolveValue(source, 'STRIPE_SECRET_KEY')).toBe('sk_test_file');
  });
});
