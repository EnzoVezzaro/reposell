import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { LicenseService } from './license-service.js';
import { renderRslLicense } from '../domain/license/templates.js';

let cwd: string;
const FIXED_NOW = new Date('2026-06-01T00:00:00Z');

beforeEach(async () => {
  cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'reposell-lic-'));
});

describe('check', () => {
  it('suggests use-rsl when unlicensed', async () => {
    const result = await new LicenseService(cwd).check();
    expect(result.status).toBe('missing');
    expect(result.suggestion).toBe('use-rsl');
  });

  it('reports ok with selling note for MIT', async () => {
    await fs.writeFile(path.join(cwd, 'LICENSE'), 'Permission is hereby granted, free of charge.\n');
    const result = await new LicenseService(cwd).check();
    expect(result.status).toBe('ok');
    expect(result.spdx).toBe('MIT');
    expect(result.sellingNote).toContain('Selling via reposell allowed');
  });
});

describe('use', () => {
  it('writes LICENSE, ai-policy and reposell.yml', async () => {
    const result = await new LicenseService(cwd, () => FIXED_NOW).use({
      holder: 'Enzo Vezzaro',
      repository: 'https://github.com/a/b',
    });
    expect(result.skippedOverwrite).toBe(false);
    expect(result.written).toContain('LICENSE');
    expect(result.written).toContain('.reposell/ai-policy.json');

    const license = await fs.readFile(path.join(cwd, 'LICENSE'), 'utf8');
    expect(license).toBe(renderRslLicense({ year: '2026', holder: 'Enzo Vezzaro', repository: 'https://github.com/a/b' }));

    const policy = JSON.parse(await fs.readFile(path.join(cwd, '.reposell/ai-policy.json'), 'utf8'));
    expect(policy.ai.training).toBe(false);

    const yml = await fs.readFile(path.join(cwd, 'reposell.yml'), 'utf8');
    expect(yml).toContain('mode: rsl-1.0');
  });

  it('refuses to overwrite a hand-written license without force', async () => {
    await fs.writeFile(path.join(cwd, 'LICENSE'), 'Permission is hereby granted, free of charge.\n');
    const result = await new LicenseService(cwd, () => FIXED_NOW).use({ holder: 'X' });
    expect(result.skippedOverwrite).toBe(true);
    expect(result.written).not.toContain('LICENSE');
    expect(await fs.readFile(path.join(cwd, 'LICENSE'), 'utf8')).toContain('free of charge');
  });

  it('overwrites hand-written license only with force', async () => {
    await fs.writeFile(path.join(cwd, 'LICENSE'), 'Permission is hereby granted, free of charge.\n');
    await new LicenseService(cwd, () => FIXED_NOW).use({ holder: 'X', force: true });
    expect(await fs.readFile(path.join(cwd, 'LICENSE'), 'utf8')).toContain('REPOSELL SOURCE LICENSE');
  });

  it('respects --no-policy', async () => {
    const result = await new LicenseService(cwd, () => FIXED_NOW).use({ holder: 'X', withPolicy: false });
    expect(result.written).not.toContain('.reposell/ai-policy.json');
  });
});

describe('keep', () => {
  it('records keep-existing with detected spdx in reposell.yml', async () => {
    await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({ license: 'GPL-3.0-only' }));
    const service = new LicenseService(cwd, () => FIXED_NOW);
    const check = await service.check();
    await service.keep(check.spdx);
    const yml = await fs.readFile(path.join(cwd, 'reposell.yml'), 'utf8');
    expect(yml).toContain('mode: keep-existing');
    expect(yml).toContain('spdx: GPL-3.0-only');
  });
});
