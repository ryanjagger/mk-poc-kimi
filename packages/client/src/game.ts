/**
 * Fixed-timestep game driver with render interpolation.
 *
 * Sim runs at 60Hz fixed. Render interpolates between the two latest states.
 */

import {
  createSimState,
  createKartState,
  step,
  createOvalTrack,
  toFloat,
  type SimState,
} from '@kart-racer/sim';
import { getInputFrame } from './input';
import { createKartMesh } from './kart-render';
import { createTrackMeshes } from './track-render';
import { getScene, getCamera } from './renderer';

const SIM_FPS = 60;
const SIM_DT = 1000 / SIM_FPS;

let simState: SimState;
let prevSimState: SimState;
let track = createOvalTrack();
let accumulator = 0;
let lastTime = 0;
let localPlayerIndex = 0;

export function initGame(): void {
  track = createOvalTrack();
  simState = createSimState(Date.now(), 1, 3);
  simState.karts = [
    createKartState(0, track.spawnPositions[0]!, track.spawnHeadings[0]!),
  ];
  prevSimState = simState;

  // Create render meshes
  createTrackMeshes(track, getScene());
  createKartMesh(0, getScene());

  // Position camera to follow the kart
  const kart = simState.karts[0]!;
  const cam = getCamera();
  cam.position.set(
    toFloat(kart.position.x),
    15,
    toFloat(kart.position.y) + 10
  );
  cam.lookAt(toFloat(kart.position.x), 0, toFloat(kart.position.y));
}

export function gameLoop(time: number): void {
  if (lastTime === 0) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;

  accumulator += delta;

  while (accumulator >= SIM_DT) {
    prevSimState = simState;
    const input = getInputFrame();
    simState = step(simState, [input], track);
    accumulator -= SIM_DT;
  }

  // Interpolate between prevSimState and simState
  const alpha = accumulator / SIM_DT;
  render(alpha);
}

function render(alpha: number): void {
  const karts = simState.karts;
  const prevKarts = prevSimState.karts;

  for (let i = 0; i < karts.length; i++) {
    const kart = karts[i]!;
    const prevKart = prevKarts[i]!;
    if (!prevKart) continue;

    // Interpolate position
    const x = toFloat(prevKart.position.x) + (toFloat(kart.position.x) - toFloat(prevKart.position.x)) * alpha;
    const y = toFloat(prevKart.position.y) + (toFloat(kart.position.y) - toFloat(prevKart.position.y)) * alpha;
    const heading = prevKart.heading + (kart.heading - prevKart.heading) * alpha;

    // Update mesh
    const mesh = getScene().getObjectByName(`kart-${i}`);
    if (mesh) {
      mesh.position.set(x, 0, y);
      mesh.rotation.y = -(heading / 65536) * Math.PI * 2;
    }
  }

  // Update camera to follow local player
  const kart = karts[localPlayerIndex];
  if (kart) {
    const cam = getCamera();
    const targetX = toFloat(kart.position.x);
    const targetY = toFloat(kart.position.y);
    cam.position.x += (targetX - cam.position.x) * 0.1;
    cam.position.z += (targetY + 10 - cam.position.z) * 0.1;
    cam.lookAt(targetX, 0, targetY);
  }
}
