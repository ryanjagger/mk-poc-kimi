/**
 * Rollback engine with prediction.
 *
 * When a remote input for a tick is missing, predicts by repeating last known input.
 * On receiving a corrected input for a past tick: restore snapshot, re-apply, re-sim.
 */

import type { SimState } from '../state';
import type { InputFrame } from '@kart-racer/shared';
import { step } from '../step';
import type { Track } from '../track';
import { RingBuffer } from './buffer';

export interface RollbackResult {
  state: SimState;
  /** Number of ticks re-simulated this frame. */
  resimulatedTicks: number;
  /** How far back we rolled (0 if no rollback). */
  rollbackDistance: number;
}

export class RollbackEngine {
  private buffer: RingBuffer;
  private track: Track;
  private playerCount: number;
  private latestInputs: (InputFrame | null)[];

  /** Max rollback window in ticks. */
  readonly windowSize: number;

  constructor(windowSize: number, track: Track, playerCount: number) {
    this.windowSize = windowSize;
    this.buffer = new RingBuffer(windowSize);
    this.track = track;
    this.playerCount = playerCount;
    this.latestInputs = new Array(playerCount).fill(null);
  }

  /** Store a tick record in the buffer. */
  store(tick: number, state: SimState, inputs: InputFrame[]): void {
    this.buffer.push({ tick, state, inputs });
  }

  /** Predict missing input by repeating last known input. */
  predict(playerIndex: number): InputFrame {
    const last = this.latestInputs[playerIndex];
    if (last) {
      return { ...last };
    }
    return {
      accelerate: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      drift: false,
    };
  }

  /** Register a confirmed input for a player (local or remote). */
  setInput(playerIndex: number, input: InputFrame): void {
    this.latestInputs[playerIndex] = input;
  }

  /** Apply corrected inputs for past ticks. Re-sim from the oldest corrected tick. */
  rollback(correctedInputs: Map<number, InputFrame[]>): RollbackResult {
    const latestTick = this.buffer.getLatestTick();
    if (latestTick === -1) {
      return { state: null as unknown as SimState, resimulatedTicks: 0, rollbackDistance: 0 };
    }

    // Find the oldest tick that has a correction
    let oldestCorrected = Infinity;
    for (const tick of correctedInputs.keys()) {
      if (tick < oldestCorrected) oldestCorrected = tick;
    }

    if (oldestCorrected === Infinity) {
      return { state: null as unknown as SimState, resimulatedTicks: 0, rollbackDistance: 0 };
    }

    const oldestTick = this.buffer.getOldestTick();
    if (oldestCorrected < oldestTick) {
      return { state: null as unknown as SimState, resimulatedTicks: 0, rollbackDistance: 0 };
    }

    const record = this.buffer.get(oldestCorrected);
    if (!record) {
      return { state: null as unknown as SimState, resimulatedTicks: 0, rollbackDistance: 0 };
    }

    let state = record.state;
    let resimulated = 0;
    const correctedRecords: { tick: number; state: SimState; inputs: InputFrame[] }[] = [];

    for (let t = oldestCorrected; t <= latestTick; t++) {
      const nextRecord = this.buffer.get(t);
      if (nextRecord) {
        const corrected = correctedInputs.get(t);
        const inputs = corrected ?? nextRecord.inputs;
        state = step(state, inputs, this.track);
        resimulated++;
        correctedRecords.push({ tick: t + 1, state, inputs });
      } else {
        const predicted: InputFrame[] = [];
        for (let i = 0; i < this.playerCount; i++) {
          predicted.push(this.predict(i));
        }
        state = step(state, predicted, this.track);
        resimulated++;
      }
    }

    const rollbackDistance = latestTick - oldestCorrected;
    return { state, resimulatedTicks: resimulated, rollbackDistance };
  }
}
