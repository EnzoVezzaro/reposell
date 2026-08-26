import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { entitlementKey } from './sell-sync.js';

describe('entitlementKey', () => {
  it('binds buyer + repository + release + scheme, case-insensitive on buyer', () => {
    const a = entitlementKey({ buyer: 'Dev@x.io', repository: 'o/r', release: 'v1', scheme: 'standard' });
    expect(a).toBe(entitlementKey({ buyer: 'dev@x.io', repository: 'o/r', release: 'v1', scheme: 'standard' }));
    expect(a).not.toBe(
      entitlementKey({ buyer: 'dev@x.io', repository: 'o/r', release: 'v2', scheme: 'standard' }),
    );
    expect(a.split('|')).toHaveLength(4);
  });
});
