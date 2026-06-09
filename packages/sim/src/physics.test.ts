import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from './state.js';
import { step } from './step.js';
import type { InputFrame } from '@kart-racer/shared';
import * as fp from './fixed.js';
import * as vec2 from './vec2.js';

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

describe('Physics', () => {
  it('kart accelerates forward', () => {
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    const input = makeInput({ accelerate: true });
    let s = state;
    for (let i = 0; i < 60; i++) {
      s = step(s, [input]);
    }

    const speed = vec2.length(s.karts[0]!.velocity);
    expect(fp.gt(speed, fp.ZERO)).toBe(true);
    expect(fp.gt(s.karts[0]!.position.x, fp.ZERO)).toBe(true);
  });

  it('kart turns when steering', () => {
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    const input = makeInput({ accelerate: true, steerLeft: true });
    let s = state;
    for (let i = 0; i < 60; i++) {
      s = step(s, [input]);
    }

    // Heading should have changed (turned left)
    expect(s.karts[0]!.heading).not.toBe(0);
    // Position should have moved up (toward +y)
    expect(fp.gt(s.karts[0]!.position.y, fp.ZERO)).toBe(true);
  });

  it('kart stops when no input', () => {
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    // First accelerate
    let s = state;
    for (let i = 0; i < 60; i++) {
      s = step(s, [makeInput({ accelerate: true })]);
    }

    const speedBefore = vec2.length(s.karts[0]!.velocity);
    expect(fp.gt(speedBefore, fp.ZERO)).toBe(true);

    // Then coast
    for (let i = 0; i < 300; i++) {
      s = step(s, [makeInput()]);
    }

    const speedAfter = vec2.length(s.karts[0]!.velocity);
    expect(fp.lt(speedAfter, fp.fromFloat(0.1))).toBe(true);
  });

  it('braking slows the kart', () => {
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    let s = state;
    // Accelerate
    for (let i = 0; i < 60; i++) {
      s = step(s, [makeInput({ accelerate: true })]);
    }
    const speedAccel = vec2.length(s.karts[0]!.velocity);

    // Brake
    for (let i = 0; i < 30; i++) {
      s = step(s, [makeInput({ brake: true })]);
    }
    const speedBrake = vec2.length(s.karts[0]!.velocity);

    expect(fp.lt(speedBrake, speedAccel)).toBe(true);
  });
});
