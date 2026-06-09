export const SIM_VERSION = '0.1.0';

// Export with namespaces to avoid name conflicts
export * as fp from './fixed.js';
export * as trig from './trig.js';
export * as vec2 from './vec2.js';
export * as prng from './prng.js';
export * as state from './state.js';
export { step } from './step.js';
export * as tuning from './tuning.js';
export * as track from './track.js';
export * as hash from './hash.js';

// Re-export specific items for backward compatibility
export { createSimState, createKartState } from './state.js';
export { createOvalTrack } from './track.js';
export { toFloat } from './fixed.js';
export type { SimState, KartState } from './state.js';
export type { Track } from './track.js';
export type { Fixed } from './fixed.js';
export { RollbackEngine } from './rollback/engine.js';
export type { RollbackResult } from './rollback/engine.js';
export { RingBuffer } from './rollback/buffer.js';
export type { TickRecord } from './rollback/buffer.js';
export { spawnItem, checkPickup, applyEffect } from './items.js';
export type { ItemType, ItemPickup, ItemEffect } from './items.js';
export { computePlacements, allFinished } from './placement.js';
export { updateCheckpoint, checkLapComplete, isShortcut } from './checkpoints.js';
export type { FrameMetrics } from './rollback/metrics.js';
export { recordMetrics, getMetrics, getBudgetReadout } from './rollback/metrics.js';
