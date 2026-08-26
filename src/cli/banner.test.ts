import { describe, it, expect } from 'vitest';
import { BANNER_FULL, BANNER_COMPACT, renderBanner } from './banner.js';

describe('banner', () => {
  it('full art contains the r stem and the slash', () => {
    expect(BANNER_FULL).toContain('-%%@@@@@%@@%.');
    expect(BANNER_FULL).toContain('***:');
    expect(BANNER_FULL).toContain('.============.');
  });

  it('every line of the full art is left-aligned with no leading blank columns', () => {
    const lines = BANNER_FULL.split('\n');
    expect(lines.length).toBeGreaterThan(10);
    for (const line of lines) expect(line.startsWith(' ')).toBe(false);
  });

  it('compact variant carries the solo developer message', () => {
    const compact = renderBanner('compact');
    expect(compact).toContain('solo developer');
    expect(compact).toContain('Help me grow into a team');
    expect(compact).toContain('Enzo Vezzaro');
  });

  it('compact art is much smaller than full art', () => {
    expect(BANNER_COMPACT.length).toBeLessThan(BANNER_FULL.length / 2);
  });
});
