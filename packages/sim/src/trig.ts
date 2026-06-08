/**
 * Deterministic trigonometry via lookup table.
 *
 * Angle units: 0..65535 = full circle (2π).
 *   16384 = π/2, 32768 = π, 49152 = 3π/2.
 *
 * A 1024-entry sin LUT is generated at module load (no runtime Math.sin/cos).
 * Values are looked up with linear interpolation for smoothness.
 */

import * as fp from './fixed';
import type { Fixed } from './fixed';

// --- fpSqrt ---

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
export function fpSqrt(a: Fixed): Fixed {
  const raw = a | 0;
  if (raw <= 0) return fp.ZERO;
  // sqrt(raw / 65536) = sqrt(raw) / 256
  // In Q16.16: sqrt(raw) * 256
  return ((isqrt(raw) * 256) | 0) as Fixed;
}

// --- Trig LUT ---

const ANGLE_BITS = 16;
const ANGLE_MASK = (1 << ANGLE_BITS) - 1; // 65535
const LUT_SIZE = 1024;
const LUT_SHIFT = ANGLE_BITS - 10; // 6, since 2^10 = 1024
const LUT_MASK = (1 << LUT_SHIFT) - 1; // 63

// Precompute sin LUT using Math.sin at module load (deterministic once).
const sinTable: number[] = [];
for (let i = 0; i <= LUT_SIZE; i++) {
  const angle = (i * Math.PI * 2) / LUT_SIZE;
  sinTable[i] = Math.sin(angle);
}

/** Normalize angle to 0..65535 */
export function normalize(angle: number): number {
  return ((angle | 0) & ANGLE_MASK);
}

/** Get sin(angle) as Fixed, with linear interpolation. */
export function sin(angle: number): Fixed {
  const a = normalize(angle);
  const index = a >> LUT_SHIFT;
  const frac = a & LUT_MASK;

  const lo = sinTable[index]!;
  const hi = sinTable[index + 1]!;

  // Linear interpolation: lo + (hi - lo) * (frac / LUT_SIZE)
  // Convert to Fixed using fraction math
  const diff = hi - lo;
  const interpolated = lo + diff * (frac / LUT_MASK);

  return (interpolated * fp.FP_ONE_RAW) as Fixed;
}

/** Get cos(angle) as Fixed. */
export function cos(angle: number): Fixed {
  // cos(x) = sin(x + π/2), where π/2 = 16384 angle units
  return sin(angle + 16384);
}
