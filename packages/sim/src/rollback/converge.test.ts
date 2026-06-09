import { describe, it, expect } from 'vitest';
import { RollbackEngine } from './engine.js';
import { createSimState, createKartState } from '../state';
import { createOvalTrack } from '../track';
import { step } from '../step';
import type { InputFrame } from '@kart-racer/shared';
import { hashState } from '../hash';

describe('Rollback convergence', () => {
  it('delayed/reordered run converges to identical hashes', () => {
    const track = createOvalTrack();
    const seed = 12345;
    const playerCount = 2;
    const tickCount = 60;

    const inputs: InputFrame[][] = [];
    for (let t = 0; t < tickCount; t++) {
      inputs.push([
        { accelerate: t % 2 === 0, brake: false, steerLeft: false, steerRight: false, drift: false },
        { accelerate: t % 3 === 0, brake: false, steerLeft: t % 5 === 0, steerRight: false, drift: false },
      ]);
    }

    // Golden run
    let goldenState = createSimState(seed, playerCount);
    goldenState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];
    for (let t = 0; t < tickCount; t++) {
      goldenState = step(goldenState, inputs[t]!, track);
    }
    const goldenHash = hashState(goldenState);

    // Delayed run with wrong inputs for ticks 0-4
    let delayedState = createSimState(seed, playerCount);
    delayedState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];

    const engine = new RollbackEngine(60, track, playerCount);
    const wrongInputs: InputFrame[] = [
      { accelerate: false, brake: false, steerLeft: false, steerRight: false, drift: false },
      { accelerate: false, brake: false, steerLeft: false, steerRight: false, drift: false },
    ];

    for (let t = 0; t < tickCount; t++) {
      const currentInputs = t < 5 ? wrongInputs : inputs[t]!;
      engine.store(delayedState.tick, delayedState, currentInputs);
      delayedState = step(delayedState, currentInputs, track);
    }

    // Now correct all ticks and rollback
    const correctedInputs = new Map<number, InputFrame[]>();
    for (let t = 0; t < tickCount; t++) {
      correctedInputs.set(t, inputs[t]!);
    }
    const result = engine.rollback(correctedInputs);
    expect(result.resimulatedTicks).toBe(tickCount);
    delayedState = result.state;

    expect(hashState(delayedState)).toBe(goldenHash);
  });
});
