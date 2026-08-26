import { describe, it, expect } from 'vitest';
import path from 'path';
import { buildStudioEnv, STUDIO_URL, STUDIO_PORT } from './studio.js';

describe('buildStudioEnv', () => {
  it('points the Studio at the project storefront and output dir', () => {
    const cwd = path.resolve('/tmp/some-repo');
    const env = buildStudioEnv(cwd);
    expect(env['REPOSELL_SELL_DIR']).toBe(path.join(cwd, 'sell'));
    expect(env['REPOSELL_STOREFRONT']).toBe(path.join(cwd, '.reposell', 'storefront.json'));
  });
});

describe('constants', () => {
  it('serves on the fixed local port', () => {
    expect(STUDIO_PORT).toBe(5199);
    expect(STUDIO_URL).toBe('http://localhost:5199');
  });
});
