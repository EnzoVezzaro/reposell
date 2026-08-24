import { describe, it, expect } from 'vitest';
import { BANNER_FULL, renderBanner } from './banner.js';

describe('banner', () => {
  it('full art contains the R block and the star swoosh', () => {
    expect(BANNER_FULL).toContain('-%%@@@@@%@@@@@%.');
    expect(BANNER_FULL).toContain(':+***********+.');
    expect(BANNER_FULL).toContain('.+**+++++***++.');
  });

  it('compact variant carries the solo developer message', () => {
    const compact = renderBanner('compact');
    expect(compact).toContain('solo developer');
    expect(compact).toContain('Help me grow into a team');
    expect(compact).toContain('Enzo Vezzaro');
  });

  it('compact is far smaller than full', () => {
    expect(renderBanner('compact').length).toBeLessThan(BANNER_FULL.length / 3);
  });
});
