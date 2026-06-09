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

describe('Collision: kart-kart', () => {
  it('overlapping karts separate deterministically', () => {
    const state = createSimState(123, 2);
    // Place two karts overlapping at the same position
    state.karts = [
      createKartState(0, V(fp.fromInt(5), fp.fromInt(5)), 0),
      createKartState(1, V(fp.fromInt(5), fp.fromInt(5)), 0),
    ];

    let s = state;
    for (let i = 0; i < 10; i++) {
      s = step(s, [makeInput(), makeInput()]);
    }

    // Karts should have separated
    const dx = fp.sub(s.karts[0]!.position.x, s.karts[1]!.position.x);
    const dy = fp.sub(s.karts[0]!.position.y, s.karts[1]!.position.y);
    const distSq = fp.add(fp.mul(dx, dx), fp.mul(dy, dy));
    const diameterSq = fp.mul(fp.fromFloat(0.8), fp.fromFloat(0.8)); // 2 * 0.4 radius

    expect(fp.gt(distSq, fp.ZERO)).toBe(true);
    expect(fp.gte(distSq, diameterSq)).toBe(true);
  });

  it('karts moving toward each other bounce apart', () => {
    const state = createSimState(123, 2);
    // Place karts apart, moving toward each other
    state.karts = [
      createKartState(0, V(fp.fromInt(4), fp.fromInt(5)), 0),
      createKartState(1, V(fp.fromInt(6), fp.fromInt(5)), 32768), // facing left
    ];

    // Give them some velocity
    state.karts[0]!.velocity = V(fp.fromInt(1), fp.ZERO);
    state.karts[1]!.velocity = V(fp.neg(fp.fromInt(1)), fp.ZERO);

    let s = state;
    for (let i = 0; i < 20; i++) {
      s = step(s, [makeInput(), makeInput()]);
    }

    // They should have bounced and are now moving apart
    const dx = fp.sub(s.karts[0]!.position.x, s.karts[1]!.position.x);
    expect(fp.lt(dx, fp.ZERO)).toBe(true); // kart 0 is to the left of kart 1
  });
});
