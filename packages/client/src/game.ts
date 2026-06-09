/**
 * Multiplayer game driver with rollback netcode.
 *
 * - Runs sim at 60Hz fixed
 * - Sends local inputs to server
 * - Receives remote inputs, triggers rollback
 * - Renders all karts with interpolation
 */

import {
  createSimState,
  createKartState,
  step,
  toFloat,
  type SimState,
  type Track,
  RollbackEngine,
  hash,
  computePlacements,
  allFinished,
} from '@kart-racer/sim';
import { getInputFrame } from './input';
import { getScene, getCamera } from './renderer';
import type { NetClient } from './net';
import type { InputFrame } from '@kart-racer/shared';
import { DesyncDetector } from './desync';

const SIM_FPS = 60;
const SIM_DT = 1000 / SIM_FPS;

interface RaceConfig {
  seed: number;
  playerCount: number;
  playerIndex: number;
  totalLaps: number;
  track: Track;
  netClient: NetClient;
  onTick?: (tick: number, placements: number[]) => void;
  onRaceEnd?: (placements: { playerIndex: number; placement: number }[]) => void;
}

let raceConfig: RaceConfig | null = null;
let rollbackEngine: RollbackEngine | null = null;
let simState: SimState | null = null;
let prevSimState: SimState | null = null;
let accumulator = 0;
let lastTime = 0;
let tick = 0;
let isActive = false;
let raceEnded = false;
let pendingInputs = new Map<number, InputFrame[]>(); // tick -> inputs for all players
let desyncDetector = new DesyncDetector();

export function isRaceActive(): boolean {
  return isActive;
}

export function startRace(config: RaceConfig): void {
  raceConfig = config;
  isActive = true;
  raceEnded = false;
  tick = 0;
  accumulator = 0;
  lastTime = 0;
  pendingInputs.clear();

  // Create initial sim state
  simState = createSimState(config.seed, config.playerCount, config.totalLaps);
  simState.karts = [];
  for (let i = 0; i < config.playerCount; i++) {
    simState.karts.push(
      createKartState(i, config.track.spawnPositions[i]!, config.track.spawnHeadings[i]!)
    );
  }
  prevSimState = simState;

  // Initialize rollback engine
  rollbackEngine = new RollbackEngine(120, config.track, config.playerCount);
  rollbackEngine.store(tick, simState, getEmptyInputs(config.playerCount));

  // Setup input handlers
  config.netClient.onInputFrame((msg) => {
    const inputs = pendingInputs.get(msg.tick) ?? new Array(config.playerCount).fill(null);
    inputs[msg.playerIndex] = msg.input;
    pendingInputs.set(msg.tick, inputs);
  });

  // Setup desync detection
  desyncDetector.onDesync((report) => {
    console.warn(`DESYNC at tick ${report.tick}: local=${report.localHash} remote=${report.remoteHash} from player ${report.remotePlayerIndex}`);
  });

  console.log('Race started! Player', config.playerIndex, 'of', config.playerCount);
}

function getEmptyInputs(playerCount: number): InputFrame[] {
  return new Array(playerCount).fill(null).map(() => ({
    accelerate: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    drift: false,
  }));
}

export function gameLoop(time: number): void {
  requestAnimationFrame(gameLoop);

  if (!isActive || !raceConfig || !simState || !rollbackEngine) {
    return;
  }

  if (lastTime === 0) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;

  accumulator += delta;

  const { playerCount, playerIndex, netClient, track } = raceConfig;

  while (accumulator >= SIM_DT) {
    // Get local input
    const localInput = getInputFrame();
    
    // Build inputs array: local + predictions for remote
    const inputs: InputFrame[] = [];
    for (let i = 0; i < playerCount; i++) {
      if (i === playerIndex) {
        inputs.push(localInput);
      } else {
        inputs.push(rollbackEngine.predict(i));
      }
    }

    // Update latest known inputs in rollback engine
    for (let i = 0; i < playerCount; i++) {
      rollbackEngine.setInput(i, inputs[i]!);
    }

    // Send local input to server
    netClient.sendInputFrame(tick, localInput);

    // Check for corrected inputs from remote players
    const correctedInputs = new Map<number, InputFrame[]>();
    for (const [pendingTick, pendingInputsArray] of pendingInputs) {
      if (pendingTick <= tick && pendingTick >= tick - 120) {
        // Build full inputs array for this tick
        const fullInputs: InputFrame[] = [];
        let hasAll = true;
        for (let i = 0; i < playerCount; i++) {
          if (i === playerIndex) {
            fullInputs.push(localInput);
          } else if (pendingInputsArray[i]) {
            fullInputs.push(pendingInputsArray[i]!);
          } else {
            hasAll = false;
            break;
          }
        }
        if (hasAll) {
          correctedInputs.set(pendingTick, fullInputs);
        }
      }
    }

    // Remove processed pending inputs
    for (const pendingTick of correctedInputs.keys()) {
      pendingInputs.delete(pendingTick);
    }

    // Store current state before stepping
    prevSimState = simState;

    // If we have corrected inputs, rollback and re-simulate
    if (correctedInputs.size > 0) {
      const result = rollbackEngine.rollback(correctedInputs);
      if (result.state) {
        simState = result.state;
      }
    } else {
      // Normal step forward
      simState = step(simState, inputs, track);
    }

    // Store tick record
    tick++;
    rollbackEngine.store(tick, simState, inputs);

    // Hash check for desync detection (every 10 ticks)
    if (tick % 10 === 0) {
      const h = hash.hashState(simState);
      netClient.sendHashReport(tick, h);
      desyncDetector.recordLocalHash(tick, h);
      desyncDetector.checkUpTo(tick);
      desyncDetector.prune(tick);
    }

    // Check for race end
    if (!raceEnded && allFinished(simState.karts)) {
      raceEnded = true;
      const placements = computePlacements(simState.karts);
      if (raceConfig.onRaceEnd) {
        raceConfig.onRaceEnd(
          placements.map((k) => ({ playerIndex: k.playerIndex, placement: k.placement }))
        );
      }
    }

    accumulator -= SIM_DT;
  }

  // Render with interpolation
  const alpha = accumulator / SIM_DT;
  render(alpha);
}

function render(alpha: number): void {
  if (!simState || !prevSimState) return;

  const karts = simState.karts;
  const prevKarts = prevSimState.karts;

  for (let i = 0; i < karts.length; i++) {
    const kart = karts[i]!;
    const prevKart = prevKarts[i];
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
  if (raceConfig) {
    const kart = karts[raceConfig.playerIndex];
    if (kart) {
      const cam = getCamera();
      const targetX = toFloat(kart.position.x);
      const targetY = toFloat(kart.position.y);
      cam.position.x += (targetX - cam.position.x) * 0.1;
      cam.position.z += (targetY + 10 - cam.position.z) * 0.1;
      cam.lookAt(targetX, 0, targetY);
    }
  }
}
