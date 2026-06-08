import { describe, it, expect } from 'vitest';
import * as vec2 from './vec2';
import * as fp from './fixed';

const F = fp.fromFloat;
const V = vec2.vec2;

function approxEqual(a: fp.Fixed, b: fp.Fixed, eps: number = 50): boolean {
  return Math.abs((a | 0) - (b | 0)) <= eps;
}

function vecApproxEqual(a: vec2.Vec2, b: vec2.Vec2, eps: number = 50): boolean {
  return approxEqual(a.x, b.x, eps) && approxEqual(a.y, b.y, eps);
}

describe('Vec2', () => {
  it('add', () => {
    expect(vec2.add(V(fp.fromInt(1), fp.fromInt(2)), V(fp.fromInt(3), fp.fromInt(4))))
      .toEqual(V(fp.fromInt(4), fp.fromInt(6)));
  });

  it('sub', () => {
    expect(vec2.sub(V(fp.fromInt(5), fp.fromInt(7)), V(fp.fromInt(2), fp.fromInt(3))))
      .toEqual(V(fp.fromInt(3), fp.fromInt(4)));
  });

  it('scale', () => {
    expect(vec2.scale(V(fp.fromInt(3), fp.fromInt(4)), fp.fromInt(2)))
      .toEqual(V(fp.fromInt(6), fp.fromInt(8)));
  });

  it('dot', () => {
    expect(vec2.dot(V(fp.fromInt(1), fp.fromInt(2)), V(fp.fromInt(3), fp.fromInt(4))))
      .toBe(fp.fromInt(11));
  });

  it('length of (3,4)', () => {
    expect(approxEqual(vec2.length(V(fp.fromInt(3), fp.fromInt(4))), fp.fromInt(5), 50))
      .toBe(true);
  });

  it('normalize', () => {
    const v = vec2.normalize(V(fp.fromInt(10), fp.ZERO));
    expect(approxEqual(v.x, fp.ONE, 50)).toBe(true);
    expect(approxEqual(v.y, fp.ZERO, 10)).toBe(true);
  });

  it('rotate by 90 degrees (16384 units)', () => {
    const v = V(fp.fromInt(1), fp.ZERO);
    const r = vec2.rotate(v, 16384); // π/2
    expect(vecApproxEqual(r, V(fp.ZERO, fp.ONE), 100)).toBe(true);
  });

  it('rotate by 180 degrees (32768 units)', () => {
    const v = V(fp.fromInt(1), fp.ZERO);
    const r = vec2.rotate(v, 32768); // π
    expect(vecApproxEqual(r, V(fp.neg(fp.ONE), fp.ZERO), 100)).toBe(true);
  });

  it('rotate by 360 degrees (65536 units) returns original', () => {
    const v = V(fp.fromInt(3), fp.fromInt(4));
    const r = vec2.rotate(v, 65536); // 2π
    expect(vecApproxEqual(r, v, 100)).toBe(true);
  });
});
