import { describe, it, expect } from 'vitest';
import { publishCandidates } from './publish.js';

describe('publishCandidates', () => {
  it('orders drafts first, then already-published releases', () => {
    const ordered = publishCandidates(['v0.1.0', 'v0.2.0', 'v0.3.0'], (tag) => tag !== 'v0.2.0');
    expect(ordered).toEqual(['v0.1.0', 'v0.3.0', 'v0.2.0']);
  });

  it('keeps stable order within each group', () => {
    const ordered = publishCandidates(['v3', 'v1', 'v2'], () => true);
    expect(ordered).toEqual(['v3', 'v1', 'v2']);
  });
});
