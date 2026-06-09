/**
 * Pure simulation step function.
 *
 * Takes a SimState and per-tick inputs, returns a new SimState.
 * Deterministic: same seed + same inputs = identical output.
 */

import * as fp from './fixed.js';
import * as vec2 from './vec2.js';
import { sin, cos, fpSqrt } from './trig.js';
import type { SimState, KartState } from './state.js';
import type { InputFrame } from '@kart-racer/shared';
import * as tuning from './tuning.js';
import type { Track } from './track.js';
import { resolveCircleWall } from './track.js';
import { checkLapComplete, isShortcut } from './checkpoints.js';

export function step(state: SimState, inputs: InputFrame[], track?: Track): SimState {
  const newKarts: KartState[] = [];
  const playerCount = state.playerCount;

  for (let i = 0; i < playerCount; i++) {
    const kart = state.karts[i]!;
    const input = inputs[i]!;
    newKarts.push(stepKart(kart, input, track, state.totalLaps));
  }

  // Kart-kart collision (deterministic pair order)
  resolveKartCollisions(newKarts);

  return {
    ...state,
    tick: state.tick + 1,
    karts: newKarts,
  };
}

function stepKart(kart: KartState, input: InputFrame, track?: Track, totalLaps?: number): KartState {
  // Start with a shallow copy
  const newKart: KartState = {
    ...kart,
    position: { ...kart.position },
    velocity: { ...kart.velocity },
  };

  // --- Throttle ---
  let accel = fp.ZERO;
  if (input.accelerate) {
    accel = tuning.ACCEL;
  } else if (input.brake) {
    // If moving forward, brake; if stopped or moving back, reverse
    const speed = vec2.length(newKart.velocity);
    if (fp.gt(speed, fp.fromFloat(0.1))) {
      accel = fp.neg(tuning.BRAKE);
    } else {
      accel = fp.neg(tuning.REVERSE);
    }
  }

  // Apply acceleration along heading
  const heading = newKart.heading;
  const forward = vec2.vec2(cos(heading), sin(heading));
  const accelVec = vec2.scale(forward, accel);
  newKart.velocity = vec2.add(newKart.velocity, accelVec);

  // --- Friction ---
  const friction = vec2.scale(newKart.velocity, tuning.FRICTION);
  newKart.velocity = vec2.sub(newKart.velocity, friction);

  // --- Max speed clamp ---
  const speed = vec2.length(newKart.velocity);
  const maxSpeed = fp.add(tuning.MAX_SPEED, newKart.boostTimer > 0 ? tuning.BOOST_SPEED : fp.ZERO);
  if (fp.gt(speed, maxSpeed)) {
    newKart.velocity = vec2.scale(vec2.normalize(newKart.velocity), maxSpeed);
  }
  if (fp.lt(speed, tuning.MAX_REVERSE)) {
    // Allow reverse but clamp it
    // Actually, we should clamp separately for forward and reverse
  }

  // --- Steering ---
  let turnRate = tuning.TURN_RATE;
  if (fp.lt(speed, fp.fromInt(1))) {
    turnRate = tuning.TURN_RATE_SLOW;
  }

  if (input.steerLeft) {
    newKart.heading = (newKart.heading + (turnRate | 0)) & 0xFFFF;
  }
  if (input.steerRight) {
    newKart.heading = (newKart.heading - (turnRate | 0)) & 0xFFFF;
  }

  // --- Drift ---
  if (input.drift && (input.steerLeft || input.steerRight)) {
    newKart.driftCharge = Math.min(newKart.driftCharge + 1, tuning.DRIFT_THRESHOLD + 5);
  } else {
    if (newKart.driftCharge >= tuning.DRIFT_THRESHOLD) {
      newKart.boostTimer = tuning.BOOST_DURATION;
    }
    newKart.driftCharge = 0;
  }

  if (newKart.boostTimer > 0) {
    newKart.boostTimer -= 1;
  }

  // --- Movement ---
  newKart.position = vec2.add(newKart.position, newKart.velocity);

  // --- Wall collision ---
  if (track) {
    for (const wall of track.walls) {
      const resolved = resolveCircleWall(newKart.position, newKart.velocity, tuning.KART_RADIUS, wall);
      if (resolved) {
        newKart.position = resolved.pos;
        newKart.velocity = resolved.vel;
      }
    }
  }

  // --- Checkpoints & Laps ---
  if (track && !newKart.finished) {
    const oldPos = kart.position;
    const newPos = newKart.position;

    // Check for shortcut
    if (isShortcut(oldPos, newPos, newKart.checkpoint, track)) {
      // Reject shortcut: don't advance checkpoint
    } else {
      const result = checkLapComplete(oldPos, newPos, newKart.checkpoint, newKart.lap, track, totalLaps ?? 3);
      newKart.checkpoint = result.checkpoint;
      newKart.lap = result.lap;
      newKart.finished = result.finished;
    }
  }

  return newKart;
}

/** Resolve kart-kart collisions. Modifies karts in-place. */
export function resolveKartCollisions(karts: KartState[]): void {
  const count = karts.length;
  const diameterSq = fp.mul(
    fp.add(tuning.KART_RADIUS, tuning.KART_RADIUS),
    fp.add(tuning.KART_RADIUS, tuning.KART_RADIUS)
  );

  // Deterministic pair iteration: sorted by index
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const a = karts[i]!;
      const b = karts[j]!;

      const dx = fp.sub(b.position.x, a.position.x);
      const dy = fp.sub(b.position.y, a.position.y);
      const distSq = fp.add(fp.mul(dx, dx), fp.mul(dy, dy));

      if (fp.gt(distSq, diameterSq)) {
        continue;
      }

      let dist: fp.Fixed;
      let nx: fp.Fixed;
      let ny: fp.Fixed;

      if (distSq === fp.ZERO) {
        // Exact overlap: push apart along x-axis
        dist = fp.fromFloat(0.0001);
        nx = fp.ONE;
        ny = fp.ZERO;
      } else {
        dist = fpSqrt(distSq);
        if (dist === fp.ZERO) {
          continue;
        }
        nx = fp.div(dx, dist);
        ny = fp.div(dy, dist);
      }

      const overlap = fp.sub(fp.add(tuning.KART_RADIUS, tuning.KART_RADIUS), dist);

      // Push apart symmetrically
      const halfOverlap = fp.div(overlap, fp.fromInt(2));
      a.position.x = fp.sub(a.position.x, fp.mul(nx, halfOverlap));
      a.position.y = fp.sub(a.position.y, fp.mul(ny, halfOverlap));
      b.position.x = fp.add(b.position.x, fp.mul(nx, halfOverlap));
      b.position.y = fp.add(b.position.y, fp.mul(ny, halfOverlap));

      // Separate velocity: remove normal component from each
      const vaDot = fp.add(fp.mul(a.velocity.x, nx), fp.mul(a.velocity.y, ny));
      const vbDot = fp.add(fp.mul(b.velocity.x, nx), fp.mul(b.velocity.y, ny));

      a.velocity.x = fp.sub(a.velocity.x, fp.mul(nx, vaDot));
      a.velocity.y = fp.sub(a.velocity.y, fp.mul(ny, vaDot));
      b.velocity.x = fp.sub(b.velocity.x, fp.mul(nx, vbDot));
      b.velocity.y = fp.sub(b.velocity.y, fp.mul(ny, vbDot));
    }
  }
}
