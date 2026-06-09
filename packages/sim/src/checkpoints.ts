/**
 * Checkpoint and lap tracking.
 *
 * Deterministic advancement using fixed-point segment crossing.
 */

import type { Vec2 } from './vec2.js';
import type { Track } from './track.js';
import { segmentCrossed } from './track.js';

export function updateCheckpoint(
  oldPos: Vec2,
  newPos: Vec2,
  currentCheckpoint: number,
  track: Track,
): number {
  const nextCheckpoint = currentCheckpoint % track.checkpoints.length;
  const gate = track.checkpoints[nextCheckpoint];
  if (!gate) return currentCheckpoint;

  if (segmentCrossed(oldPos, newPos, gate)) {
    return currentCheckpoint + 1;
  }

  return currentCheckpoint;
}

export function checkLapComplete(
  oldPos: Vec2,
  newPos: Vec2,
  checkpoint: number,
  lap: number,
  track: Track,
  totalLaps: number,
): { checkpoint: number; lap: number; finished: boolean } {
  const checkpointCount = track.checkpoints.length;
  const newCheckpoint = updateCheckpoint(oldPos, newPos, checkpoint, track);

  if (newCheckpoint >= checkpointCount) {
    // Check if the kart crossed the start line after completing all checkpoints
    if (segmentCrossed(oldPos, newPos, track.startLine)) {
      const newLap = lap + 1;
      if (newLap >= totalLaps) {
        return { checkpoint: 0, lap: newLap, finished: true };
      }
      return { checkpoint: 0, lap: newLap, finished: false };
    }
  }

  return { checkpoint: newCheckpoint, lap, finished: false };
}

/** Check if a kart is trying to skip checkpoints (shortcut). */
export function isShortcut(
  oldPos: Vec2,
  newPos: Vec2,
  currentCheckpoint: number,
  track: Track,
): boolean {
  // Check if the kart crosses any checkpoint other than the next one
  for (let i = 0; i < track.checkpoints.length; i++) {
    if (i === currentCheckpoint % track.checkpoints.length) continue;
    if (segmentCrossed(oldPos, newPos, track.checkpoints[i]!)) {
      return true;
    }
  }
  return false;
}
