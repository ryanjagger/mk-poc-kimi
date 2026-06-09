import { describe, it, expect } from 'vitest';
import { spawnItem, checkPickup } from './items.js';
import { Prng } from './prng.js';
import * as fp from './fixed.js';
import * as vec2 from './vec2.js';

describe('Items', () => {
  it('spawn is deterministic from seed', () => {
    const prng = new Prng(42);
    const item1 = spawnItem(prng, fp.fromInt(20), fp.fromInt(10));
    const prng2 = new Prng(42);
    const item2 = spawnItem(prng2, fp.fromInt(20), fp.fromInt(10));
    expect(item1.position.x).toBe(item2.position.x);
    expect(item1.position.y).toBe(item2.position.y);
  });

  it('pickup on overlap', () => {
    const pickup = {
      id: 1,
      type: 'speedBoost' as const,
      position: vec2.vec2(fp.fromInt(5), fp.fromInt(5)),
      active: true,
    };
    const kartPos = vec2.vec2(fp.fromInt(5), fp.fromInt(5));
    expect(checkPickup(kartPos, pickup)).toBe(true);
  });

  it('no pickup when far away', () => {
    const pickup = {
      id: 1,
      type: 'speedBoost' as const,
      position: vec2.vec2(fp.fromInt(5), fp.fromInt(5)),
      active: true,
    };
    const kartPos = vec2.vec2(fp.fromInt(10), fp.fromInt(10));
    expect(checkPickup(kartPos, pickup)).toBe(false);
  });
});
