/**
 * Arcade kart physics tuning constants.
 *
 * All values are Fixed Q16.16.
 */

import * as fp from './fixed';

export const ACCEL = fp.fromFloat(0.25);      // acceleration per tick
export const BRAKE = fp.fromFloat(0.12);      // braking deceleration per tick
export const REVERSE = fp.fromFloat(0.04);    // reverse acceleration per tick
export const FRICTION = fp.fromFloat(0.02);   // natural friction per tick
export const MAX_SPEED = fp.fromInt(8);         // max forward speed
export const MAX_REVERSE = fp.fromInt(3);       // max reverse speed
export const TURN_RATE = fp.fromFloat(0.08);    // turn rate per tick at speed
export const TURN_RATE_SLOW = fp.fromFloat(0.12); // turn rate when stopped/slow
export const DRIFT_THRESHOLD = 10;              // ticks to charge mini-boost
export const BOOST_DURATION = 30;               // ticks of boost
export const BOOST_SPEED = fp.fromFloat(1.5);   // speed added during boost
export const KART_RADIUS = fp.fromFloat(0.4);   // collision radius
export const WALL_BOUNCE = fp.fromFloat(0.5);   // velocity retained after wall hit
