export const SIM_VERSION = '0.1.0';

// Export with namespaces to avoid name conflicts
export * as fp from './fixed';
export * as trig from './trig';
export * as vec2 from './vec2';
export * as prng from './prng';
export * as state from './state';
export { step } from './step';
export * as tuning from './tuning';
export * as track from './track';
export * as hash from './hash';

// Re-export specific items for backward compatibility
export { createSimState, createKartState } from './state';
export { createOvalTrack } from './track';
export { toFloat } from './fixed';
export type { SimState, KartState } from './state';
export type { Track } from './track';
export type { Fixed } from './fixed';
export { RollbackEngine } from './rollback/engine';
export type { RollbackResult } from './rollback/engine';
export { RingBuffer } from './rollback/buffer';
export type { TickRecord } from './rollback/buffer';
export { spawnItem, checkPickup, applyEffect } from './items';
export type { ItemType, ItemPickup, ItemEffect } from './items';
export { computePlacements, allFinished } from './placement';
export { updateCheckpoint, checkLapComplete, isShortcut } from './checkpoints';
export type { FrameMetrics } from './rollback/metrics';
export { recordMetrics, getMetrics, getBudgetReadout } from './rollback/metrics';
