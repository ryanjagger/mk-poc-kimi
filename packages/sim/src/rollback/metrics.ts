/**
 * Frame-budget instrumentation for rollback engine.
 */

export interface FrameMetrics {
  /** Ticks re-simulated this frame. */
  resimulatedTicks: number;
  /** Time spent in re-simulation (ms). */
  resimMs: number;
  /** How far back we rolled. */
  rollbackDistance: number;
  /** Worst-case re-sim cost for the current window size. */
  worstCaseResimMs: number;
}

let lastMetrics: FrameMetrics = {
  resimulatedTicks: 0,
  resimMs: 0,
  rollbackDistance: 0,
  worstCaseResimMs: 0,
};

export function recordMetrics(metrics: FrameMetrics): void {
  lastMetrics = metrics;
}

export function getMetrics(): FrameMetrics {
  return lastMetrics;
}

export function getBudgetReadout(): string {
  const m = lastMetrics;
  return `Re-sim: ${m.resimulatedTicks} ticks, ${m.resimMs.toFixed(2)}ms | Rollback: ${m.rollbackDistance} frames | Worst-case: ${m.worstCaseResimMs.toFixed(2)}ms`;
}
