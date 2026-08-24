/**
 * SBOM generation (spec §26): SPDX 2.3 JSON and CycloneDX 1.5 JSON from the
 * scanned dependency components. Deterministic; no external services.
 */

import { createHash } from 'crypto';
import { spdxIdentifiers } from '../licensing/compatibility.js';
import type { ScanResult } from './scan.js';

export interface SbomComponent {
  name: string;
  version?: string;
  license?: string;
  purl: string;
}

export function collectComponents(scan: ScanResult): SbomComponent[] {
  const components: SbomComponent[] = [];
  for (const dep of scan.dependencies) {
    components.push({
      name: dep.name,
      ...(dep.version !== undefined ? { version: dep.version } : {}),
      ...(dep.license !== undefined ? { license: dep.license } : {}),
      purl: `pkg:npm/${dep.name}${dep.version !== undefined ? `@${dep.version}` : ''}`,
    });
  }
  for (const manifest of scan.manifests) {
    if (manifest.name === undefined) continue;
    components.push({
      name: manifest.name,
      ...(manifest.licenseField !== undefined ? { license: manifest.licenseField } : {}),
      purl:
        manifest.kind === 'cargo-toml'
          ? `pkg:cargo/${manifest.name}`
          : manifest.kind === 'pyproject-toml'
            ? `pkg:pypi/${manifest.name}`
            : `pkg:npm/${manifest.name}`,
    });
  }
  return components.sort((a, b) => a.purl.localeCompare(b.purl));
}

function documentUid(seed: string): string {
  return createHash('sha256').update(seed).digest('hex').slice(0, 12);
}

/** SPDX 2.3 JSON document. */
export function spdxSbom(scan: ScanResult, projectSpdx: string | undefined): string {
  const components = collectComponents(scan);
  const doc = {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: `reposell-audit-${documentUid(scan.root)}`,
    documentNamespace: `https://reposell.dev/spdxdocs/${documentUid(scan.root + JSON.stringify(components))}`,
    creationInfo: {
      created: '1970-01-01T00:00:00Z',
      creators: ['Tool: reposell-audit'],
      licenseListVersion: '3.23',
    },
    packages: components.map((component) => ({
        name: component.name,
        SPDXID: `SPDXRef-Package-${spdxIdentifiers(component.purl).join('') || component.name.replace(/[^A-Za-z0-9]/g, '-')}`,
        versionInfo: component.version ?? 'UNKNOWN',
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: component.license ?? 'NOASSERTION',
        copyrightText: 'NOASSERTION',
        externalRefs: [
          {
            referenceCategory: 'PACKAGE-MANAGER',
            referenceType: 'purl',
            referenceLocator: component.purl,
          },
        ],
      })),
    relationships: [
      {
        spdxElementId: 'SPDXRef-DOCUMENT',
        relationshipType: 'DESCRIBES',
        relatedSpdxElement: 'SPDXRef-Package-root',
      },
    ],
  };
  void projectSpdx;
  return JSON.stringify(doc, null, 2) + '\n';
}

/** CycloneDX 1.5 JSON document. */
export function cycloneDxSbom(scan: ScanResult): string {
  const components = collectComponents(scan);
  const doc = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${documentUid(scan.root + 'cdx')}-0000-0000-0000-000000000000`,
    version: 1,
    metadata: {
      timestamp: '1970-01-01T00:00:00Z',
      tools: [{ vendor: 'reposell', name: 'reposell-audit', version: '1.0.0' }],
    },
    components: components.map((component) => ({
      type: 'library',
      name: component.name,
      ...(component.version !== undefined ? { version: component.version } : {}),
      purl: component.purl,
      ...(component.license !== undefined
        ? {
            licenses: [
              {
                expression: component.license,
              },
            ],
          }
        : {}),
    })),
  };
  return JSON.stringify(doc, null, 2) + '\n';
}
