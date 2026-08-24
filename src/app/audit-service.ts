/**
 * `reposell audit` orchestration: scan -> policy -> checks -> verdict ->
 * reports (human + machine) -> SBOMs -> optional Ed25519 signature.
 *
 * Existing tools: scan -> identify -> report.
 * reposell: scan -> understand rights -> apply policy -> PASS/WARN/BLOCKED
 * -> sign the result.
 */

import { promises as fs } from 'fs';
import path from 'path';

import { scanRepository, type ScanResult } from '../domain/audit/scan.js';
import { runAuditChecks, checkPolicyArtifact, type Finding } from '../domain/audit/checks.js';
import { cycloneDxSbom, spdxSbom } from '../domain/audit/sbom.js';
import { parsePolicy } from '../domain/licensing/policy.js';
import { resolveSigningKey, signBuild, SigningKeyMissingError } from './signing-service.js';

export interface AuditOptions {
  strict?: boolean;
  release?: string;
  forbidden?: string[];
}

export interface AuditFinding extends Finding {}

export interface AuditReport {
  verdict: 'PASS' | 'WARN' | 'BLOCKED';
  release?: string;
  projectSpdx?: string;
  filesScanned: number;
  truncated: boolean;
  dependencies: number;
  findings: AuditFinding[];
  artifacts: string[];
  signed: boolean;
}

export async function runAudit(cwd: string, options: AuditOptions = {}): Promise<AuditReport> {
  const scan: ScanResult = await scanRepository(cwd);

  // Policy artifact feeds its own check when present.
  let policyRaw: unknown;
  try {
    policyRaw = JSON.parse(await fs.readFile(path.join(cwd, '.reposell', 'license.json'), 'utf8'));
  } catch {
    policyRaw = undefined;
  }

  const { findings, projectSpdx } = runAuditChecks(scan, options);
  if (policyRaw !== undefined) {
    const index = findings.findIndex((finding) => finding.id === 'license-artifacts');
    const finding = checkPolicyArtifact(policyRaw);
    if (index === -1) findings.push(finding);
    else findings[index] = finding;
  } else {
    const index = findings.findIndex((finding) => finding.id === 'license-artifacts');
    if (index !== -1 && findings[index] !== undefined) {
      findings[index] = {
        id: findings[index].id,
        title: findings[index].title,
        severity: 'warn',
        detail: 'No .reposell/license.json — run `reposell license compose` for machine-readable policies.',
      };
    }
  }

  // Recompute the verdict with the artifact check folded in.
  let finalVerdict: AuditReport['verdict'] = 'PASS';
  for (const finding of findings) {
    const severity = options.strict === true && finding.severity === 'warn' ? 'blocked' : finding.severity;
    if (severity === 'blocked') finalVerdict = 'BLOCKED';
    else if (severity === 'warn' && finalVerdict !== 'BLOCKED') finalVerdict = 'WARN';
  }

  const report: AuditReport = {
    verdict: finalVerdict,
    ...(options.release !== undefined ? { release: options.release } : {}),
    ...(projectSpdx !== undefined ? { projectSpdx } : {}),
    filesScanned: scan.filesScanned,
    truncated: scan.truncated,
    dependencies: scan.dependencies.length,
    findings,
    artifacts: [],
    signed: false,
  };

  // ---- Artifacts: machine report + both SBOMs --------------------------
  const auditDir = path.join(cwd, '.reposell', 'audit');
  await fs.mkdir(auditDir, { recursive: true });
  const files: Record<string, string> = {
    'report.json': JSON.stringify(report, null, 2) + '\n',
    'sbom.spdx.json': spdxSbom(scan, projectSpdx),
    'sbom.cyclonedx.json': cycloneDxSbom(scan),
  };

  // ---- Sign when a key is configured (§21 semantics for audit results) --
  const env = process.env;
  try {
    const privateKey = resolveSigningKey(env);
    const { rendered } = await signBuild({ files, privateKey });
    files['signature.json'] = rendered;
    report.signed = true;
  } catch (error) {
    if (!(error instanceof SigningKeyMissingError)) throw error;
  }

  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(path.join(auditDir, name), content);
    report.artifacts.push(`.reposell/audit/${name}`);
  }

  return report;
}

export function formatAuditHuman(report: AuditReport): string {
  const icon = report.verdict === 'PASS' ? '✓' : report.verdict === 'WARN' ? '!' : '✗';
  const lines = [
    `${icon} Audit verdict: ${report.verdict}${report.release !== undefined ? ` (release ${report.release})` : ''}`,
    `  Scanned ${report.filesScanned} files · ${report.dependencies} dependencies${report.truncated ? ' · TRUNCATED' : ''}`,
    '',
    ...report.findings.map((finding) => {
      const mark =
        finding.severity === 'pass' || finding.severity === 'info'
          ? '✓'
          : finding.severity === 'warn'
            ? '!'
            : '✗';
      const extra = finding.items !== undefined && finding.items.length > 0 ? ` — ${finding.items.slice(0, 3).map((item) => item.subject).join(', ')}${finding.items.length > 3 ? ` +${finding.items.length - 3} more` : ''}` : '';
      return `  ${mark} ${finding.title}: ${finding.detail}${extra}`;
    }),
    '',
    report.signed
      ? '✓ Report signed (.reposell/audit/signature.json)'
      : '– Unsigned (set REPOSELL_SIGNING_KEY to sign the audit)',
    `  Artifacts: ${report.artifacts.join(', ')}`,
  ];
  return lines.join('\n');
}

export { parsePolicy };
