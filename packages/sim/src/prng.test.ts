import { describe, it, expect } from 'vitest';
import { Prng } from './prng.js';

describe('PRNG', () => {
  it('same seed produces identical sequence', () => {
    const a = new Prng(12345);
    const b = new Prng(12345);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = new Prng(12345);
    const b = new Prng(54321);
    const aVals = Array.from({ length: 10 }, () => a.next());
    const bVals = Array.from({ length: 10 }, () => b.next());
    expect(aVals).not.toEqual(bVals);
  });

  it('save/restore state reproduces tail', () => {
    const a = new Prng(99999);
    const first5 = Array.from({ length: 5 }, () => a.next());
    const state = a.getState();
    const next5 = Array.from({ length: 5 }, () => a.next());

    const b = new Prng(0); // different initial seed
    b.setState(state);
    const restored5 = Array.from({ length: 5 }, () => b.next());

    expect(next5).toEqual(restored5);
  });

  it('snapshot reference sequence', () => {
    const prng = new Prng(42);
    const seq = Array.from({ length: 10 }, () => prng.next());
    expect(seq).toEqual([
      11355432, 2836018348, 476557059, 3648046016, 3759983556,
      1441438134, 3713466840, 2431644334, 3120216979, 1067267639,
    ]);
  });

  it('nextInRange works', () => {
    const prng = new Prng(77);
    for (let i = 0; i < 50; i++) {
      const v = prng.nextInRange(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('serializable state round-trip', () => {
    const prng = new Prng(123);
    prng.next();
    prng.next();
    const state = JSON.parse(JSON.stringify(prng.getState()));
    const prng2 = new Prng(0);
    prng2.setState(state);
    expect(prng.next()).toBe(prng2.next());
    expect(prng.next()).toBe(prng2.next());
  });
});
