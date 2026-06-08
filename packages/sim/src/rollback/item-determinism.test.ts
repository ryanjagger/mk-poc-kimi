import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from '../state';
import { createOvalTrack } from '../track';
import { step } from '../step';
import type { InputFrame } from '@kart-racer/shared';
import { hashState } from '../hash';
import { spawnItem, checkPickup } from '../items';
import { Prng } from '../prng';
import * as fp from '../fixed';
import * as vec2 from '../vec2';

describe('Item determinism', () => {
  it('same seed + inputs produce identical hashes including item state', () => {
    const track = createOvalTrack();
    const seed = 12345;
    const playerCount = 2;
    const tickCount = 60;

    const inputs: InputFrame[][] = [];
    for (let t = 0; t < tickCount; t++) {
      inputs.push([
        { accelerate: true, brake: false, steerLeft: false, steerRight: false, drift: false },
        { accelerate: true, brake: false, steerLeft: false, steerRight: false, drift: false },
      ]);
    }

    // Golden run with items
    let state1 = createSimState(seed, playerCount);
    state1.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];
    const prng1 = new Prng(seed);
    const items1: ReturnType<typeof spawnItem>[] = [];

    for (let t = 0; t < tickCount; t++) {
      // Spawn items every 20 ticks
      if (t % 20 === 0) {
        items1.push(spawnItem(prng1, fp.fromInt(20), fp.fromInt(10)));
      }
      state1 = step(state1, inputs[t]!, track);
      // Check pickups
      for (const kart of state1.karts) {
        for (const item of items1) {
          if (checkPickup(kart.position, item)) {
            item.active = false;
          }
        }
      }
    }

    // Second run with same seed
    let state2 = createSimState(seed, playerCount);
    state2.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];
    const prng2 = new Prng(seed);
    const items2: ReturnType<typeof spawnItem>[] = [];

    for (let t = 0; t < tickCount; t++) {
      if (t % 20 === 0) {
        items2.push(spawnItem(prng2, fp.fromInt(20), fp.fromInt(10)));
      }
      state2 = step(state2, inputs[t]!, track);
      for (const kart of state2.karts) {
        for (const item of items2) {
          if (checkPickup(kart.position, item)) {
            item.active = false;
          }
        }
      }
    }

    expect(hashState(state1)).toBe(hashState(state2));
    expect(items1.length).toBe(items2.length);
    for (let i = 0; i < items1.length; i++) {
      expect(items1[i]!.active).toBe(items2[i]!.active);
    }
  });
});
