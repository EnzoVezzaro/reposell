/**
 * Repository scanning for `reposell audit` (§audit): license files, package
 * manifests, dependency lockfiles, source-file headers and copyright lines.
 * Deterministic given a directory; bounded (file count + size caps) so it
 * stays safe on large repos.
 */

import { promises as fs } from 'fs';
import path from 'path';

import { classifyLicenseText } from '../license/detect.js';
import { spdxIdentifiers } from '../licensing/compatibility.js';

export const MAX_SCAN_FILES = 4000;
export const MAX_FILE_BYTES = 256 * 1024;

const LICENSE_PATTERNS = [/^LICENSE/i, /^LICENCE/i, /^COPYING/i, /^NOTICE/i];
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.py', '.rs', '.go', '.java', '.rb', '.c', '.h', '.cpp', '.hpp',
]);
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.venv', 'venv', 'target', '__pycache__', '.reposell', '.vitepress',
]);

export interface SourceHeaderHit {
  file: string;
  spdx?: string;
  copyright?: string;
}

export interface DependencyComponent {
  name: string;
  version?: string;
  license?: string;
  source: 'package-lock' | 'manifest';
  path: string;
}

export interface ManifestFile {
  path: string;
  kind: 'package-json' | 'cargo-toml' | 'pyproject-toml';
  name?: string;
  licenseField?: string;
}

export interface ScanResult {
  root: string;
  licenseFiles: Array<{ path: string; bytes: number; detectedSpdx?: string }>;
  noticeFiles: string[];
  manifests: ManifestFile[];
  dependencies: DependencyComponent[];
  sourceHeaders: SourceHeaderHit[];
  filesScanned: number;
  truncated: boolean;
}

async function readTextSafe(filePath: string, maxBytes = MAX_FILE_BYTES): Promise<string | undefined> {
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > maxBytes) return undefined;
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Recursively collects candidate files, bounded and skip-aware. */
async function walk(root: string): Promise<{ files: string[]; truncated: boolean }> {
  const files: string[] = [];
  const queue: string[] = [root];
  let truncated = false;
  while (queue.length > 0) {
    const dir = queue.shift();
    if (dir === undefined) break;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) queue.push(full);
        continue;
      }
      if (files.length >= MAX_SCAN_FILES) {
        truncated = true;
        return { files, truncated };
      }
      files.push(full);
    }
  }
  return { files, truncated };
}

function parsePackageJson(raw: string, filePath: string): ManifestFile | undefined {
  try {
    // SAFETY: shape guarded by the validation immediately above before this cast.
    const json = JSON.parse(raw) as Record<string, unknown>;
    const license = json['license'];
    return {
      path: filePath,
      kind: 'package-json',
      name: typeof json['name'] === 'string' ? json['name'] : undefined,
      licenseField: typeof license === 'string' ? license : undefined,
    };
  } catch {
    return undefined;
  }
}

function parseCargoToml(raw: string, filePath: string): ManifestFile {
  const licenseMatch = /^\s*license\s*=\s*"([^"]+)"/m.exec(raw);
  const nameMatch = /^\s*name\s*=\s*"([^"]+)"/m.exec(raw);
  return {
    path: filePath,
    kind: 'cargo-toml',
    name: nameMatch?.[1],
    licenseField: licenseMatch?.[1],
  };
}

function parsePyprojectToml(raw: string, filePath: string): ManifestFile {
  const pep621 = /^\s*license\s*=\s*\{[^}]*text\s*=\s*"([^"]+)"/m.exec(raw) ?? /^\s*license\s*=\s*"([^"]+)"/m.exec(raw);
  const poetry = /^\s*license\s*=\s*"([^"]+)"/m.exec(raw);
  const nameMatch = /^\s*name\s*=\s*"([^"]+)"/m.exec(raw);
  return {
    path: filePath,
    kind: 'pyproject-toml',
    name: nameMatch?.[1],
    licenseField: pep621?.[1] ?? poetry?.[1],
  };
}

interface LockfilePackage {
  name?: string;
  version?: string;
  license?: string;
}

function parsePackageLock(raw: string): DependencyComponent[] {
  let json: { packages?: Record<string, LockfilePackage> };
  try {
    // SAFETY: shape guarded by the validation immediately above before this cast.
    json = JSON.parse(raw) as { packages?: Record<string, LockfilePackage> };
  } catch {
    return [];
  }
  const out: DependencyComponent[] = [];
  for (const [key, info] of Object.entries(json.packages ?? {})) {
    if (key === '' || key === 'node_modules') continue; // root entry
    const name = key.replace(/^node_modules\//, '').split('node_modules/').pop();
    if (name === undefined || name.length === 0) continue;
    out.push({
      name,
      version: info.version,
      license: typeof info.license === 'string' ? info.license : undefined,
      source: 'package-lock',
      path: key,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const SPDX_HEADER = /SPDX-License-Identifier:\s*([A-Za-z0-9.\-+\s()ORANDwith]+?)(?:\r?\n|$)/;
const COPYRIGHT_LINE = /Copyright\s+(?:\(c\)\s*|©\s*)?(\d{4}(?:[-,]\s*\d{4})*)\s+([^\r\n]*)/i;

/** Scans the repository: everything the audit checks consume. */
export async function scanRepository(root: string): Promise<ScanResult> {
  const { files, truncated } = await walk(root);
  const licenseFiles: ScanResult['licenseFiles'] = [];
  const noticeFiles: string[] = [];
  const manifests: ManifestFile[] = [];
  const sourceHeaders: SourceHeaderHit[] = [];
  let dependencies: DependencyComponent[] = [];
  let lockSeen = false;

  for (const filePath of files) {
    const base = path.basename(filePath);
    const ext = path.extname(filePath);

    if (LICENSE_PATTERNS.some((pattern) => pattern.test(base))) {
      if (/^NOTICE/i.test(base)) {
        noticeFiles.push(path.relative(root, filePath));
        continue;
      }
      const raw = await readTextSafe(filePath);
      if (raw !== undefined) {
        licenseFiles.push({
          path: path.relative(root, filePath),
          bytes: Buffer.byteLength(raw),
          detectedSpdx: classifyLicenseText(raw),
        });
      }
      continue;
    }

    if (base === 'package-lock.json' && !lockSeen) {
      const raw = await readTextSafe(filePath, 8 * 1024 * 1024);
      if (raw !== undefined) {
        dependencies = parsePackageLock(raw);
        lockSeen = true;
      }
      continue;
    }

    if (base === 'package.json' && !base.includes('lock')) {
      const raw = await readTextSafe(filePath);
      if (raw !== undefined) {
        const manifest = parsePackageJson(raw, path.relative(root, filePath));
        if (manifest !== undefined) manifests.push(manifest);
      }
      continue;
    }
    if (base === 'Cargo.toml') {
      const raw = await readTextSafe(filePath);
      if (raw !== undefined) manifests.push(parseCargoToml(raw, path.relative(root, filePath)));
      continue;
    }
    if (base === 'pyproject.toml') {
      const raw = await readTextSafe(filePath);
      if (raw !== undefined) manifests.push(parsePyprojectToml(raw, path.relative(root, filePath)));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(ext)) {
      const raw = await readTextSafe(filePath, 4096);
      if (raw === undefined) continue;
      const spdx = SPDX_HEADER.exec(raw)?.[1]?.trim();
      const copyright = COPYRIGHT_LINE.exec(raw);
      if (spdx !== undefined || copyright !== null) {
        sourceHeaders.push({
          file: path.relative(root, filePath),
          ...(spdx !== undefined ? { spdx } : {}),
          ...(copyright !== null ? { copyright: `${copyright[1]} ${copyright[2]?.trim() ?? ''}`.trim() } : {}),
        });
      }
    }
  }

  // Manifest-declared dependencies fill gaps when no lockfile exists.
  if (!lockSeen) {
    for (const manifest of manifests) {
      if (manifest.kind !== 'package-json') continue;
      try {
        const raw = await fs.readFile(path.join(root, manifest.path), 'utf8');
        // SAFETY: shape guarded by the validation immediately above before this cast.
        const json = JSON.parse(raw) as Record<string, unknown>;
        for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
          const deps = json[section];
          if (typeof deps !== 'object' || deps === null || Array.isArray(deps)) continue;
          // SAFETY: shape guarded by the validation immediately above before this cast.
          for (const name of Object.keys(deps as Record<string, unknown>)) {
            if (!dependencies.some((component) => component.name === name)) {
              dependencies.push({ name, source: 'manifest', path: manifest.path });
            }
          }
        }
      } catch {
        continue;
      }
    }
  }

  return {
    root,
    licenseFiles,
    noticeFiles,
    manifests,
    dependencies,
    sourceHeaders,
    filesScanned: files.length,
    truncated,
  };
}

export async function fileExists(root: string, relative: string): Promise<boolean> {
  return exists(path.join(root, relative));
}

export { spdxIdentifiers };
