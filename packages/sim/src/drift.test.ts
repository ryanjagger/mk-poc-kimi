import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from './state';
import { step } from './step';
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

describe('Drift', () => {
  it('drift charge increases while holding drift + steering', () => {
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    const input = makeInput({ accelerate: true, drift: true, steerLeft: true });
    let s = state;
    for (let i = 0; i < 20; i++) {
      s = step(s, [input]);
    }

    expect(s.karts[0]!.driftCharge).toBeGreaterThan(0);
  });

  it('releasing drift after charge triggers boost', () => {
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    // Charge drift
    let s = state;
    const chargeInput = makeInput({ accelerate: true, drift: true, steerLeft: true });
    for (let i = 0; i < 20; i++) {
      s = step(s, [chargeInput]);
    }
    expect(s.karts[0]!.driftCharge).toBeGreaterThanOrEqual(10);

    // Release drift
    const releaseInput = makeInput({ accelerate: true });
    s = step(s, [releaseInput]);
    expect(s.karts[0]!.boostTimer).toBeGreaterThan(0);
    expect(s.karts[0]!.driftCharge).toBe(0);
  });

  it('boost timer persists for correct duration', () => {
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    // Charge drift with steering
    let s = state;
    const chargeInput = makeInput({ accelerate: true, drift: true, steerLeft: true });
    for (let i = 0; i < 15; i++) {
      s = step(s, [chargeInput]);
    }

    // Release boost
    s = step(s, [makeInput({ accelerate: true })]);
    const initialBoostTimer = s.karts[0]!.boostTimer;
    expect(initialBoostTimer).toBeGreaterThan(0);

    // Let it run for a few ticks
    for (let i = 0; i < 10; i++) {
      s = step(s, [makeInput({ accelerate: true })]);
    }
    expect(s.karts[0]!.boostTimer).toBe(initialBoostTimer - 10);
  });
});
