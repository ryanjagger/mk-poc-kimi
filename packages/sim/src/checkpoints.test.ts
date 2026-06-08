import { describe, it, expect } from 'vitest';
import { createOvalTrack } from './track';
import { checkLapComplete, isShortcut } from './checkpoints';
import * as fp from './fixed';
import * as vec2 from './vec2';

const V = vec2.vec2;

describe('Checkpoints', () => {
  it('advances checkpoint when crossing gate', () => {
    const track = createOvalTrack();
    const oldPos = V(fp.fromInt(9), fp.fromInt(1));
    const newPos = V(fp.fromInt(11), fp.fromInt(1));
    const result = checkLapComplete(oldPos, newPos, 0, 0, track, 3);
    expect(result.checkpoint).toBe(1);
    expect(result.lap).toBe(0);
    expect(result.finished).toBe(false);
  });

  it('does not advance checkpoint when not crossing gate', () => {
    const track = createOvalTrack();
    const oldPos = V(fp.fromInt(1), fp.fromInt(1));
    const newPos = V(fp.fromInt(2), fp.fromInt(1));
    const result = checkLapComplete(oldPos, newPos, 0, 0, track, 3);
    expect(result.checkpoint).toBe(0);
    expect(result.lap).toBe(0);
  });

  it('increments lap after completing all checkpoints and crossing start line', () => {
    const track = createOvalTrack();
    // After all 4 checkpoints, cross the start line
    const oldPos = V(fp.fromInt(1), fp.fromInt(1));
    const newPos = V(fp.fromInt(3), fp.fromInt(1));
    const result = checkLapComplete(oldPos, newPos, 4, 0, track, 3);
    expect(result.checkpoint).toBe(0);
    expect(result.lap).toBe(1);
    expect(result.finished).toBe(false);
  });

  it('detects finish on final lap', () => {
    const track = createOvalTrack();
    const oldPos = V(fp.fromInt(1), fp.fromInt(1));
    const newPos = V(fp.fromInt(3), fp.fromInt(1));
    const result = checkLapComplete(oldPos, newPos, 4, 2, track, 3);
    expect(result.finished).toBe(true);
    expect(result.lap).toBe(3);
  });

  it('detects shortcut', () => {
    const track = createOvalTrack();
    // Kart at checkpoint 0 tries to cross checkpoint 2
    const oldPos = V(fp.fromInt(9), fp.fromInt(8));
    const newPos = V(fp.fromInt(11), fp.fromInt(8));
    expect(isShortcut(oldPos, newPos, 0, track)).toBe(true);
  });

  it('does not detect shortcut when crossing correct gate', () => {
    const track = createOvalTrack();
    const oldPos = V(fp.fromInt(9), fp.fromInt(1));
    const newPos = V(fp.fromInt(11), fp.fromInt(1));
    expect(isShortcut(oldPos, newPos, 0, track)).toBe(false);
  });
});
