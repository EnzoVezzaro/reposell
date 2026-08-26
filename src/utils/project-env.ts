/**
 * Project-level env file helpers used by the init wizard: persist a secret
 * (e.g. STRIPE_SECRET_KEY) into .env and make sure .env is gitignored so
 * secrets never reach Git.
 */

import { promises as fs } from 'fs';
import path from 'path';

/** Creates or updates `.env`, replacing an existing `${key}=` line in place. */
export async function upsertEnvValue(cwd: string, key: string, value: string): Promise<void> {
  const envPath = path.join(cwd, '.env');
  let lines: string[] = [];
  try {
    const text = await fs.readFile(envPath, 'utf8');
    lines = text.split(/\r?\n/);
  } catch {
    lines = [];
  }

  const entry = `${key}=${value}`;
  const index = lines.findIndex((line) => line.trim().startsWith(`${key}=`));
  if (index >= 0) {
    lines[index] = entry;
  } else {
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    lines.push('', entry);
  }
  await fs.writeFile(envPath, `${lines.join('\n')}\n`);
}

/** Adds `entry` to .gitignore when missing. Returns true when the file changed. */
export async function ensureGitignored(cwd: string, entry = '.env'): Promise<boolean> {
  const gitignorePath = path.join(cwd, '.gitignore');
  let text = '';
  try {
    text = await fs.readFile(gitignorePath, 'utf8');
  } catch {
    text = '';
  }

  const alreadyIgnored = text.split(/\r?\n/).some((line) => line.trim() === entry);
  if (alreadyIgnored) return false;

  const separator = text.length === 0 ? '' : text.endsWith('\n') ? '' : '\n';
  await fs.writeFile(gitignorePath, `${text}${separator}${entry}\n`);
  return true;
}
