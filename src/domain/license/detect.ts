export type LicenseStatus = 'ok' | 'missing' | 'unrecognized' | 'rsl';

export interface LicenseDetection {
  status: LicenseStatus;
  spdx?: string;
  source: 'file' | 'manifest' | 'none';
  file?: string;
}

const LICENSE_FILES = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'COPYING',
];

interface TextSignature {
  spdx: string;
  pattern: RegExp;
}

const SIGNATURES: TextSignature[] = [
  { spdx: 'RSL-1.0', pattern: /REPOSELL SOURCE LICENSE/i },
  { spdx: 'FORK-1.0', pattern: /REPOSELL FORK LICENSE/i },
  { spdx: 'Apache-2.0', pattern: /Apache License\s+Version 2\.0/i },
  { spdx: 'MPL-2.0', pattern: /Mozilla Public License.*2\.0/i },
  { spdx: 'AGPL-3.0-only', pattern: /GNU AFFERO GENERAL PUBLIC LICENSE/i },
  { spdx: 'LGPL-3.0-only', pattern: /GNU (LESSER|Library) GENERAL PUBLIC LICENSE/i },
  {
    spdx: 'GPL-3.0-only',
    pattern: /GNU GENERAL PUBLIC LICENSE[\s\S]{0,200}Version 3/i,
  },
  {
    spdx: 'GPL-2.0-only',
    pattern: /GNU GENERAL PUBLIC LICENSE[\s\S]{0,200}Version 2/i,
  },
  { spdx: 'MIT', pattern: /Permission is hereby granted, free of charge/i },
  { spdx: 'ISC', pattern: /ISC License|Copyright \(c\).*Permission to use, copy, modify, and\/or distribute/i },
  { spdx: 'Unlicense', pattern: /This is free and unencumbered software released into the public domain/i },
  { spdx: 'BSD-3-Clause', pattern: /Redistribution and use[\s\S]*Neither the name/i },
  { spdx: 'BSD-2-Clause', pattern: /Redistribution and use in source and binary forms/i },
];

export function classifyLicenseText(text: string): string | undefined {
  for (const sig of SIGNATURES) {
    if (sig.pattern.test(text)) return sig.spdx;
  }
  return undefined;
}

const SPDX_EXPR = /^[A-Za-z0-9.+-]+/;

export function parseSpdxExpression(expr: string): string | undefined {
  const trimmed = expr.trim();
  if (trimmed.length === 0) return undefined;
  const head = SPDX_EXPR.exec(trimmed)?.[0] ?? '';
  const candidate = head.endsWith('.') ? head.slice(0, -1) : head;
  return candidate.length > 0 ? candidate : undefined;
}

export interface ManifestTexts {
  packageJson?: string;
  cargoToml?: string;
  pyprojectToml?: string;
  composerJson?: string;
}

export interface JsonManifestLicense {
  license?: string;
}

// SAFETY: package.json / composer.json are trusted local project files; the only
// field consumed is `license`, and parseSpdxExpression re-validates it downstream.
// SAFETY: the only caller validates a JSON-decoded manifest field before use.
function isPlainString(value: string | undefined): value is string {
  return Object.prototype.toString.call(value) === '[object String]';
}

function readJsonManifestLicense(jsonText: string | undefined): JsonManifestLicense {
  if (jsonText === undefined) return {};
  try {
    // SAFETY: manifests are trusted local project files; the license field is
    // re-validated by parseSpdxExpression before any decision is made.
    const parsed = JSON.parse(jsonText) as { license?: string };
    return { license: isPlainString(parsed.license) ? parsed.license : undefined };
  } catch {
    return {};
  }
}

function licenseFromCargoToml(text: string): string | undefined {
  const match = /^\s*license\s*=\s*"([^"]+)"/m.exec(text);
  return match?.[1];
}

function licenseFromPyprojectToml(text: string): string | undefined {
  const inline = /^\s*license\s*=\s*\{\s*text\s*=\s*"([^"]+)"/m.exec(text);
  if (inline?.[1]) return parseSpdxExpression(inline[1]);
  const plain = /^\s*license\s*=\s*"([^"]+)"/m.exec(text);
  return plain?.[1];
}

export interface DetectLicenseInput {
  fileExists(name: string): Promise<boolean>;
  readFileText(name: string): Promise<string | undefined>;
  manifests(): Promise<ManifestTexts>;
}

export async function detectLicense(input: DetectLicenseInput): Promise<LicenseDetection> {
  for (const name of LICENSE_FILES) {
    if (await input.fileExists(name)) {
      const text = await input.readFileText(name);
      if (text === undefined) continue;
      const classified = classifyLicenseText(text);
      if (classified === undefined) {
        return { status: 'unrecognized', source: 'file', file: name };
      }
      return {
        status: classified === 'RSL-1.0' || classified === 'FORK-1.0' ? 'rsl' : 'ok',
        spdx: classified,
        source: 'file',
        file: name,
      };
    }
  }

  const m = await input.manifests();
  const npm = readJsonManifestLicense(m.packageJson);
  const composer = readJsonManifestLicense(m.composerJson);
  const candidates: Array<[string | undefined, string]> = [
    [npm.license, 'package.json'],
    [m.cargoToml !== undefined ? licenseFromCargoToml(m.cargoToml) : undefined, 'Cargo.toml'],
    [m.pyprojectToml !== undefined ? licenseFromPyprojectToml(m.pyprojectToml) : undefined, 'pyproject.toml'],
    [composer.license, 'composer.json'],
  ];
  for (const [expr, file] of candidates) {
    if (!expr) continue;
    const spdx = parseSpdxExpression(expr);
    if (spdx === undefined) continue;
    return {
      status: spdx === 'RSL-1.0' || spdx === 'FORK-1.0' ? 'rsl' : 'ok',
      spdx,
      source: 'manifest',
      file,
    };
  }

  return { status: 'missing', source: 'none' };
}
