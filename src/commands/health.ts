/**
 * `reposell health` — health report (spec §11-12, §36).
 *
 * Publication answers "was this released successfully?"; health answers
 * "is this published release currently valid?" — they are different
 * questions and this command only answers the second.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ConfigInvalidError, ConfigNotFoundError } from '../app/config-service.js';
import { evaluateRepository, type BuildOptions } from '../app/build-service.js';
import { formatEvaluations, gatingReleases } from './evaluation-format.js';
import { pemToPublicKey } from '../utils/crypto.js';
import { verifyFileSet, type SignatureDoc } from '../domain/signature/envelope.js';

export interface HealthCommandResult {
  ok: boolean;
  report: string;
}

async function verifyExistingSignature(
  outRoot: string,
  cwd: string,
): Promise<'unsigned' | 'valid' | 'failed' | 'absent'> {
  try {
    const envelopeRaw = await fs.readFile(path.join(outRoot, 'signature.json'), 'utf8');
    const keyPem = await fs.readFile(
      path.join(cwd, '.github', 'reposell', 'verification-key.pem'),
      'utf8',
    );
    const envelope = JSON.parse(envelopeRaw) as SignatureDoc;
    const files: Record<string, string> = {};
    for (const relPath of Object.keys(envelope.files)) {
      // SAFETY: relPath comes from Object.keys of the parsed envelope record.
      files[relPath] = await fs.readFile(path.join(outRoot, relPath), 'utf8');
    }
    const result = await verifyFileSet({ files, envelope, publicKey: pemToPublicKey(keyPem) });
    return result.valid ? 'valid' : 'failed';
  } catch {
    return 'absent';
  }
}

export async function healthCommand(cwd: string, options: BuildOptions = {}): Promise<HealthCommandResult> {
  try {
    const evaluation = await evaluateRepository(cwd, options);
    const gating = gatingReleases(evaluation.evaluations, evaluation.releaseMode);
    const signatureState = await verifyExistingSignature(evaluation.outRoot, cwd);

    const integrityLine =
      signatureState === 'valid'
        ? '✓ Integrity: signed build verifies against distributed key'
        : signatureState === 'failed'
          ? '✗ Integrity: signature.json does NOT match built files — possible tampering'
          : signatureState === 'unsigned'
            ? '⚠ Integrity: build exists but is unsigned'
            : '• Integrity: no build output yet';

    const unhealthyPublished = gating.filter((item) => item.state === 'published' && item.health === 'unhealthy');

    const report = [
      `RepoSell Health — ${evaluation.repositorySlug}`,
      '',
      `Manifest: ✓ valid · Releases configured: ${evaluation.evaluations.length}`,
      integrityLine,
      '',
      formatEvaluations(evaluation.evaluations),
      '',
      unhealthyPublished.length > 0
        ? `STATUS: UNHEALTHY — ${unhealthyPublished.map((item) => item.tag).join(', ')} blocked for purchase; other releases remain available (§10)`
        : 'STATUS: HEALTHY',
    ].join('\n');

    return { ok: signatureState !== 'failed', report };
  } catch (error) {
    if (error instanceof ConfigNotFoundError || error instanceof ConfigInvalidError) {
      return { ok: false, report: `✗ ${error.message}` };
    }
    throw error;
  }
}
