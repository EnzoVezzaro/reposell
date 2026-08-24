import { execSync } from 'child_process';
import { LicenseService, type LicenseCheckResult } from '../app/license-service.js';
import {
  compatibilityCheck,
  composeLicense,
  ComposeOptions,
  explainLicense,
  LicenseComposeError,
  validateLicenseArtifacts,
} from '../app/license-compose-service.js';
import { parseLicenseArgs, LicenseArgsError, type LicenseCommandArgs } from './license-args.js';
import { renderBanner } from '../cli/banner.js';

function detectHolderName(): string {
  try {
    const name = execSync('git config --get user.name', { encoding: 'utf-8' }).trim();
    return name.length > 0 ? name : 'Unknown Holder';
  } catch {
    return 'Unknown Holder';
  }
}

/** Lightweight flag parser for the policy subcommands. */
function parsePolicyArgs(argv: string[]): { _: string[]; options: ComposeOptions } {
  const positional: string[] = [];
  const options: ComposeOptions = {};
  const overrides: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) continue;
    if (arg === '--profile') options.profile = argv[index + 1];
    else if (arg === '--spdx') options.spdx = argv[index + 1];
    else if (arg === '--exception') options.spdxExceptions = argv[index + 1];
    else if (arg === '--jurisdiction') options.jurisdiction = argv[index + 1];
    else if (arg === '--set') {
      const pair = argv[index + 1];
      if (pair !== undefined) {
        const eq = pair.indexOf('=');
        if (eq !== -1) overrides[pair.slice(0, eq)] = pair.slice(eq + 1);
      }
      index += 1;
      continue;
    } else if (arg.startsWith('--')) {
      // unknown flag — ignore for forward compatibility
      index += 1;
      continue;
    } else {
      positional.push(arg);
      continue;
    }
    index += 1;
  }
  if (Object.keys(overrides).length > 0) options.overrides = overrides;
  return { _: positional, options };
}

export function formatCheckResult(result: LicenseCheckResult): string {
  if (result.status === 'ok') {
    return `✓ License detected: ${result.spdx} (SPDX: ${result.spdx})\n  ${result.sellingNote}`;
  }
  if (result.status === 'rsl') {
    return `✓ RepoSell license detected: ${result.spdx} in ${result.file}\n  ${result.sellingNote}`;
  }
  if (result.status === 'missing') {
    return `⚠ No recognizable license found.\n  ${result.sellingNote}\n? Run: reposell license use rsl --holder "<your name>"`;
  }
  return `⚠ Unrecognized license text in ${result.file}.\n  ${result.sellingNote}\n? Run: reposell license use rsl --holder "<your name>" — or reposell license keep`;
}

export async function licenseCommand(cwd: string, argv: string[]): Promise<string> {
  // Policy subcommands (§30): compose | explain | validate | compatibility
  const head = argv[0];
  if (head === 'compose' || head === 'explain' || head === 'validate' || head === 'compatibility') {
    const { _: positional, options } = parsePolicyArgs(argv.slice(1));
    try {
      if (head === 'compose') {
        const report = await composeLicense(cwd, options);
        return [
          renderBanner('compact'),
          `✓ Composed license policy — profile: ${report.profile} · SPDX: ${report.spdx}`,
          `✓ Policy hash: ${report.hash.slice(0, 16)}… (bound into signed release manifests)`,
          report.written.map((file) => `✓ Wrote ${file}`).join('\n'),
          report.licenseAppended
            ? '✓ Appended policy section to LICENSE'
            : '– LICENSE already carries a reposell policy section (left untouched)',
          '! Not committed — review the diff and commit yourself.',
        ].join('\n');
      }
      if (head === 'explain') {
        const report = await explainLicense(cwd, {});
        if (!report.found) {
          return '– No license policy found.\n? Run: reposell license compose --profile open-permissive';
        }
        return [
          `Policy: ${report.profile} · SPDX: ${report.spdx}`,
          `Hash: ${report.hash?.slice(0, 16)}… (${report.path})`,
          `Compatibility: ${report.compatibilityNote}`,
          '',
          report.human ?? '',
        ].join('\n');
      }
      if (head === 'validate') {
        const result = await validateLicenseArtifacts(cwd);
        if (result.ok) return '✓ License artifacts valid — license.json complete, derived policies coherent.';
        return [
          `✗ ${result.issues.length} license artifact issue(s):`,
          ...result.issues.map((issue) => `  - ${issue.file}: ${issue.issue}`),
        ].join('\n');
      }
      // compatibility
      const dependency = positional[0];
      if (dependency === undefined) {
        return 'usage: reposell license compatibility <dependency-spdx> [project-spdx]';
      }
      const report = await compatibilityCheck(dependency, positional[1], {});
      return `${report.dependency} → ${report.project}: ${report.verdict}`;
    } catch (error) {
      if (error instanceof LicenseComposeError) {
        return ['✗ License composition failed:', ...error.issues.map((issue) => `  - ${issue}`)].join('\n');
      }
      throw error;
    }
  }

  let args: LicenseCommandArgs;
  try {
    args = parseLicenseArgs(argv);
  } catch (error) {
    if (error instanceof LicenseArgsError) return error.message;
    throw error;
  }

  const service = new LicenseService(cwd);

  if (args.action === 'check') {
    return formatCheckResult(await service.check());
  }

  if (args.action === 'keep') {
    const check = await service.check();
    const written = await service.keep(check.status === 'ok' ? check.spdx : undefined);
    return `✓ Keeping existing license${check.spdx !== undefined ? ` (detected: ${check.spdx})` : ''}\n✓ Recorded in reposell.yml → license: keep-existing\n${written.length > 0 ? 'Written: ' + written.join(', ') : 'reposell.yml already records a license decision.'}`;
  }

  const holder = args.holder ?? detectHolderName();
  const repository =
    args.repository === undefined || args.repository === 'auto'
      ? await autoRepositoryUrl(cwd)
      : args.repository;
  const result = await service.use({
    holder,
    repository,
    year: args.year,
    jurisdiction: args.jurisdiction,
    force: args.force,
    withPolicy: !args.noPolicy,
  });

  if (result.skippedOverwrite) {
    return `! LICENSE exists and was not generated by reposell.\n  Review it, then re-run with --force to replace.`;
  }
  return [
    renderBanner('compact'),
    `✓ Generated LICENSE (RSL-1.0)`,
    result.written.includes('.reposell/ai-policy.json')
      ? `✓ Generated .reposell/ai-policy.json (machine-readable rights reservation)`
      : `– Skipped ai-policy (--no-policy)`,
    result.written.includes('reposell.yml') ? `✓ Recorded license: rsl-1.0 in reposell.yml` : '',
    `  Holder: ${holder} · Repo: ${repository}`,
    `! Not committed — review the diff and commit yourself.`,
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

async function autoRepositoryUrl(cwd: string): Promise<string | undefined> {
  try {
    const url = execSync('git config --get remote.origin.url', { cwd, encoding: 'utf-8' }).trim();
    const https = url.replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '');
    return https;
  } catch {
    return undefined;
  }
}
