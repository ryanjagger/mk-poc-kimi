import { describe, it, expect } from 'vitest';
import { createSimState, createKartState } from './state.js';
import { step } from './step.js';
import type { InputFrame } from '@kart-racer/shared';
import { hashState } from './hash.js';
import * as fp from './fixed.js';
import * as vec2 from './vec2.js';
import { createOvalTrack } from './track.js';

const V = vec2.vec2;

/** Generate deterministic scripted inputs for N players over K ticks. */
function generateScriptedInputs(seed: number, playerCount: number, tickCount: number): InputFrame[][] {
  const inputs: InputFrame[][] = [];
  let state = seed;

  function next(): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  }

  for (let t = 0; t < tickCount; t++) {
    const tickInputs: InputFrame[] = [];
    for (let p = 0; p < playerCount; p++) {
      const flags = next() % 32;
      tickInputs.push({
        accelerate: (flags & 1) !== 0,
        brake: (flags & 2) !== 0,
        steerLeft: (flags & 4) !== 0,
        steerRight: (flags & 8) !== 0,
        drift: (flags & 16) !== 0,
      });
    }
    inputs.push(tickInputs);
  }

  return inputs;
}

function runScenario(seed: number, playerCount: number, tickCount: number): number[] {
  const track = createOvalTrack();
  const state = createSimState(seed, playerCount);
  state.karts = [];
  for (let i = 0; i < playerCount; i++) {
    state.karts.push(createKartState(
      i,
      track.spawnPositions[i] ?? V(fp.ZERO, fp.ZERO),
      track.spawnHeadings[i] ?? 0
    ));
  }

  const inputs = generateScriptedInputs(seed, playerCount, tickCount);
  const hashes: number[] = [];
  let current = state;

  for (let t = 0; t < tickCount; t++) {
    current = step(current, inputs[t]!, track);
    hashes.push(hashState(current));
  }

  return hashes;
}

describe('Determinism', () => {
  it('two independent runs produce identical per-tick hashes', () => {
    const hashes1 = runScenario(12345, 2, 120);
    const hashes2 = runScenario(12345, 2, 120);
    expect(hashes1).toEqual(hashes2);
  });

  it('matches golden hash list for 2-player scenario', () => {
    const hashes = runScenario(12345, 2, 120);
    expect(hashes).toMatchSnapshot();
  });

  it('matches golden hash list for 4-player scenario', () => {
    const hashes = runScenario(99999, 4, 120);
    expect(hashes).toMatchSnapshot();
  });

  it('different seeds produce different hashes', () => {
    const hashes1 = runScenario(12345, 2, 60);
    const hashes2 = runScenario(54321, 2, 60);
    expect(hashes1).not.toEqual(hashes2);
  });
});
