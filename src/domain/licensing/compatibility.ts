/**
 * SPDX license expression handling (spec §25-26): minimal parser for
 * `AND` / `OR` / `WITH` expressions with optional parentheses, plus a
 * practical compatibility matrix over the common license families.
 *
 * Compatibility answers: "can code under A be included in a project
 * distributed under B?" — `compatible(a, b)`.
 */

export type SpdxNode =
  | { kind: 'id'; value: string; exception?: string }
  | { kind: 'and'; left: SpdxNode; right: SpdxNode }
  | { kind: 'or'; left: SpdxNode; right: SpdxNode };

interface ParseResult {
  ok: boolean;
  node?: SpdxNode;
  error?: string;
}

const TOKEN = /\s*(\(|\)|[A-Za-z0-9.\-+]+)/gy;

function isKeyword(token: string): boolean {
  const upper = token.toUpperCase();
  return upper === 'AND' || upper === 'OR' || upper === 'WITH';
}

function tokenize(input: string): string[] | undefined {
  const tokens: string[] = [];
  let position = 0;
  const source = input.trim();
  while (position < source.length) {
    TOKEN.lastIndex = position;
    const match = TOKEN.exec(source);
    if (match === null) return undefined;
    const value = match[1];
    if (value === undefined) return undefined;
    // SPDX identifiers keep their original case; keywords are matched
    // case-insensitively at parse time.
    tokens.push(value);
    position = TOKEN.lastIndex;
  }
  return tokens;
}

function parseExpression(tokens: string[]): ParseResult {
  let index = 0;

  const peek = (): string | undefined => tokens[index];
  const consume = (): string | undefined => tokens[index++];

  const parseAtom = (): ParseResult => {
    const token = consume();
    if (token === undefined) return { ok: false, error: 'unexpected end of expression' };
    if (token === '(') {
      const inner = parseOr();
      if (!inner.ok) return inner;
      if (consume() !== ')') return { ok: false, error: 'missing closing parenthesis' };
      // `(...) WITH exception` attaches to the group's first identifier.
      if (peek() !== undefined && peek()?.toUpperCase() === 'WITH') {
        consume();
        const exception = consume();
        if (exception === undefined || isKeyword(exception)) {
          return { ok: false, error: 'WITH requires an exception identifier' };
        }
        const group = inner.node as SpdxNode;
        if (group.kind === 'id') group.exception = exception;
      }
      return inner;
    }
    if (token === ')' || isKeyword(token)) {
      return { ok: false, error: `unexpected "${token}"` };
    }
    const node: SpdxNode = { kind: 'id', value: token };
    if (peek() !== undefined && peek()?.toUpperCase() === 'WITH') {
      consume();
      const exception = consume();
      if (exception === undefined || isKeyword(exception)) {
        return { ok: false, error: 'WITH requires an exception identifier' };
      }
      node.exception = exception;
    }
    return { ok: true, node };
  };

  const parseAnd = (): ParseResult => {
    let left = parseAtom();
    if (!left.ok) return left;
    while (peek() !== undefined && peek()?.toUpperCase() === 'AND') {
      consume();
      const right = parseAtom();
      if (!right.ok) return right;
      left = { ok: true, node: { kind: 'and', left: left.node as SpdxNode, right: right.node as SpdxNode } };
    }
    return left;
  };

  const parseOr = (): ParseResult => {
    let left = parseAnd();
    if (!left.ok) return left;
    while (peek() !== undefined && peek()?.toUpperCase() === 'OR') {
      consume();
      const right = parseAnd();
      if (!right.ok) return right;
      left = { ok: true, node: { kind: 'or', left: left.node as SpdxNode, right: right.node as SpdxNode } };
    }
    return left;
  };

  const result = parseOr();
  if (!result.ok) return result;
  if (index !== tokens.length) return { ok: false, error: `unexpected trailing "${tokens[index]}"` };
  return result;
}

export function parseSpdxExpression(expression: string): ParseResult {
  if (expression.trim().length === 0) return { ok: false, error: 'empty expression' };
  const tokens = tokenize(expression);
  if (tokens === undefined) return { ok: false, error: 'invalid characters in expression' };
  return parseExpression(tokens);
}

export function spdxIdentifiers(expression: string): string[] {
  const parsed = parseSpdxExpression(expression);
  const ids: string[] = [];
  const walk = (node: SpdxNode): void => {
    if (node.kind === 'id') ids.push(node.value);
    else {
      walk(node.left);
      walk(node.right);
    }
  };
  if (parsed.ok && parsed.node !== undefined) walk(parsed.node);
  return ids;
}

type Family = 'permissive' | 'weak-copyleft' | 'strong-copyleft' | 'network-copyleft' | 'public-domain' | 'unknown';

const FAMILIES: Record<string, Family> = {
  MIT: 'permissive',
  'BSD-2-Clause': 'permissive',
  'BSD-3-Clause': 'permissive',
  'BSD-4-Clause': 'permissive',
  ISC: 'permissive',
  'Apache-1.1': 'permissive',
  'Apache-2.0': 'permissive',
  Zlib: 'permissive',
  'Artistic-2.0': 'permissive',
  'MS-PL': 'permissive',
  Unlicense: 'public-domain',
  'CC0-1.0': 'public-domain',
  'LGPL-2.1-only': 'weak-copyleft',
  'LGPL-2.1-or-later': 'weak-copyleft',
  'LGPL-3.0-only': 'weak-copyleft',
  'LGPL-3.0-or-later': 'weak-copyleft',
  'MPL-1.1': 'weak-copyleft',
  'MPL-2.0': 'weak-copyleft',
  'EPL-1.0': 'weak-copyleft',
  'EPL-2.0': 'weak-copyleft',
  'CDDL-1.0': 'weak-copyleft',
  'GPL-2.0-only': 'strong-copyleft',
  'GPL-2.0-or-later': 'strong-copyleft',
  'GPL-3.0-only': 'strong-copyleft',
  'GPL-3.0-or-later': 'strong-copyleft',
  'AGPL-3.0-only': 'network-copyleft',
  'AGPL-3.0-or-later': 'network-copyleft',
};

function familyOf(id: string): Family {
  return FAMILIES[id] ?? (id.startsWith('LicenseRef-') ? 'unknown' : 'unknown');
}

const RANK: Record<Family, number> = {
  'public-domain': 0,
  permissive: 1,
  'weak-copyleft': 2,
  'strong-copyleft': 3,
  'network-copyleft': 4,
  unknown: -1,
};

export type Compatibility =
  | 'compatible'
  | 'incompatible'
  | 'compatible-with-conditions'
  | 'unknown';

/**
 * Practical compatibility: dependency family must be <= project family
 * strength (a permissive dep fits anywhere; an AGPL dep only fits an
 * AGPL-or-stronger project). Unknown ids yield `unknown` — never a guess.
 */
export function compatibility(dependencySpdx: string, projectSpdx: string): Compatibility {
  const depIds = spdxIdentifiers(dependencySpdx);
  const projectIds = spdxIdentifiers(projectSpdx);
  if (depIds.length === 0 || projectIds.length === 0) return 'unknown';

  // OR in the project expression relaxes requirements to the weakest branch.
  const projectFamilies = projectIds.map(familyOf);
  if (projectFamilies.some((family) => family === 'unknown')) return 'unknown';

  let worst: Compatibility = 'compatible';
  for (const depId of depIds) {
    const depFamily = familyOf(depId);
    if (depFamily === 'unknown') return 'unknown';
    const depRank = RANK[depFamily];
    const fits = projectFamilies.some((family) => RANK[family] >= depRank);
    const verdict: Compatibility = fits ? 'compatible' : 'incompatible';
    if (verdict === 'incompatible') return 'incompatible';
    if (depFamily === 'strong-copyleft' || depFamily === 'network-copyleft') {
      worst = 'compatible-with-conditions';
    }
  }
  return worst;
}
