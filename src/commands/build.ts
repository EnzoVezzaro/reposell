/**
 * `reposell build` — generate the /reposell/* surface (spec §27).
 */

import { ConfigInvalidError, ConfigNotFoundError } from '../app/config-service.js';
import { buildSite, type BuildOptions, type BuildResult } from '../app/build-service.js';

export interface BuildCommandResult {
  ok: boolean;
  report: string;
  result?: BuildResult;
}

export async function buildCommand(cwd: string, options: BuildOptions = {}): Promise<BuildCommandResult> {
  try {
    const result = await buildSite(cwd, options);
    const totalBytes = result.written.reduce((sum, file) => sum + file.bytes, 0);
    const report = [
      `✓ Built ${result.written.length} files (${totalBytes} bytes) → ${result.outRoot}`,
      result.signed ? '✓ Signed with Ed25519 (signature.json)' : '⚠ Unsigned — set REPOSELL_SIGNING_KEY to enable integrity',
      result.availableTags.length > 0 ? `Available: ${result.availableTags.join(', ')}` : 'No purchasable releases',
      result.blockedTags.length > 0 ? `Blocked: ${result.blockedTags.join(', ')}` : '',
    ]
      .filter((line) => line.length > 0)
      .join('\n');
    return { ok: true, report, result };
  } catch (error) {
    if (error instanceof ConfigNotFoundError || error instanceof ConfigInvalidError) {
      return { ok: false, report: `✗ ${error.message}` };
    }
    throw error;
  }
}
