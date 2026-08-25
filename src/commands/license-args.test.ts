import { describe, it, expect } from 'vitest';
import { parseLicenseArgs, LicenseArgsError } from './license-args.js';

describe('parseLicenseArgs', () => {
  it('parses check with no flags', () => {
    expect(parseLicenseArgs(['check'])).toMatchObject({ action: 'check', force: false });
  });

  it('accepts the rsl flavor positional after use', () => {
    const args = parseLicenseArgs(['use', 'rsl', '--holder', 'Jane Doe']);
    expect(args).toMatchObject({ action: 'use', holder: 'Jane Doe' });
  });

  it('rejects a flavor positional on other actions or unknown flavors', () => {
    expect(() => parseLicenseArgs(['check', 'rsl'])).toThrow(/unknown argument/);
    expect(() => parseLicenseArgs(['use', 'mit'])).toThrow(/unknown argument/);
  });

  it('parses use with all flags', () => {
    const args = parseLicenseArgs([
      'use',
      '--holder',
      'Enzo Vezzaro',
      '--repo-url',
      'auto',
      '--year',
      '2026',
      '--force',
      '--no-policy',
    ]);
    expect(args).toMatchObject({
      action: 'use',
      holder: 'Enzo Vezzaro',
      repository: 'auto',
      year: '2026',
      force: true,
      noPolicy: true,
    });
  });

  it('rejects unknown actions and flags', () => {
    expect(() => parseLicenseArgs(['fly'])).toThrow(LicenseArgsError);
    expect(() => parseLicenseArgs(['check', '--wat'])).toThrow(/unknown flag/);
    expect(() => parseLicenseArgs(['use', '--holder'])).toThrow(/--holder requires/);
  });
});
