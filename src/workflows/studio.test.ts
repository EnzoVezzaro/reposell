import { describe, it, expect } from 'vitest';
import { parsePids, STUDIO_URL, STUDIO_PORT } from './studio.js';

describe('parsePids', () => {
  it('extracts numeric pids from lsof output', () => {
    expect(parsePids('123\n456\n')).toEqual([123, 456]);
    expect(parsePids('  789 \n\nnoise\n0')).toEqual([789]);
    expect(parsePids('')).toEqual([]);
  });
});

describe('studio constants', () => {
  it('serves on the fixed local port with zero configuration', () => {
    expect(STUDIO_PORT).toBe(5199);
    expect(STUDIO_URL).toBe('http://localhost:5199');
  });
});
