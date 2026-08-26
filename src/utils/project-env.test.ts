import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { upsertEnvValue, ensureGitignored } from './project-env.js';

let cwd: string;

beforeEach(async () => {
  cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'reposell-penv-'));
});

describe('upsertEnvValue', () => {
  it('creates .env when missing', async () => {
    await upsertEnvValue(cwd, 'STRIPE_SECRET_KEY', 'sk_test_123');
    expect(await fs.readFile(path.join(cwd, '.env'), 'utf8')).toContain('STRIPE_SECRET_KEY=sk_test_123');
  });

  it('appends without clobbering existing entries', async () => {
    await fs.writeFile(path.join(cwd, '.env'), 'FOO=bar\nBAZ=qux\n');
    await upsertEnvValue(cwd, 'STRIPE_SECRET_KEY', 'sk_test_123');
    const text = await fs.readFile(path.join(cwd, '.env'), 'utf8');
    expect(text).toContain('FOO=bar');
    expect(text).toContain('BAZ=qux');
    expect(text).toContain('STRIPE_SECRET_KEY=sk_test_123');
  });

  it('replaces an existing value in place', async () => {
    await fs.writeFile(path.join(cwd, '.env'), 'STRIPE_SECRET_KEY=sk_test_old\nFOO=bar\n');
    await upsertEnvValue(cwd, 'STRIPE_SECRET_KEY', 'sk_test_new');
    const text = await fs.readFile(path.join(cwd, '.env'), 'utf8');
    expect(text).not.toContain('sk_test_old');
    expect(text).toContain('STRIPE_SECRET_KEY=sk_test_new');
    expect(text).toContain('FOO=bar');
  });
});

describe('ensureGitignored', () => {
  it('creates a .gitignore containing the entry when missing', async () => {
    const changed = await ensureGitignored(cwd);
    expect(changed).toBe(true);
    expect(await fs.readFile(path.join(cwd, '.gitignore'), 'utf8')).toContain('.env');
  });

  it('appends to an existing .gitignore exactly once', async () => {
    await fs.writeFile(path.join(cwd, '.gitignore'), 'node_modules\n');
    expect(await ensureGitignored(cwd)).toBe(true);
    const text = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    expect(text).toContain('node_modules');
    expect(text).toContain('.env');
    expect(await ensureGitignored(cwd)).toBe(false);
    const after = await fs.readFile(path.join(cwd, '.gitignore'), 'utf8');
    expect(after.match(/^.env$/gm)).toHaveLength(1);
  });
});
