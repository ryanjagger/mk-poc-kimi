/**
 * Simulation state.
 *
 * All fields are integers / Fixed-point. No floats, no platform deps.
 */

import * as fp from './fixed';
import type { Fixed } from './fixed';
import type { Vec2 } from './vec2';
import type { PrngState } from './prng';

export interface KartState {
  /** Player index (0..N-1), fixed iteration order. */
  playerIndex: number;

  /** Position in world space (Q16.16). */
  position: Vec2;

  /** Velocity (Q16.16 per tick). */
  velocity: Vec2;

  /** Heading angle in integer units (0..65535 = full circle). */
  heading: number;

  /** Drift charge timer (0 = not drifting, >0 = charging). */
  driftCharge: number;

  /** Boost timer (0 = no boost, >0 = ticks remaining). */
  boostTimer: number;

  /** Current checkpoint index (0 = start line, 1..N = checkpoints). */
  checkpoint: number;

  /** Completed lap count. */
  lap: number;

  /** Whether the kart has finished the race. */
  finished: boolean;

  /** Finish placement (1st, 2nd, ...). 0 until finished. */
  placement: number;
}

export interface SimState {
  /** Current tick number (starts at 0, increments each step). */
  tick: number;

  /** Shared PRNG state (part of determinism). */
  prng: PrngState;

  /** All kart states, indexed by playerIndex. */
  karts: KartState[];

  /** Number of players (max 4). */
  playerCount: number;

  /** Target lap count for the race. */
  totalLaps: number;

  /** Whether the race has started (after countdown). */
  raceStarted: boolean;

  /** Countdown timer (ticks until race starts). */
  countdownTicks: number;
}

export function createKartState(playerIndex: number, startPos: Vec2, startHeading: number): KartState {
  return {
    playerIndex,
    position: startPos,
    velocity: { x: fp.ZERO, y: fp.ZERO },
    heading: startHeading,
    driftCharge: 0,
    boostTimer: 0,
    checkpoint: 0,
    lap: 0,
    finished: false,
    placement: 0,
  };
}

export function createSimState(seed: number, playerCount: number, totalLaps: number = 3): SimState {
  return {
    tick: 0,
    prng: { seed: seed >>> 0 },
    karts: [],
    playerCount,
    totalLaps,
    raceStarted: false,
    countdownTicks: 0,
  };
}
