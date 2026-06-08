import { describe, it, expect } from 'vitest';
import * as fp from './fixed';

const F = fp.fromFloat;

function approxEqual(a: fp.Fixed, b: fp.Fixed, eps: number = 1): boolean {
  return Math.abs((a | 0) - (b | 0)) <= eps;
}

describe('Fixed-point', () => {
  it('fromInt / toFloat round-trip', () => {
    expect(fp.toFloat(fp.fromInt(0))).toBe(0);
    expect(fp.toFloat(fp.fromInt(1))).toBe(1);
    expect(fp.toFloat(fp.fromInt(-3))).toBe(-3);
    expect(fp.toFloat(fp.fromInt(42))).toBe(42);
  });

  it('fromFloat / toFloat tolerance', () => {
    expect(approxEqual(fp.fromFloat(0.5), fp.fromFraction(1, 2), 1)).toBe(true);
    expect(approxEqual(fp.fromFloat(1.25), fp.fromFraction(5, 4), 1)).toBe(true);
  });

  it('addition', () => {
    expect(fp.add(fp.fromInt(2), fp.fromInt(3))).toBe(fp.fromInt(5));
    expect(fp.add(fp.fromInt(-2), fp.fromInt(3))).toBe(fp.fromInt(1));
  });

  it('subtraction', () => {
    expect(fp.sub(fp.fromInt(5), fp.fromInt(3))).toBe(fp.fromInt(2));
    expect(fp.sub(fp.fromInt(3), fp.fromInt(5))).toBe(fp.fromInt(-2));
  });

  it('negation', () => {
    expect(fp.neg(fp.fromInt(5))).toBe(fp.fromInt(-5));
    expect(fp.neg(fp.fromInt(-5))).toBe(fp.fromInt(5));
    expect(fp.neg(fp.ZERO)).toBe(fp.ZERO);
  });

  it('multiplication', () => {
    expect(fp.mul(fp.fromInt(2), fp.fromInt(3))).toBe(fp.fromInt(6));
    expect(fp.mul(fp.fromInt(-2), fp.fromInt(3))).toBe(fp.fromInt(-6));
  });

  it('division', () => {
    expect(fp.div(fp.fromInt(6), fp.fromInt(2))).toBe(fp.fromInt(3));
    expect(fp.div(fp.fromInt(1), fp.fromInt(2))).toBe(fp.HALF);
  });

  it('floor', () => {
    expect(fp.floor(fp.fromInt(5))).toBe(fp.fromInt(5));
    expect(fp.floor(fp.add(fp.fromInt(5), fp.HALF))).toBe(fp.fromInt(5));
    expect(fp.floor(fp.fromInt(-3))).toBe(fp.fromInt(-3));
  });

  it('abs', () => {
    expect(fp.abs(fp.fromInt(-7))).toBe(fp.fromInt(7));
    expect(fp.abs(fp.fromInt(7))).toBe(fp.fromInt(7));
    expect(fp.abs(fp.ZERO)).toBe(fp.ZERO);
  });

  it('min/max/clamp', () => {
    expect(fp.min(fp.fromInt(3), fp.fromInt(5))).toBe(fp.fromInt(3));
    expect(fp.max(fp.fromInt(3), fp.fromInt(5))).toBe(fp.fromInt(5));
    expect(fp.clamp(fp.fromInt(10), fp.fromInt(0), fp.fromInt(5))).toBe(fp.fromInt(5));
    expect(fp.clamp(fp.fromInt(-10), fp.fromInt(0), fp.fromInt(5))).toBe(fp.fromInt(0));
  });

  it('sign', () => {
    expect(fp.sign(fp.fromInt(5))).toBe(fp.ONE);
    expect(fp.sign(fp.fromInt(-5))).toBe(fp.neg(fp.ONE));
    expect(fp.sign(fp.ZERO)).toBe(fp.ZERO);
  });

  it('comparisons', () => {
    expect(fp.eq(fp.fromInt(3), fp.fromInt(3))).toBe(true);
    expect(fp.lt(fp.fromInt(2), fp.fromInt(3))).toBe(true);
    expect(fp.gt(fp.fromInt(3), fp.fromInt(2))).toBe(true);
    expect(fp.lte(fp.fromInt(3), fp.fromInt(3))).toBe(true);
    expect(fp.gte(fp.fromInt(3), fp.fromInt(3))).toBe(true);
  });

  it('overflow: large × large stays within 32-bit range', () => {
    // 1000 * 1000 = 1,000,000 which is well within 32-bit integer range
    const a = fp.fromInt(1000);
    const b = fp.fromInt(1000);
    const result = fp.mul(a, b);
    expect(fp.toFloat(result)).toBe(1000 * 1000);
  });

  it('known-answer table', () => {
    const answers: [fp.Fixed, fp.Fixed, string, fp.Fixed][] = [
      [fp.fromInt(3), fp.fromInt(4), 'add', fp.fromInt(7)],
      [fp.fromInt(10), fp.fromInt(3), 'sub', fp.fromInt(7)],
      [fp.fromInt(6), fp.fromInt(7), 'mul', fp.fromInt(42)],
      [fp.fromInt(12), fp.fromInt(3), 'div', fp.fromInt(4)],
    ];
    for (const [a, b, op, expected] of answers) {
      let actual: fp.Fixed;
      switch (op) {
        case 'add': actual = fp.add(a, b); break;
        case 'sub': actual = fp.sub(a, b); break;
        case 'mul': actual = fp.mul(a, b); break;
        case 'div': actual = fp.div(a, b); break;
        default: throw new Error('unknown op');
      }
      expect(actual).toBe(expected);
    }
  });
});
