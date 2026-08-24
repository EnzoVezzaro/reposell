import { describe, it, expect } from 'vitest';
import { classifyLicenseText, parseSpdxExpression, detectLicense } from './detect.js';

const MIT = `MIT License

Copyright (c) 2026 Someone

Permission is hereby granted, free of charge, to any person obtaining a copy.
`;

const APACHE = `                                 Apache License
                           Version 2.0, January 2004
`;

describe('classifyLicenseText', () => {
  it('classifies MIT', () => {
    expect(classifyLicenseText(MIT)).toBe('MIT');
  });
  it('classifies Apache-2.0', () => {
    expect(classifyLicenseText(APACHE)).toBe('Apache-2.0');
  });
  it('classifies our own RSL-1.0', () => {
    expect(classifyLicenseText('REPOSELL SOURCE LICENSE\nVersion 1.0')).toBe('RSL-1.0');
  });
  it('classifies Fork License', () => {
    expect(classifyLicenseText('REPOSELL FORK LICENSE\nVersion 1.0')).toBe('FORK-1.0');
  });
  it('returns undefined for unknown text', () => {
    expect(classifyLicenseText('Do whatever you want forever, signed nobody')).toBeUndefined();
  });
});

describe('parseSpdxExpression', () => {
  it('parses plain identifiers', () => {
    expect(parseSpdxExpression('MIT')).toBe('MIT');
    expect(parseSpdxExpression('Apache-2.0')).toBe('Apache-2.0');
  });
});

describe('detectLicense', () => {
  const makeInput = (
    files: Record<string, string | undefined>,
    manifests: Parameters<typeof detectLicense>[0]['manifests'],
  ) => ({
    fileExists: async (name: string) => name in files,
    readFileText: async (name: string) => files[name],
    manifests,
  });

  it('detects MIT from LICENSE with ok status', async () => {
    const result = await detectLicense(makeInput({ LICENSE: MIT }, async () => ({})));
    expect(result).toMatchObject({ status: 'ok', spdx: 'MIT', source: 'file', file: 'LICENSE' });
  });

  it('reports unrecognized for unknown file text', async () => {
    const result = await detectLicense(makeInput({ LICENSE: 'mine now' }, async () => ({})));
    expect(result.status).toBe('unrecognized');
  });

  it('falls back to package.json license field', async () => {
    const result = await detectLicense(
      makeInput({}, async () => ({ packageJson: JSON.stringify({ license: 'Apache-2.0' }) })),
    );
    expect(result).toMatchObject({ status: 'ok', spdx: 'Apache-2.0', source: 'manifest' });
  });

  it('ignores malformed package.json instead of crashing', async () => {
    const result = await detectLicense(makeInput({}, async () => ({ packageJson: '{not json' })));
    expect(result.status).toBe('missing');
  });

  it('reads Cargo.toml license key', async () => {
    const result = await detectLicense(
      makeInput({}, async () => ({ cargoToml: '[package]\nname="x"\nlicense = "MIT"\n' })),
    );
    expect(result.spdx).toBe('MIT');
  });

  it('returns missing when nothing found', async () => {
    const result = await detectLicense(makeInput({}, async () => ({})));
    expect(result.status).toBe('missing');
  });
});
