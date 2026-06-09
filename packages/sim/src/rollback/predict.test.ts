import { describe, it, expect } from 'vitest';
import { RollbackEngine } from './engine.js';
import { createSimState, createKartState } from '../state';
import { createOvalTrack } from '../track';
import type { InputFrame } from '@kart-racer/shared';
import * as fp from '../fixed';
import * as vec2 from '../vec2';

describe('Prediction', () => {
  it('repeats last known input when missing', () => {
    const track = createOvalTrack();
    const engine = new RollbackEngine(8, track, 2);

    const input: InputFrame = {
      accelerate: true,
      brake: false,
      steerLeft: false,
      steerRight: false,
      drift: false,
    };

    engine.setInput(0, input);
    const predicted = engine.predict(0);
    expect(predicted).toEqual(input);
  });

  it('returns neutral input when no prior input known', () => {
    const track = createOvalTrack();
    const engine = new RollbackEngine(8, track, 2);

    const predicted = engine.predict(0);
    expect(predicted.accelerate).toBe(false);
    expect(predicted.brake).toBe(false);
  });
});
