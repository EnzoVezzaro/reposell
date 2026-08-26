import { describe, it, expect } from 'vitest';
import { BANNER_FULL, BANNER_COMPACT, renderBanner } from './banner.js';

describe('banner', () => {
  it('full art contains the r stem and the @ slash', () => {
    expect(BANNER_FULL).toContain('\u2586\u2586\u2586\u2586\u2586');
    expect(BANNER_FULL).toContain('@@@@');
    expect(BANNER_FULL).toContain('i*@@@@#I');
    expect(BANNER_FULL).toContain(':<@@@@@!');
  });

  it('has no trailing whitespace on any line', () => {
    for (const line of BANNER_FULL.split('\n')) {
      expect(line.endsWith(' ')).toBe(false);
    }
  });

  it('compact variant carries the solo developer message', () => {
    const compact = renderBanner('compact');
    expect(compact).toContain('solo developer');
    expect(compact).toContain('Help me grow into a team');
    expect(compact).toContain('Enzo Vezzaro');
  });

  it('uses one canonical mark for both variants', () => {
    expect(BANNER_COMPACT).toBe(BANNER_FULL);
    expect(renderBanner('compact').startsWith(BANNER_FULL)).toBe(true);
  });
});
