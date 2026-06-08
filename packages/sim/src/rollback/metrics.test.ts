import { describe, it, expect } from 'vitest';
import { getMetrics, recordMetrics, getBudgetReadout } from './metrics';

describe('Metrics', () => {
  it('records and retrieves metrics', () => {
    recordMetrics({
      resimulatedTicks: 5,
      resimMs: 2.5,
      rollbackDistance: 3,
      worstCaseResimMs: 8.0,
    });
    const m = getMetrics();
    expect(m.resimulatedTicks).toBe(5);
    expect(m.resimMs).toBe(2.5);
    expect(m.rollbackDistance).toBe(3);
  });

  it('produces a readable budget readout', () => {
    recordMetrics({
      resimulatedTicks: 5,
      resimMs: 2.5,
      rollbackDistance: 3,
      worstCaseResimMs: 8.0,
    });
    const readout = getBudgetReadout();
    expect(readout).toContain('5 ticks');
    expect(readout).toContain('2.50ms');
    expect(readout).toContain('3 frames');
  });
});
