import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from './state';
import { hashState, serialize, deserialize } from './hash';
import * as fp from './fixed';
import * as vec2 from './vec2';

const V = vec2.vec2;

describe('Hash', () => {
  it('same state produces same hash', () => {
    const state = createSimState(123, 2);
    state.karts = [
      createKartState(0, V(fp.fromInt(1), fp.fromInt(2)), 100),
      createKartState(1, V(fp.fromInt(3), fp.fromInt(4)), 200),
    ];

    const h1 = hashState(state);
    const h2 = hashState(state);
    expect(h1).toBe(h2);
  });

  it('different states produce different hashes', () => {
    const state1 = createSimState(123, 1);
    state1.karts = [createKartState(0, V(fp.ZERO, fp.ZERO), 0)];

    const state2 = createSimState(123, 1);
    state2.karts = [createKartState(0, V(fp.fromInt(1), fp.ZERO), 0)];

    expect(hashState(state1)).not.toBe(hashState(state2));
  });

  it('serialize + deserialize round-trip', () => {
    const state = createSimState(123, 2);
    state.karts = [
      createKartState(0, V(fp.fromInt(1), fp.fromInt(2)), 100),
      createKartState(1, V(fp.fromInt(3), fp.fromInt(4)), 200),
    ];
    state.karts[0]!.velocity = V(fp.fromInt(5), fp.fromInt(6));
    state.karts[0]!.lap = 2;
    state.karts[0]!.finished = true;

    const serialized = serialize(state);
    const restored = deserialize(serialized);

    expect(hashState(restored)).toBe(hashState(state));
    expect(restored.tick).toBe(state.tick);
    expect(restored.karts[0]!.position.x).toBe(state.karts[0]!.position.x);
    expect(restored.karts[0]!.lap).toBe(state.karts[0]!.lap);
    expect(restored.karts[0]!.finished).toBe(state.karts[0]!.finished);
  });
});
