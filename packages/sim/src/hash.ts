/**
 * Deterministic state hashing and serialization.
 *
 * Used for desync detection and rollback snapshots.
 * All fields are hashed in stable order. No JSON key reordering.
 */

import type { SimState, KartState } from './state';

/** Simple deterministic hash (FNV-1a 32-bit) over integers. */
export function hashState(state: SimState): number {
  let hash = 2166136261;
  const mix = (val: number) => {
    hash ^= val >>> 0;
    hash = (hash * 16777619) >>> 0;
  };

  mix(state.tick);
  mix(state.prng.seed);
  mix(state.playerCount);
  mix(state.totalLaps);
  mix(state.raceStarted ? 1 : 0);
  mix(state.countdownTicks);

  for (let i = 0; i < state.karts.length; i++) {
    const k = state.karts[i]!;
    mix(k.playerIndex);
    mix(k.position.x | 0);
    mix(k.position.y | 0);
    mix(k.velocity.x | 0);
    mix(k.velocity.y | 0);
    mix(k.heading);
    mix(k.driftCharge);
    mix(k.boostTimer);
    mix(k.checkpoint);
    mix(k.lap);
    mix(k.finished ? 1 : 0);
    mix(k.placement);
  }

  return hash >>> 0;
}

/** Compact integer-only serialization. */
export function serialize(state: SimState): number[] {
  const out: number[] = [];
  out.push(state.tick);
  out.push(state.prng.seed >>> 0);
  out.push(state.playerCount);
  out.push(state.totalLaps);
  out.push(state.raceStarted ? 1 : 0);
  out.push(state.countdownTicks);
  out.push(state.karts.length);

  for (let i = 0; i < state.karts.length; i++) {
    const k = state.karts[i]!;
    out.push(k.playerIndex);
    out.push(k.position.x | 0);
    out.push(k.position.y | 0);
    out.push(k.velocity.x | 0);
    out.push(k.velocity.y | 0);
    out.push(k.heading);
    out.push(k.driftCharge);
    out.push(k.boostTimer);
    out.push(k.checkpoint);
    out.push(k.lap);
    out.push(k.finished ? 1 : 0);
    out.push(k.placement);
  }

  return out;
}

/** Deserialize from compact format. */
export function deserialize(data: number[]): SimState {
  const [tick, seed, playerCount, totalLaps, raceStarted, countdownTicks, kartCount] = data;
  const karts: KartState[] = [];
  let offset = 7;

  for (let i = 0; i < kartCount; i++) {
    karts.push({
      playerIndex: data[offset++]!,
      position: { x: data[offset++]!, y: data[offset++]! },
      velocity: { x: data[offset++]!, y: data[offset++]! },
      heading: data[offset++]!,
      driftCharge: data[offset++]!,
      boostTimer: data[offset++]!,
      checkpoint: data[offset++]!,
      lap: data[offset++]!,
      finished: data[offset++]! === 1,
      placement: data[offset++]!,
    });
  }

  return {
    tick,
    prng: { seed: seed >>> 0 },
    karts,
    playerCount,
    totalLaps,
    raceStarted: raceStarted === 1,
    countdownTicks,
  };
}
