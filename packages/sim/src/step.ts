/**
 * Pure simulation step function.
 *
 * Takes a SimState and per-tick inputs, returns a new SimState.
 * Deterministic: same seed + same inputs = identical output.
 */

import * as fp from './fixed';
import * as vec2 from './vec2';
import { sin, cos } from './trig';
import type { SimState, KartState } from './state';
import type { InputFrame } from '@kart-racer/shared';
import * as tuning from './tuning';
import type { Track } from './track';
import { resolveCircleWall } from './track';

export function step(state: SimState, inputs: InputFrame[], track?: Track): SimState {
  const newKarts: KartState[] = [];
  const playerCount = state.playerCount;

  for (let i = 0; i < playerCount; i++) {
    const kart = state.karts[i]!;
    const input = inputs[i]!;
    newKarts.push(stepKart(kart, input, track));
  }

  return {
    ...state,
    tick: state.tick + 1,
    karts: newKarts,
  };
}

function stepKart(kart: KartState, input: InputFrame, track?: Track): KartState {
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

  return newKart;
}
