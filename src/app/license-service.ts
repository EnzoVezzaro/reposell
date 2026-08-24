import { promises as fs } from 'fs';
import path from 'path';
import { detectLicense, type LicenseDetection } from '../domain/license/detect.js';
import { lookupSpdx } from '../domain/license/spdx.js';
import {
  renderRslLicense,
  renderAiPolicy,
  generateAiPolicy,
  type AiPolicy,
} from '../domain/license/templates.js';

export interface LicenseCheckResult extends LicenseDetection {
  sellingNote: string;
  suggestion?: 'use-rsl' | 'none';
}

export interface LicenseUseOptions {
  holder: string;
  repository?: string;
  year?: string;
  jurisdiction?: string;
  force?: boolean;
  withPolicy?: boolean;
  policy?: AiPolicy;
  now?: Date;
}

export interface LicenseUseResult {
  written: Array<'LICENSE' | '.reposell/ai-policy.json' | 'reposell.yml'>;
  skippedOverwrite: boolean;
}

export interface ReposellYmlLicensePatch {
  mode: 'rsl-1.0' | 'keep-existing';
  spdx?: string;
  recorded_at: string;
}

function isGeneratedByUs(text: string): boolean {
  return text.includes('REPOSELL SOURCE LICENSE');
}

export class LicenseService {
  private readonly cwd: string;
  private readonly now: () => Date;

  constructor(cwd: string, now: () => Date = () => new Date()) {
    this.cwd = cwd;
    this.now = now;
  }

  async check(): Promise<LicenseCheckResult> {
    const detection = await detectLicense({
      fileExists: async (name) => fs.access(path.join(this.cwd, name)).then(() => true, () => false),
      readFileText: async (name) => {
        try {
          return await fs.readFile(path.join(this.cwd, name), 'utf8');
        } catch {
          return undefined;
        }
      },
      manifests: async () => {
        const readText = async (name: string): Promise<string | undefined> => {
          try {
            return await fs.readFile(path.join(this.cwd, name), 'utf8');
          } catch {
            return undefined;
          }
        };
        return {
          packageJson: await readText('package.json'),
          cargoToml: await readText('Cargo.toml'),
          pyprojectToml: await readText('pyproject.toml'),
          composerJson: await readText('composer.json'),
        };
      },
    });

    if (detection.status === 'missing') {
      return { ...detection, sellingNote: 'No license found. Buyers would receive no terms — choose one before selling.', suggestion: 'use-rsl' };
    }
    if (detection.status === 'unrecognized') {
      return {
        ...detection,
        sellingNote: `License text in ${detection.file} is not a recognized standard. Consider RSL-1.0 or keep yours knowingly.`,
        suggestion: 'use-rsl',
      };
    }
    const info = detection.spdx !== undefined ? lookupSpdx(detection.spdx) : undefined;
    return {
      ...detection,
      sellingNote:
        info?.sellingNote ??
        `Detected ${detection.spdx ?? 'unknown identifier'} via ${detection.file}. Verify terms before selling.`,
    };
  }

  async use(options: LicenseUseOptions): Promise<LicenseUseResult> {
    const written: LicenseUseResult['written'] = [];
    const licensePath = path.join(this.cwd, 'LICENSE');

    let existing: string | undefined;
    try {
      existing = await fs.readFile(licensePath, 'utf8');
    } catch {
      existing = undefined;
    }
    let skippedOverwrite = false;
    if (existing !== undefined && !isGeneratedByUs(existing) && options.force !== true) {
      skippedOverwrite = true;
    } else {
      const year = options.year ?? String(this.now().getFullYear());
      const text = renderRslLicense({
        year,
        holder: options.holder,
        repository: options.repository,
        jurisdiction: options.jurisdiction,
      });
      await fs.writeFile(licensePath, text);
      written.push('LICENSE');
    }

    if (options.withPolicy !== false) {
      const policyDir = path.join(this.cwd, '.reposell');
      await fs.mkdir(policyDir, { recursive: true });
      const policy = options.policy ?? generateAiPolicy();
      await fs.writeFile(path.join(policyDir, 'ai-policy.json'), renderAiPolicy(policy));
      written.push('.reposell/ai-policy.json');
    }

    const ymlWritten = await this.recordYml({ mode: 'rsl-1.0', recorded_at: this.now().toISOString() });
    if (ymlWritten) written.push('reposell.yml');

    return { written, skippedOverwrite };
  }

  async keep(detectedSpdx?: string): Promise<LicenseUseResult['written']> {
    return (await this.recordYml({
      mode: 'keep-existing',
      spdx: detectedSpdx,
      recorded_at: this.now().toISOString(),
    }))
      ? ['reposell.yml']
      : [];
  }

  private async recordYml(patch: ReposellYmlLicensePatch): Promise<boolean> {
    const ymlPath = path.join(this.cwd, 'reposell.yml');
    let raw = '';
    try {
      raw = await fs.readFile(ymlPath, 'utf8');
    } catch {
      raw = '';
    }
    if (!raw.includes('license:')) {
      const lines = raw.length > 0 && raw.endsWith('\n') ? raw : raw + (raw.length > 0 ? '\n' : '');
      const spdxLine = patch.spdx !== undefined ? `\n  spdx: ${patch.spdx}` : '';
      const block = `license:\n  mode: ${patch.mode}${spdxLine}\n  recorded_at: ${patch.recorded_at}\n`;
      await fs.writeFile(ymlPath, lines + block);
      return true;
    }
    return false;
  }
}
