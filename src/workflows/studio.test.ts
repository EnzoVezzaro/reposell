import { describe, it, expect } from 'vitest';
import { STUDIO_URL, STUDIO_PORT } from './studio.js';

describe('studio constants', () => {
  it('serves on the fixed local port with zero configuration', () => {
    expect(STUDIO_PORT).toBe(5199);
    expect(STUDIO_URL).toBe('http://localhost:5199');
  });
});
