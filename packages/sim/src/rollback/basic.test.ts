import { describe, it, expect } from 'vitest';
import { RollbackEngine } from './engine.js';
import { createSimState, createKartState } from '../state';
import { createOvalTrack } from '../track';
import { step } from '../step';
import type { InputFrame } from '@kart-racer/shared';
import { hashState } from '../hash';

describe('Rollback basic', () => {
  it('re-simulating from a past tick with corrected input yields same state as golden', () => {
    const track = createOvalTrack();
    const seed = 12345;
    const playerCount = 2;

    const inputs: InputFrame[][] = [];
    for (let t = 0; t < 10; t++) {
      inputs.push([
        { accelerate: true, brake: false, steerLeft: false, steerRight: false, drift: false },
        { accelerate: t < 5, brake: false, steerLeft: false, steerRight: false, drift: false },
      ]);
    }

    // Golden run
    let goldenState = createSimState(seed, playerCount);
    goldenState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];
    for (let t = 0; t < 10; t++) {
      goldenState = step(goldenState, inputs[t]!, track);
    }

    // Delayed run: player 1 input is wrong for ticks 0-4, then corrected at tick 5
    let delayedState = createSimState(seed, playerCount);
    delayedState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];

    const engine = new RollbackEngine(12, track, playerCount);
    const wrongInputs: InputFrame[] = [
      { accelerate: false, brake: false, steerLeft: false, steerRight: false, drift: false },
      { accelerate: false, brake: false, steerLeft: false, steerRight: false, drift: false },
    ];

    for (let t = 0; t < 10; t++) {
      const currentInputs = t < 5 ? wrongInputs : inputs[t]!;
      engine.store(delayedState.tick, delayedState, currentInputs);
      delayedState = step(delayedState, currentInputs, track);
    }

    // Now correct ticks 0-4 and rollback
    const correctedInputs = new Map<number, InputFrame[]>();
    for (let t = 0; t < 5; t++) {
      correctedInputs.set(t, inputs[t]!);
    }
    const result = engine.rollback(correctedInputs);
    expect(result.resimulatedTicks).toBeGreaterThan(0);
    delayedState = result.state;

    console.log('rollback hash:', hashState(delayedState));
    console.log('golden hash:', hashState(goldenState));
    console.log('rollback resimulated:', result.resimulatedTicks);

    expect(hashState(delayedState)).toBe(hashState(goldenState));
  });
});
