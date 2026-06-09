import { describe, it, expect } from 'vitest';
import { computePlacements, allFinished } from './placement.js';
import type { KartState } from './state.js';

describe('Placement', () => {
  it('orders finished karts by player index on ties', () => {
    const karts: KartState[] = [
      { playerIndex: 0, lap: 3, checkpoint: 0, finished: true, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
      { playerIndex: 1, lap: 3, checkpoint: 0, finished: true, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
    ];
    const placed = computePlacements(karts);
    expect(placed[0]!.placement).toBe(1);
    expect(placed[0]!.playerIndex).toBe(0);
    expect(placed[1]!.placement).toBe(2);
    expect(placed[1]!.playerIndex).toBe(1);
  });

  it('orders unfinished karts by lap and checkpoint', () => {
    const karts: KartState[] = [
      { playerIndex: 0, lap: 2, checkpoint: 3, finished: false, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
      { playerIndex: 1, lap: 3, checkpoint: 1, finished: false, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
    ];
    const placed = computePlacements(karts);
    expect(placed[0]!.placement).toBe(1);
    expect(placed[0]!.playerIndex).toBe(1);
    expect(placed[1]!.placement).toBe(2);
    expect(placed[1]!.playerIndex).toBe(0);
  });

  it('detects all finished', () => {
    const karts: KartState[] = [
      { playerIndex: 0, lap: 3, checkpoint: 0, finished: true, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
      { playerIndex: 1, lap: 3, checkpoint: 0, finished: true, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
    ];
    expect(allFinished(karts)).toBe(true);
  });

  it('detects not all finished', () => {
    const karts: KartState[] = [
      { playerIndex: 0, lap: 3, checkpoint: 0, finished: true, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
      { playerIndex: 1, lap: 2, checkpoint: 1, finished: false, placement: 0, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, heading: 0, driftCharge: 0, boostTimer: 0 } as KartState,
    ];
    expect(allFinished(karts)).toBe(false);
  });
});
