/**
 * Release tag/version parsing. Accepts `v1.2.3` and `1.2.3` forms with an
 * optional pre-release suffix (`-beta.1`). Build metadata is ignored.
 */

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export interface ParsedVersion {
  raw: string;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export function parseVersion(raw: string): ParsedVersion | undefined {
  const match = VERSION_PATTERN.exec(raw.trim());
  if (match === null) return undefined;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (!Number.isInteger(major) || !Number.isInteger(minor) || !Number.isInteger(patch)) {
    return undefined;
  }
  return {
    raw: raw.trim(),
    major,
    minor,
    patch,
    prerelease: match[4],
  };
}

export function normalizeTag(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith('v') ? trimmed : 'v' + trimmed;
}

export function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }
  // A release beats its own pre-releases; otherwise compare dot-separated ids.
  if (a.prerelease === undefined && b.prerelease !== undefined) return 1;
  if (a.prerelease !== undefined && b.prerelease === undefined) return -1;
  if (a.prerelease === undefined || b.prerelease === undefined) return 0;
  return a.prerelease.localeCompare(b.prerelease);
}
