import { describe, it, expect } from 'vitest';
import { RollbackEngine } from './engine';
import { createSimState, createKartState } from '../state';
import { createOvalTrack } from '../track';
import { step } from '../step';
import type { InputFrame } from '@kart-racer/shared';
import { hashState } from '../hash';

describe('Rollback convergence small', () => {
  it('delayed 3-tick run converges', () => {
    const track = createOvalTrack();
    const seed = 12345;
    const playerCount = 2;
    const tickCount = 10;

    const inputs: InputFrame[][] = [];
    for (let t = 0; t < tickCount; t++) {
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
    for (let t = 0; t < tickCount; t++) {
      goldenState = step(goldenState, inputs[t]!, track);
    }

    // Delayed run
    let delayedState = createSimState(seed, playerCount);
    delayedState.karts = [
      createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
      createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
    ];

    const engine = new RollbackEngine(10, track, playerCount);
    const correctedInputs = new Map<number, InputFrame[]>();

    for (let t = 0; t < tickCount; t++) {
      const currentInputs = t >= 3 ? inputs[t - 3]! : [
        { accelerate: true, brake: false, steerLeft: false, steerRight: false, drift: false },
        { accelerate: false, brake: false, steerLeft: false, steerRight: false, drift: false },
      ];

      if (t >= 3) {
        correctedInputs.set(t - 3, inputs[t - 3]!);
      }

      engine.store(delayedState.tick, delayedState, currentInputs);
      delayedState = step(delayedState, currentInputs, track);

      const result = engine.rollback(correctedInputs);
      if (result.resimulatedTicks > 0) {
        delayedState = result.state;
      }

      // At each tick after tick 5, the state should match the golden state (all corrections applied)
      if (t >= 5) {
        let expected = createSimState(seed, playerCount);
        expected.karts = [
          createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
          createKartState(1, track.spawnPositions[1]!, track.spawnHeadings[1]!),
        ];
        for (let i = 0; i <= t; i++) {
          expected = step(expected, inputs[i]!, track);
        }
        expect(hashState(delayedState)).toBe(hashState(expected));
      }
    }
  });
});
