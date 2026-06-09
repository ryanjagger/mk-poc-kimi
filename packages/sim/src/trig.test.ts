import { describe, it, expect } from 'vitest';
import * as trig from './trig.js';
import * as fp from './fixed.js';

const F = fp.fromFloat;

function approxEqual(a: fp.Fixed, b: fp.Fixed, eps: number = 50): boolean {
  return Math.abs((a | 0) - (b | 0)) <= eps;
}

/** Integer square root for positive numbers. */
function isqrt(n: number): number {
  if (n <= 0) return 0;
  let x = n;
  let y = (x + 1) >> 1;
  while (y < x) {
    x = y;
    y = (x + (n / x | 0)) >> 1;
  }
  return x;
}

/** Fixed-point square root: sqrt(a) in Q16.16. */
function fpSqrt(a: fp.Fixed): fp.Fixed {
  const raw = a | 0;
  if (raw <= 0) return fp.ZERO;
  // sqrt(raw / 65536) = sqrt(raw) / 256
  // In Q16.16: sqrt(raw) * 256
  return ((isqrt(raw) * 256) | 0) as fp.Fixed;
}

describe('Trig', () => {
  it('sin(0) ≈ 0', () => {
    expect(approxEqual(trig.sin(0), fp.ZERO, 10)).toBe(true);
  });

  it('sin(16384) ≈ 1 (π/2)', () => {
    expect(approxEqual(trig.sin(16384), fp.ONE, 50)).toBe(true);
  });

  it('sin(32768) ≈ 0 (π)', () => {
    expect(approxEqual(trig.sin(32768), fp.ZERO, 50)).toBe(true);
  });

  it('sin(49152) ≈ -1 (3π/2)', () => {
    expect(approxEqual(trig.sin(49152), fp.neg(fp.ONE), 50)).toBe(true);
  });

  it('cos(0) ≈ 1', () => {
    expect(approxEqual(trig.cos(0), fp.ONE, 50)).toBe(true);
  });

  it('cos(16384) ≈ 0', () => {
    expect(approxEqual(trig.cos(16384), fp.ZERO, 50)).toBe(true);
  });

  it('cos(32768) ≈ -1', () => {
    expect(approxEqual(trig.cos(32768), fp.neg(fp.ONE), 50)).toBe(true);
  });

  it('quadrant symmetry', () => {
    const s1 = trig.sin(1000);
    const s2 = trig.sin(32768 - 1000);
    expect(approxEqual(s1, s2, 30)).toBe(true);
  });

  it('periodicity', () => {
    expect(approxEqual(trig.sin(500), trig.sin(500 + 65536), 10)).toBe(true);
    expect(approxEqual(trig.sin(500), trig.sin(500 + 131072), 10)).toBe(true);
  });
});

describe('fpSqrt', () => {
  it('sqrt(0) = 0', () => {
    expect(fpSqrt(fp.ZERO)).toBe(fp.ZERO);
  });

  it('sqrt(1) = 1', () => {
    expect(fpSqrt(fp.ONE)).toBe(fp.ONE);
  });

  it('sqrt(4) = 2', () => {
    expect(fpSqrt(fp.fromInt(4))).toBe(fp.fromInt(2));
  });

  it('sqrt(9) = 3', () => {
    expect(fpSqrt(fp.fromInt(9))).toBe(fp.fromInt(3));
  });

  it('sqrt(2) ≈ 1.414', () => {
    const result = fpSqrt(fp.fromInt(2));
    const expected = fp.fromFloat(1.4142);
    expect(approxEqual(result, expected, 100)).toBe(true);
  });

  it('sqrt of negative returns 0', () => {
    expect(fpSqrt(fp.fromInt(-5))).toBe(fp.ZERO);
  });
});
