/**
 * Item system for kart racer.
 *
 * Deterministic spawn/pickup using the sim PRNG.
 */

import * as fp from './fixed';
import type { Fixed } from './fixed';
import type { Vec2 } from './vec2';
import type { Prng } from './prng';

export type ItemType = 'speedBoost';

export interface ItemPickup {
  id: number;
  type: ItemType;
  position: Vec2;
  active: boolean;
}

export interface ItemEffect {
  type: ItemType;
  duration: number;
  timer: number;
}

let nextId = 0;

export function spawnItem(prng: Prng, trackWidth: Fixed, trackHeight: Fixed): ItemPickup {
  const id = nextId++;
  const x = (prng.nextInRange(Number(trackWidth) >>> 0) << 16) as unknown as Fixed;
  const y = (prng.nextInRange(Number(trackHeight) >>> 0) << 16) as unknown as Fixed;
  return {
    id,
    type: 'speedBoost',
    position: { x, y },
    active: true,
  };
}

export function checkPickup(kartPos: Vec2, pickup: ItemPickup, radius: Fixed = fp.fromFloat(0.5)): boolean {
  if (!pickup.active) return false;
  const dx = fp.sub(kartPos.x, pickup.position.x);
  const dy = fp.sub(kartPos.y, pickup.position.y);
  const distSq = fp.add(fp.mul(dx, dx), fp.mul(dy, dy));
  const rSq = fp.mul(radius, radius);
  return fp.lte(distSq, rSq);
}

export function applyEffect(effect: ItemEffect, kart: { boostTimer: number; velocity: Vec2 }): void {
  if (effect.type === 'speedBoost') {
    kart.boostTimer = effect.duration;
  }
}
