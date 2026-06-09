/**
 * Race finish detection and placement ordering.
 */

import type { KartState } from './state.js';

export function computePlacements(karts: KartState[]): KartState[] {
  // Sort by: finished first, then lap descending, then checkpoint descending, then tick ascending
  const sorted = [...karts].sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    if (a.finished && b.finished) {
      // Tie-breaker: player index (lower = better placement)
      return a.playerIndex - b.playerIndex;
    }
    // Not finished: compare progress
    if (a.lap !== b.lap) return b.lap - a.lap;
    if (a.checkpoint !== b.checkpoint) return b.checkpoint - a.checkpoint;
    return a.playerIndex - b.playerIndex;
  });

  return sorted.map((k, i) => ({ ...k, placement: i + 1 }));
}

export function allFinished(karts: KartState[]): boolean {
  return karts.every((k) => k.finished);
}
