import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from '../state';
import { createOvalTrack } from '../track';
import { step } from '../step';
import type { InputFrame } from '@kart-racer/shared';
import { hashState } from '../hash';

describe('Rollback debug', () => {
  it('single tick correction', () => {
    const track = createOvalTrack();
    const seed = 12345;
    const playerCount = 2;

    const inputs: InputFrame[][] = [];
    for (let t = 0; t < 3; t++) {
      inputs.push([
        { accelerate: true, brake: false, steerLeft: false, steerRight: false, drift: false },
        { accelerate: true, brake: false, steerLeft: false, steerRight: false, drift: false },
      ]);
    }

    // Golden run
    let goldenState = createSimState(seed, playerCount);
    goldenState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];
    for (let t = 0; t < 3; t++) {
      goldenState = step(goldenState, inputs[t]!, track);
    }

    // Delayed run with wrong input at tick 0
    let delayedState = createSimState(seed, playerCount);
    delayedState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];

    const wrongInputs: InputFrame[] = [
      { accelerate: false, brake: false, steerLeft: false, steerRight: false, drift: false },
      { accelerate: false, brake: false, steerLeft: false, steerRight: false, drift: false },
    ];

    for (let t = 0; t < 3; t++) {
      delayedState = step(delayedState, t === 0 ? wrongInputs : inputs[t]!, track);
    }

    // Now manually re-simulate from tick 0 with correct input
    let reSimState = createSimState(seed, playerCount);
    reSimState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];
    for (let t = 0; t < 3; t++) {
      reSimState = step(reSimState, inputs[t]!, track);
    }

    console.log('golden hash:', hashState(goldenState));
    console.log('delayed hash:', hashState(delayedState));
    console.log('reSim hash:', hashState(reSimState));

    expect(hashState(reSimState)).toBe(hashState(goldenState));
    expect(hashState(reSimState)).toBe(hashState(delayedState));
  });
});
