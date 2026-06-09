/**
 * 2D vector math using fixed-point Q16.16.
 */

import * as fp from './fixed.js';
import type { Fixed } from './fixed.js';
import { sin, cos } from './trig.js';
import { fpSqrt } from './trig.js';

export interface Vec2 {
  x: Fixed;
  y: Fixed;
}

export function vec2(x: Fixed, y: Fixed): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: fp.add(a.x, b.x), y: fp.add(a.y, b.y) };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: fp.sub(a.x, b.x), y: fp.sub(a.y, b.y) };
}

export function scale(v: Vec2, s: Fixed): Vec2 {
  return { x: fp.mul(v.x, s), y: fp.mul(v.y, s) };
}

export function dot(a: Vec2, b: Vec2): Fixed {
  return fp.add(fp.mul(a.x, b.x), fp.mul(a.y, b.y));
}

export function lengthSq(v: Vec2): Fixed {
  return dot(v, v);
}

export function length(v: Vec2): Fixed {
  return fpSqrt(lengthSq(v));
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === fp.ZERO) return { x: fp.ZERO, y: fp.ZERO };
  return { x: fp.div(v.x, len), y: fp.div(v.y, len) };
}

export function rotate(v: Vec2, angle: number): Vec2 {
  const s = sin(angle);
  const c = cos(angle);
  return {
    x: fp.sub(fp.mul(v.x, c), fp.mul(v.y, s)),
    y: fp.add(fp.mul(v.x, s), fp.mul(v.y, c)),
  };
}
