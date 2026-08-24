import { promises as fs } from 'fs';
import path from 'path';
import { detectGitInfo } from '../utils/git.js';
import { LicenseService, type LicenseCheckResult } from '../app/license-service.js';
import { formatCheckResult } from './license.js';
import { renderBanner } from '../cli/banner.js';
import { generateWorkflows } from '../workflows/ci.js';
import { createIdentity } from '../app/signing-service.js';

export interface InitResult {
  banner: string;
  gitInfo: Awaited<ReturnType<typeof detectGitInfo>>;
  license: LicenseCheckResult | undefined;
  configCreated: boolean;
  workflowWritten: boolean;
  verificationKeyPath: string | undefined;
  signingKeySecret: string | undefined;
}

export async function initCommand(cwd: string): Promise<InitResult> {
  const banner = renderBanner('full');
  const gitInfo = await detectGitInfo(cwd, 'github');

  const configPath = path.join(cwd, 'reposell.yml');
  let configCreated = false;
  try {
    await fs.access(configPath);
  } catch {
    await fs.writeFile(
      configPath,
      `# reposell configuration\nversion: 1\nproduct:\n  name: ${gitInfo.repo}\nreleases:\n  mode: manual\n  definitions: {}\nsell:\n  enabled: true\nmarketplace:\n  enabled: false\n`,
    );
    configCreated = true;
  }

  const service = new LicenseService(cwd);
  const license = await service.check();

  const workflow = await generateWorkflows(cwd);

  let verificationKeyPath: string | undefined;
  let signingKeySecret: string | undefined;
  try {
    const identity = await createIdentity();
    const keyDir = path.join(cwd, '.github', 'reposell');
    await fs.mkdir(keyDir, { recursive: true });
    verificationKeyPath = path.join(keyDir, 'verification-key.pem');
    await fs.writeFile(verificationKeyPath, identity.publicPem);
    signingKeySecret = identity.privateBase64;
  } catch {
    // Identity generation is best-effort at init time; `reposell keys generate` retries.
  }

  return {
    banner,
    gitInfo,
    license,
    configCreated,
    workflowWritten: workflow.written.length > 0,
    verificationKeyPath,
    signingKeySecret,
  };
}

export function formatInitResult(result: InitResult): string {
  const lines = [
    result.banner,
    `✓ Detected ${result.gitInfo.provider} repository: ${result.gitInfo.owner}/${result.gitInfo.repo}`,
    result.configCreated ? '✓ Created reposell.yml (zero-config defaults)' : '• reposell.yml already exists',
    result.workflowWritten ? '✓ Generated .github/workflows/reposell.yml (validate → build → GitHub Pages)' : '• Workflow unchanged',
  ];
  if (result.verificationKeyPath !== undefined && result.signingKeySecret !== undefined) {
    lines.push(
      `✓ Wrote public verification key to ${path.relative(process.cwd(), result.verificationKeyPath)} (safe to commit)`,
      '',
      'PRIVATE KEY — add as secret REPOSELL_SIGNING_KEY (shown once, never stored):',
      `  ${result.signingKeySecret}`,
      '',
      'Next:',
      '1. Create a Stripe Payment Link for your release',
      `2. reposell release v0.1.0 --price 10 --link https://buy.stripe.com/…`,
      '3. reposell publish v0.1.0',
      '4. git push — CI validates, signs, builds and deploys /reposell/*',
    );
  }
  if (result.license !== undefined) {
    lines.push(formatCheckResult(result.license));
  }
  return lines.join('\n');
}
