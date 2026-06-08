/**
 * Keyboard input → InputFrame per tick.
 * Source-agnostic shape (gamepad later).
 */

import type { InputFrame } from '@kart-racer/shared';

const keys = new Set<string>();

export function initInput(): void {
  window.addEventListener('keydown', (e) => {
    keys.add(e.key);
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key);
  });
}

export function getInputFrame(): InputFrame {
  return {
    accelerate: keys.has('ArrowUp') || keys.has('w') || keys.has('W'),
    brake: keys.has('ArrowDown') || keys.has('s') || keys.has('S'),
    steerLeft: keys.has('ArrowLeft') || keys.has('a') || keys.has('A'),
    steerRight: keys.has('ArrowRight') || keys.has('d') || keys.has('D'),
    drift: keys.has('Shift') || keys.has(' '),
  };
}
