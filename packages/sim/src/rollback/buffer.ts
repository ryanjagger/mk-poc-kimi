/**
 * Ring buffer for rollback window.
 *
 * Stores per-tick snapshots + input frames. Cheap save/restore using serialize.
 */

import type { SimState } from '../state';
import type { InputFrame } from '@kart-racer/shared';
import { serialize, deserialize } from '../hash';

export interface TickRecord {
  tick: number;
  state: SimState;
  inputs: InputFrame[];
}

export class RingBuffer {
  private buffer: TickRecord[];
  private head = 0;
  private size: number;

  constructor(windowSize: number) {
    this.size = windowSize;
    this.buffer = new Array(windowSize);
  }

  /** Store a snapshot. Overwrites the oldest entry if full. */
  push(record: TickRecord): void {
    this.buffer[this.head] = record;
    this.head = (this.head + 1) % this.size;
  }

  /** Fetch the snapshot at a given tick. Returns undefined if not in window. */
  get(tick: number): TickRecord | undefined {
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head - 1 - i + this.size) % this.size;
      const record = this.buffer[idx];
      if (record && record.tick === tick) {
        return record;
      }
    }
    return undefined;
  }

  /** Get the most recent tick stored. */
  getLatestTick(): number {
    const latest = this.buffer[(this.head - 1 + this.size) % this.size];
    return latest ? latest.tick : -1;
  }

  /** Get the oldest tick still in the window. */
  getOldestTick(): number {
    let oldest = Infinity;
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head - 1 - i + this.size) % this.size;
      const record = this.buffer[idx];
      if (record && record.tick < oldest) {
        oldest = record.tick;
      }
    }
    return oldest === Infinity ? -1 : oldest;
  }

  /** Check if a tick is within the window. */
  isInWindow(tick: number): boolean {
    const oldest = this.getOldestTick();
    const latest = this.getLatestTick();
    if (oldest === -1 || latest === -1) return false;
    return tick >= oldest && tick <= latest;
  }
}
