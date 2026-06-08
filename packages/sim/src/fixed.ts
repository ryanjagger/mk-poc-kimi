/**
 * Q16.16 fixed-point math.
 *
 * A `Fixed` is a branded integer where 1.0 = 65536 (1 << 16).
 * Range: approximately -32768 to +32767.99998 (fits in signed 32-bit).
 *
 * Multiplication and division use BigInt intermediates to avoid overflow
 * past 53 bits (the JS safe-integer limit).
 */

export type Fixed = number & { __brand: 'Fixed' };

const FP_SHIFT = 16;
const FP_ONE = 1 << FP_SHIFT; // 65536
const FP_MASK = FP_ONE - 1;   // 65535

/** Create a Fixed from a raw integer (already in Q16.16). */
export function fromRaw(n: number): Fixed {
  return (n | 0) as Fixed;
}

/** Create a Fixed from an integer (e.g., 3 → 3.0). */
export function fromInt(n: number): Fixed {
  return ((n | 0) * FP_ONE) as Fixed;
}

/** Create a Fixed from a fraction numerator/denominator. */
export function fromFraction(num: number, den: number): Fixed {
  return Number((BigInt(num | 0) * BigInt(FP_ONE)) / BigInt(den | 0)) as Fixed;
}

/** Convert a Fixed to float (debug / render only). */
export function toFloat(a: Fixed): number {
  return a / FP_ONE;
}

/** Create a Fixed from a float (debug / tests only). */
export function fromFloat(n: number): Fixed {
  return (n * FP_ONE) as Fixed;
}

/** Add two Fixed values. */
export function add(a: Fixed, b: Fixed): Fixed {
  return ((a | 0) + (b | 0)) as Fixed;
}

/** Subtract two Fixed values. */
export function sub(a: Fixed, b: Fixed): Fixed {
  return ((a | 0) - (b | 0)) as Fixed;
}

/** Negate a Fixed value. */
export function neg(a: Fixed): Fixed {
  return (-(a | 0) | 0) as Fixed;
}

/** Multiply two Fixed values using BigInt intermediate to avoid overflow. */
export function mul(a: Fixed, b: Fixed): Fixed {
  const result = (BigInt(a | 0) * BigInt(b | 0)) >> BigInt(FP_SHIFT);
  return Number(result) as Fixed;
}

/** Divide two Fixed values using BigInt intermediate. */
export function div(a: Fixed, b: Fixed): Fixed {
  const result = (BigInt(a | 0) << BigInt(FP_SHIFT)) / BigInt(b | 0);
  return Number(result) as Fixed;
}

/** Floor a Fixed value (round down to integer). */
export function floor(a: Fixed): Fixed {
  return ((a | 0) & ~FP_MASK) as Fixed;
}

/** Absolute value. */
export function abs(a: Fixed): Fixed {
  const v = a | 0;
  return (v < 0 ? -v : v) as Fixed;
}

/** Minimum of two Fixed values. */
export function min(a: Fixed, b: Fixed): Fixed {
  return (a < b ? a : b) as Fixed;
}

/** Maximum of two Fixed values. */
export function max(a: Fixed, b: Fixed): Fixed {
  return (a > b ? a : b) as Fixed;
}

/** Clamp a Fixed value between lo and hi. */
export function clamp(a: Fixed, lo: Fixed, hi: Fixed): Fixed {
  if (a < lo) return lo;
  if (a > hi) return hi;
  return a;
}

/** Sign of a Fixed value (-1, 0, or 1). */
export function sign(a: Fixed): Fixed {
  const v = a | 0;
  return (v > 0 ? FP_ONE : v < 0 ? -FP_ONE : 0) as Fixed;
}

/** Compare two Fixed values. */
export function eq(a: Fixed, b: Fixed): boolean {
  return (a | 0) === (b | 0);
}

export function lt(a: Fixed, b: Fixed): boolean {
  return (a | 0) < (b | 0);
}

export function lte(a: Fixed, b: Fixed): boolean {
  return (a | 0) <= (b | 0);
}

export function gt(a: Fixed, b: Fixed): boolean {
  return (a | 0) > (b | 0);
}

export function gte(a: Fixed, b: Fixed): boolean {
  return (a | 0) >= (b | 0);
}

/** Constants */
export const ZERO = fromInt(0);
export const ONE = fromInt(1);
export const TWO = fromInt(2);
export const HALF = fromFraction(1, 2);
export const FP_ONE_RAW = FP_ONE;
