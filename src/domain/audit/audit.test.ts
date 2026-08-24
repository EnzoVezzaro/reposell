// @vitest-environment node
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { scanRepository } from './scan.js';
import { runAuditChecks } from './checks.js';
import { collectComponents, cycloneDxSbom, spdxSbom } from './sbom.js';
import { runAudit, formatAuditHuman } from '../../app/audit-service.js';

const ROOT = mkdtempSync(join(tmpdir(), 'reposell-audit-'));

function write(relative: string, content: string): void {
  const full = join(ROOT, relative);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
}

write('LICENSE', 'MIT License\n\nCopyright (c) 2026 Test Holder\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction.');
write('package.json', JSON.stringify({
  name: 'fixture-product',
  version: '1.0.0',
  license: 'MIT',
  dependencies: { leftpad: '^1.0.0', 'evil-lib': '^2.0.0' },
}));
write('package-lock.json', JSON.stringify({
  packages: {
    '': { name: 'fixture-product', version: '1.0.0', license: 'MIT' },
    'node_modules/leftpad': { name: 'leftpad', version: '1.0.0', license: 'MIT' },
    'node_modules/gpl-lib': { name: 'gpl-lib', version: '2.0.0', license: 'GPL-3.0-only' },
    'node_modules/evil-lib': { name: 'evil-lib', version: '2.0.0', license: 'GPL-3.0-only' },
    'node_modules/mystery': { name: 'mystery', version: '0.1.0' },
  },
}));
write('src/index.ts', '// SPDX-License-Identifier: MIT\n// Copyright (c) 2026 Test Holder\nexport {};\n');
write('src/no-header.ts', 'export const x = 1;\n');

afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

describe('scanRepository', () => {
  it('finds license files, manifests, lockfile deps and source headers', async () => {
    const scan = await scanRepository(ROOT);
    expect(scan.licenseFiles.some((file) => file.path === 'LICENSE' && file.detectedSpdx === 'MIT')).toBe(true);
    expect(scan.manifests[0]?.licenseField).toBe('MIT');
    expect(scan.dependencies.map((dep) => dep.name)).toContain('gpl-lib');
    expect(scan.sourceHeaders.some((hit) => hit.spdx === 'MIT')).toBe(true);
    expect(scan.filesScanned).toBeGreaterThan(0);
  });
});

describe('runAuditChecks', () => {
  it('passes a clean permissive repo', async () => {
    const clean = mkdtempSync(join(tmpdir(), 'reposell-audit-clean-'));
    try {
      const put = (relative: string, content: string): void => {
        const full = join(clean, relative);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, content);
      };
      put('LICENSE', 'MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction.');
      put('NOTICE', 'fixture-product\nCopyright (c) 2026 Test Holder');
      put('package.json', JSON.stringify({ name: 'clean-product', license: 'MIT', dependencies: { tiny: '^1.0.0' } }));
      put('package-lock.json', JSON.stringify({
        packages: {
          '': { name: 'clean-product', license: 'MIT' },
          'node_modules/tiny': { name: 'tiny', version: '1.0.0', license: 'MIT' },
        },
      }));
      const scan = await scanRepository(clean);
      const { verdict } = runAuditChecks(scan, { forbidden: ['AGPL-3.0-only'] });
      expect(verdict).toBe('PASS');
    } finally {
      rmSync(clean, { recursive: true, force: true });
    }
  });

  it('blocks on forbidden licenses', async () => {
    const scan = await scanRepository(ROOT);
    const { verdict, findings } = runAuditChecks(scan, { forbidden: ['GPL-3.0-only'] });
    expect(verdict).toBe('BLOCKED');
    const forbidden = findings.find((finding) => finding.id === 'forbidden-licenses');
    expect(forbidden?.severity).toBe('blocked');
  });

  it('blocks on dependency incompatibility with the project license', async () => {
    const scan = await scanRepository(ROOT);
    const { findings } = runAuditChecks(scan);
    const compat = findings.find((finding) => finding.id === 'dependency-compatibility');
    expect(compat?.severity).toBe('blocked');
    expect(compat?.items?.some((item) => item.subject.includes('evil-lib'))).toBe(true);
  });

  it('warns on unknown-license dependencies and missing NOTICE', async () => {
    const scan = await scanRepository(ROOT);
    const { findings } = runAuditChecks(scan);
    const missing = findings.find((finding) => finding.id === 'missing-license');
    expect(missing?.severity).toBe('warn');
    expect(missing?.items?.some((item) => item.subject === 'mystery')).toBe(true);
    const notice = findings.find((finding) => finding.id === 'notice-requirements');
    expect(notice?.severity).toBe('warn');
  });

  it('strict mode escalates warnings to blocked', async () => {
    const scan = await scanRepository(ROOT);
    const { verdict } = runAuditChecks(scan, { strict: true });
    expect(verdict).toBe('BLOCKED');
  });
});

describe('sbom', () => {
  it('emits valid SPDX and CycloneDX documents', async () => {
    const scan = await scanRepository(ROOT);
    const components = collectComponents(scan);
    expect(components.some((component) => component.name === 'gpl-lib')).toBe(true);

    // SAFETY: shape guarded by the validation immediately above before this cast.
    const spdx = JSON.parse(spdxSbom(scan, 'MIT')) as { spdxVersion: string; packages: unknown[] };
    expect(spdx.spdxVersion).toBe('SPDX-2.3');
    expect(spdx.packages.length).toBeGreaterThan(0);

    // SAFETY: shape guarded by the validation immediately above before this cast.
    const cdx = JSON.parse(cycloneDxSbom(scan)) as { bomFormat: string; components: unknown[] };
    expect(cdx.bomFormat).toBe('CycloneDX');
    expect(cdx.components.length).toBeGreaterThan(0);
  });
});

describe('runAudit (integration)', () => {
  it('writes report + sboms and formats human output', async () => {
    const report = await runAudit(ROOT, { forbidden: ['GPL-3.0-only'] });
    expect(report.verdict).toBe('BLOCKED');
    expect(report.artifacts).toContain('.reposell/audit/report.json');
    expect(report.artifacts).toContain('.reposell/audit/sbom.spdx.json');
    expect(report.signed).toBe(false);

    const human = formatAuditHuman(report);
    expect(human).toContain('Audit verdict: BLOCKED');
    expect(human).toContain('forbidden');
  });
});
