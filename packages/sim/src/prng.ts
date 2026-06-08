/**
 * Seeded deterministic PRNG (xorshift32).
 *
 * Pure integer arithmetic. No Math.random.
 * State is a single 32-bit unsigned integer, serializable.
 */

export interface PrngState {
  seed: number;
}

export class Prng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 1; // xorshift32 requires non-zero seed
    }
  }

  /** Get current state as a plain object. */
  getState(): PrngState {
    return { seed: this.state >>> 0 };
  }

  /** Restore state from a plain object. */
  setState(s: PrngState): void {
    this.state = s.seed >>> 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /** Next 32-bit unsigned integer. */
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  /** Next integer in range [0, n). */
  nextInRange(n: number): number {
    if (n <= 0) return 0;
    return (this.next() % (n >>> 0)) >>> 0;
  }
}
