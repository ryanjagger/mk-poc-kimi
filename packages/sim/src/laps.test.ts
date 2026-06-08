import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from './state';
import { step } from './step';
import { createOvalTrack } from './track';
import { checkLapComplete } from './checkpoints';
import type { InputFrame } from '@kart-racer/shared';
import * as fp from './fixed';
import * as vec2 from './vec2';

const V = vec2.vec2;

function makeInput(overrides: Partial<InputFrame> = {}): InputFrame {
  return {
    accelerate: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    drift: false,
    ...overrides,
  };
}

describe('Laps', () => {
  it('does not count shortcut as lap', () => {
    const track = createOvalTrack();
    const state = createSimState(123, 1, 3);
    // Place kart near the shortcut (between checkpoint 2 and 0)
    state.karts = [createKartState(0, V(fp.fromInt(10), fp.fromInt(8)), 0)];

    let s = state;
    // Drive across the shortcut
    for (let i = 0; i < 20; i++) {
      s = step(s, [makeInput({ accelerate: true, steerLeft: true })], track);
    }

    // Should not have advanced checkpoints
    expect(s.karts[0]!.checkpoint).toBe(0);
  });

  it('checkLapComplete increments lap after all checkpoints', () => {
    const track = createOvalTrack();
    const oldPos = V(fp.fromInt(1), fp.fromInt(1));
    const newPos = V(fp.fromInt(3), fp.fromInt(1));
    const result = checkLapComplete(oldPos, newPos, 4, 0, track, 3);
    expect(result.lap).toBe(1);
    expect(result.checkpoint).toBe(0);
  });

  it('detects finish on final lap', () => {
    const track = createOvalTrack();
    const oldPos = V(fp.fromInt(1), fp.fromInt(1));
    const newPos = V(fp.fromInt(3), fp.fromInt(1));
    const result = checkLapComplete(oldPos, newPos, 4, 2, track, 3);
    expect(result.finished).toBe(true);
    expect(result.lap).toBe(3);
  });

  it('respects totalLaps config', () => {
    const track = createOvalTrack();
    const oldPos = V(fp.fromInt(1), fp.fromInt(1));
    const newPos = V(fp.fromInt(3), fp.fromInt(1));
    const result = checkLapComplete(oldPos, newPos, 4, 1, track, 2);
    expect(result.finished).toBe(true);
    expect(result.lap).toBe(2);
  });
});
