import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Sim/render separation', () => {
  it('sim/ does not import from client or three', () => {
    const result = execSync('grep -r "from.*client\|from.*three\|import.*three" packages/sim/src/ || true', { encoding: 'utf-8' });
    expect(result.trim()).toBe('');
  });

  it('sim/ does not use Math.random', () => {
    const result = execSync('rg "Math\.random\\(\\)" packages/sim/src/ || true', { encoding: 'utf-8' });
    expect(result.trim()).toBe('');
  });

  it('sim/ does not use Date or performance.now', () => {
    const result = execSync('grep -r "Date.now\|performance.now\|new Date" packages/sim/src/ || true', { encoding: 'utf-8' });
    expect(result.trim()).toBe('');
  });

  it('sim/ does not use Map or Set iteration', () => {
    // This is a heuristic: check for for...of over Map/Set
    const result = execSync('grep -r "for.*of.*Map\|for.*of.*Set" packages/sim/src/ || true', { encoding: 'utf-8' });
    expect(result.trim()).toBe('');
  });
});
