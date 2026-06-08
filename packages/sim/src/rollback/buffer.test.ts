import { describe, it, expect } from 'vitest';
import { RingBuffer } from './buffer';
import { createSimState, createKartState } from '../state';
import * as fp from '../fixed';
import * as vec2 from '../vec2';

describe('RingBuffer', () => {
  it('stores and retrieves by tick', () => {
    const buf = new RingBuffer(8);
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, vec2.vec2(fp.ZERO, fp.ZERO), 0)];

    buf.push({ tick: 5, state, inputs: [] });
    buf.push({ tick: 6, state, inputs: [] });
    buf.push({ tick: 7, state, inputs: [] });

    const rec = buf.get(6);
    expect(rec).toBeDefined();
    expect(rec!.tick).toBe(6);
  });

  it('evicts old entries beyond window', () => {
    const buf = new RingBuffer(3);
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, vec2.vec2(fp.ZERO, fp.ZERO), 0)];

    buf.push({ tick: 1, state, inputs: [] });
    buf.push({ tick: 2, state, inputs: [] });
    buf.push({ tick: 3, state, inputs: [] });
    buf.push({ tick: 4, state, inputs: [] });

    expect(buf.get(1)).toBeUndefined();
    expect(buf.get(4)).toBeDefined();
  });

  it('reports latest and oldest tick', () => {
    const buf = new RingBuffer(8);
    const state = createSimState(123, 1);
    state.karts = [createKartState(0, vec2.vec2(fp.ZERO, fp.ZERO), 0)];

    buf.push({ tick: 10, state, inputs: [] });
    buf.push({ tick: 11, state, inputs: [] });

    expect(buf.getLatestTick()).toBe(11);
    expect(buf.getOldestTick()).toBe(10);
  });
});
