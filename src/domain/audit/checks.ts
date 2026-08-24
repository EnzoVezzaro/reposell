/**
 * Audit checks engine: scan results + active license policy -> findings.
 * Each check maps to the audit specification; severities decide the final
 * PASS / WARN / BLOCKED verdict. Pure given its inputs.
 */

import { compatibility, parseSpdxExpression, spdxIdentifiers } from '../licensing/compatibility.js';
import { parsePolicy } from '../licensing/policy.js';
import type { ScanResult } from './scan.js';

export type Severity = 'pass' | 'info' | 'warn' | 'blocked';

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  detail: string;
  items?: Array<{ subject: string; detail: string }>;
}

export interface AuditOptions {
  /** Licenses that must never appear in dependencies (comma-separated). */
  forbidden?: string[];
  /** Escalate warnings to blocked. */
  strict?: boolean;
  /** Release tag the audit is bound to (report-only effect). */
  release?: string;
}

export function runAuditChecks(scan: ScanResult, options: AuditOptions = {}): {
  findings: Finding[];
  verdict: 'PASS' | 'WARN' | 'BLOCKED';
  projectSpdx?: string;
} {
  const findings: Finding[] = [];
  const forbidden = (options.forbidden ?? []).map((id) => id.trim()).filter((id) => id.length > 0);

  // 1. repository license file
  const mainLicense = scan.licenseFiles.find((file) => /^LICENSE/i.test(file.path));
  if (mainLicense === undefined) {
    findings.push({
      id: 'repository-license',
      title: 'Repository license file',
      severity: 'blocked',
      detail: 'No LICENSE file found — the product cannot be sold without one.',
    });
  } else {
    const detected = mainLicense.detectedSpdx;
    findings.push({
      id: 'repository-license',
      title: 'Repository license file',
      severity: detected === undefined ? 'warn' : 'pass',
      detail:
        detected === undefined
          ? `${mainLicense.path} exists but its text was not recognized.`
          : `${mainLicense.path} detected as ${detected}.`,
    });
  }

  // 2. project SPDX from the primary manifest
  const primaryManifest = scan.manifests.find((manifest) => manifest.licenseField !== undefined);
  const projectSpdx = primaryManifest?.licenseField;
  if (projectSpdx === undefined) {
    findings.push({
      id: 'spdx-validation',
      title: 'Project SPDX expression',
      severity: 'warn',
      detail: 'No license field found in package.json / Cargo.toml / pyproject.toml.',
    });
  } else {
    const parsed = parseSpdxExpression(projectSpdx);
    findings.push({
      id: 'spdx-validation',
      title: 'Project SPDX expression',
      severity: parsed.ok ? 'pass' : 'blocked',
      detail: parsed.ok ? `"${projectSpdx}" is a valid SPDX expression.` : `Invalid SPDX expression: ${parsed.error}`,
    });
  }

  // 3. manifest <-> LICENSE consistency
  if (mainLicense !== undefined && projectSpdx !== undefined && mainLicense.detectedSpdx !== undefined) {
    const declared = spdxIdentifiers(projectSpdx)[0];
    const consistent = declared === undefined || declared === mainLicense.detectedSpdx;
    findings.push({
      id: 'manifest-consistency',
      title: 'LICENSE / manifest consistency',
      severity: consistent ? 'pass' : 'blocked',
      detail: consistent
        ? `Manifest license matches detected file license (${mainLicense.detectedSpdx}).`
        : `Manifest says "${projectSpdx}" but LICENSE text detected as "${mainLicense.detectedSpdx}".`,
    });
  }

  // 4-8. dependency audits
  const unknownDeps = scan.dependencies.filter((dep) => dep.license === undefined);
  if (unknownDeps.length > 0) {
    findings.push({
      id: 'missing-license',
      title: 'Dependencies without license metadata',
      severity: 'warn',
      detail: `${unknownDeps.length} dependency(ies) declare no license — verify before distribution.`,
      items: unknownDeps.slice(0, 50).map((dep) => ({ subject: dep.name, detail: dep.source })),
    });
  }

  const incompatible: string[] = [];
  const copyleft: string[] = [];
  const forbiddenHits: string[] = [];
  for (const dep of scan.dependencies) {
    if (dep.license === undefined) continue;
    if (projectSpdx !== undefined) {
      const verdict = compatibility(dep.license, projectSpdx);
      if (verdict === 'incompatible') incompatible.push(`${dep.name} (${dep.license})`);
    }
    const license = dep.license.toUpperCase();
    if (license.startsWith('GPL-') || license.startsWith('AGPL-') || license.startsWith('LGPL-')) {
      copyleft.push(`${dep.name} (${dep.license})`);
    }
    if (forbidden.some((id) => spdxIdentifiers(dep.license ?? '').includes(id))) {
      forbiddenHits.push(`${dep.name} (${dep.license})`);
    }
  }

  findings.push({
    id: 'dependency-compatibility',
    title: 'Dependency license compatibility vs project',
    severity: incompatible.length > 0 ? 'blocked' : 'pass',
    detail:
      incompatible.length > 0
        ? `${incompatible.length} dependency(ies) incompatible with "${projectSpdx ?? 'unknown project license'}".`
        : 'All declared dependency licenses are compatible.',
    ...(incompatible.length > 0 ? { items: incompatible.slice(0, 50).map((subject) => ({ subject, detail: 'incompatible' })) } : {}),
  });

  findings.push({
    id: 'copyleft-detection',
    title: 'Copyleft dependencies',
    severity: copyleft.length > 0 ? 'warn' : 'pass',
    detail: copyleft.length > 0 ? `${copyleft.length} copyleft dependency(ies) present.` : 'No copyleft dependencies.',
    ...(copyleft.length > 0 ? { items: copyleft.slice(0, 50).map((subject) => ({ subject, detail: 'copyleft' })) } : {}),
  });

  findings.push({
    id: 'forbidden-licenses',
    title: 'Forbidden license detection',
    severity: forbiddenHits.length > 0 ? 'blocked' : 'pass',
    detail:
      forbiddenHits.length > 0
        ? `${forbiddenHits.length} dependency(ies) match the forbidden list.`
        : forbidden.length > 0
          ? `None of the forbidden licenses (${forbidden.join(', ')}) present.`
          : 'No forbidden list configured.',
    ...(forbiddenHits.length > 0 ? { items: forbiddenHits.slice(0, 50).map((subject) => ({ subject, detail: 'forbidden' })) } : {}),
  });

  // 9. source headers
  const headerSpdx = new Set(scan.sourceHeaders.map((hit) => hit.spdx).filter((id) => id !== undefined));
  findings.push({
    id: 'source-headers',
    title: 'Source file license headers',
    severity: 'info',
    detail:
      scan.sourceHeaders.length === 0
        ? 'No SPDX headers or copyright lines found in source files.'
        : `${scan.sourceHeaders.length} file(s) carry headers; identifiers: ${[...headerSpdx].join(', ') || 'none'}.`,
  });

  // 10. NOTICE / attribution requirements
  const needsNotice = scan.noticeFiles.length === 0;
  findings.push({
    id: 'notice-requirements',
    title: 'NOTICE / attribution artifacts',
    severity: needsNotice ? 'warn' : 'pass',
    detail: needsNotice
      ? 'No NOTICE file — required when redistributing under most attribution-bearing licenses.'
      : `NOTICE present (${scan.noticeFiles.join(', ')}).`,
  });

  // 11. license artifacts + AI policy coherence
  findings.push({
    id: 'license-artifacts',
    title: '.reposell machine-readable licensing',
    severity: 'info',
    detail: 'Checked by `reposell license validate` (compose first if missing).',
  });

  // 12. model / data licensing report
  findings.push({
    id: 'model-data-licensing',
    title: 'Model / data licensing posture',
    severity: 'info',
    detail: 'Reported from the active license policy (model_weights, data rights).',
  });

  // 13. release-to-release license changes (when release manifests exist)
  findings.push({
    id: 'release-license-changes',
    title: 'Release-to-release license changes',
    severity: 'info',
    detail: options.release === undefined ? 'Not bound to a specific release.' : `Auditing against release ${options.release}.`,
  });

  let verdict: 'PASS' | 'WARN' | 'BLOCKED' = 'PASS';
  for (const finding of findings) {
    const severity = options.strict === true && finding.severity === 'warn' ? 'blocked' : finding.severity;
    if (severity === 'blocked') verdict = 'BLOCKED';
    else if (severity === 'warn' && verdict !== 'BLOCKED') verdict = 'WARN';
  }

  return { findings, verdict, ...(projectSpdx !== undefined ? { projectSpdx } : {}) };
}

/** Validates the machine-readable licensing artifacts when present. */
export function checkPolicyArtifact(raw: unknown): Finding {
  const parsed = parsePolicy(raw);
  return {
    id: 'license-artifacts',
    title: '.reposell machine-readable licensing',
    severity: parsed.ok ? 'pass' : 'blocked',
    detail: parsed.ok ? 'license.json is complete and valid.' : `license.json invalid: ${parsed.issues.slice(0, 5).join('; ')}`,
  };
}
