import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from './state.js';
import { step } from './step.js';
import type { InputFrame } from '@kart-racer/shared';
import * as fp from './fixed.js';
import * as vec2 from './vec2.js';
import { createOvalTrack } from './track.js';

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

describe('Collision: kart-wall', () => {
  it('kart stops at wall', () => {
    const track = createOvalTrack();
    const state = createSimState(123, 1);
    // Place kart near the left wall, heading right
    state.karts = [createKartState(0, V(fp.fromFloat(0.5), fp.fromFloat(5)), 0)];

    let s = state;
    // Drive right into the outer wall at x=0
    for (let i = 0; i < 60; i++) {
      s = step(s, [makeInput({ accelerate: true })], track);
    }

    // Position should not go past the wall (x=0 is the wall, kart should stay to the right)
    expect(fp.gte(s.karts[0]!.position.x, fp.ZERO)).toBe(true);
    // Speed should be reduced after hitting wall
    const speed = vec2.length(s.karts[0]!.velocity);
    expect(fp.lt(speed, fp.fromInt(2))).toBe(true);
  });

  it('kart does not tunnel through wall', () => {
    const track = createOvalTrack();
    const state = createSimState(123, 1);
    // Place kart inside the track, heading toward inner wall
    state.karts = [createKartState(0, V(fp.fromFloat(4), fp.fromFloat(5)), 0)];

    let s = state;
    for (let i = 0; i < 60; i++) {
      s = step(s, [makeInput({ accelerate: true })], track);
    }

    // Kart should not cross the inner wall at x=5 (should stay on left side)
    expect(fp.lt(s.karts[0]!.position.x, fp.fromInt(5))).toBe(true);
  });
});
