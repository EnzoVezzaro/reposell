/**
 * `reposell audit` — full-repository licensing/compliance audit.
 * Flags: --json (machine output), --ci (exit 1 on BLOCKED), --strict
 * (warnings block), --release <tag>, --forbidden "A,B".
 */

import { runAudit, formatAuditHuman, type AuditReport } from '../app/audit-service.js';

export interface AuditArgs {
  json?: boolean;
  ci?: boolean;
  strict?: boolean;
  release?: string;
  forbidden?: string[];
}

export function parseAuditArgs(argv: string[]): AuditArgs {
  const args: AuditArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--json':
        args.json = true;
        break;
      case '--ci':
        args.ci = true;
        break;
      case '--strict':
        args.strict = true;
        break;
      case '--release': {
        const value = argv[index + 1];
        if (value !== undefined) args.release = value;
        index += 1;
        break;
      }
      case '--forbidden': {
        const value = argv[index + 1];
        if (value !== undefined) {
          args.forbidden = value.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
        }
        index += 1;
        break;
      }
      default:
        break;
    }
  }
  return args;
}

export async function auditCommand(cwd: string, argv: string[]): Promise<string> {
  const args = parseAuditArgs(argv);
  const report: AuditReport = await runAudit(cwd, {
    ...(args.strict !== undefined ? { strict: args.strict } : {}),
    ...(args.release !== undefined ? { release: args.release } : {}),
    ...(args.forbidden !== undefined ? { forbidden: args.forbidden } : {}),
  });

  if (args.json === true) {
    return JSON.stringify(report, null, 2);
  }
  const human = formatAuditHuman(report);
  if (args.ci === true && report.verdict === 'BLOCKED') {
    return `${human}\n✗ CI gate: BLOCKED (exit 1)`;
  }
  return human;
}

/** CI gate exit code: 1 when blocked (or warned under --strict via runAudit). */
export function auditExitCode(report: AuditReport, ci: boolean | undefined, strict: boolean | undefined): number {
  if (ci !== true) return 0;
  if (report.verdict === 'BLOCKED') return 1;
  if (strict === true && report.verdict === 'WARN') return 1;
  return 0;
}
