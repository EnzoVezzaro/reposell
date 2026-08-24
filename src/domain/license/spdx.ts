export interface SpdxInfo {
  id: string;
  name: string;
  osiApproved: boolean;
  sellingNote: string;
}

const TABLE = {
  MIT: {
    id: 'MIT',
    name: 'MIT License',
    osiApproved: true,
    sellingNote: 'Permissive. Selling via reposell allowed; you keep full ownership.',
  },
  'Apache-2.0': {
    id: 'Apache-2.0',
    name: 'Apache License 2.0',
    osiApproved: true,
    sellingNote: 'Permissive with patent grant. Selling via reposell allowed.',
  },
  ISC: {
    id: 'ISC',
    name: 'ISC License',
    osiApproved: true,
    sellingNote: 'Permissive. Selling via reposell allowed.',
  },
  'BSD-2-Clause': {
    id: 'BSD-2-Clause',
    name: 'BSD 2-Clause "Simplified"',
    osiApproved: true,
    sellingNote: 'Permissive. Selling via reposell allowed.',
  },
  'BSD-3-Clause': {
    id: 'BSD-3-Clause',
    name: 'BSD 3-Clause "New"',
    osiApproved: true,
    sellingNote: 'Permissive with non-endorsement clause. Selling via reposell allowed.',
  },
  'MPL-2.0': {
    id: 'MPL-2.0',
    name: 'Mozilla Public License 2.0',
    osiApproved: true,
    sellingNote: 'Weak copyleft (file-level). Selling via reposell allowed.',
  },
  Unlicense: {
    id: 'Unlicense',
    name: 'The Unlicense',
    osiApproved: true,
    sellingNote: 'Public domain dedication. Selling via reposell allowed.',
  },
  'GPL-2.0-only': {
    id: 'GPL-2.0-only',
    name: 'GNU GPL v2.0',
    osiApproved: true,
    sellingNote: 'Strong copyleft. Selling allowed, derivatives must stay GPL.',
  },
  'GPL-3.0-only': {
    id: 'GPL-3.0-only',
    name: 'GNU GPL v3.0',
    osiApproved: true,
    sellingNote: 'Strong copyleft. Selling allowed, derivatives must stay GPL.',
  },
  'AGPL-3.0-only': {
    id: 'AGPL-3.0-only',
    name: 'GNU AGPL v3.0',
    osiApproved: true,
    sellingNote: 'Strongest copyleft (network clause). Selling allowed with obligations.',
  },
  'LGPL-3.0-only': {
    id: 'LGPL-3.0-only',
    name: 'GNU LGPL v3.0',
    osiApproved: true,
    sellingNote: 'Copyleft for libraries only. Selling via reposell allowed.',
  },
  'RSL-1.0': {
    id: 'RSL-1.0',
    name: 'RepoSell Source License 1.0',
    osiApproved: false,
    sellingNote:
      'RepoSell source-available license. Rights attach to each purchase; AI training prohibited without permission.',
  },
  'FORK-1.0': {
    id: 'FORK-1.0',
    name: 'RepoSell Fork License 1.0',
    osiApproved: false,
    sellingNote: 'Per-purchase instrument binding a Licensee to a specific Licensed Fork.',
  },
} satisfies Record<string, SpdxInfo>;

type LicenseTable = typeof TABLE;

export function lookupSpdx(id: string): SpdxInfo | undefined {
  // SAFETY: TABLE keys are SPDX identifiers; the `in` guard rejects unknown ids.
  const key = id as keyof LicenseTable;
  return key in TABLE ? TABLE[key] : undefined;
}

export function isKnownSpdx(id: string): boolean {
  return id in TABLE;
}
