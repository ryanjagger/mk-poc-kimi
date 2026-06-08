/**
 * Render track walls and checkpoints from sim data.
 * Render-side only: never writes to sim state.
 */

import * as THREE from 'three';
import type { Track } from '@kart-racer/sim';
import { toFloat } from '@kart-racer/sim';

export function createTrackMeshes(track: Track, scene: THREE.Scene): void {
  // Wall material
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
  const wallHeight = 0.5;

  for (const wall of track.walls) {
    const x1 = toFloat(wall.a.x);
    const y1 = toFloat(wall.a.y);
    const x2 = toFloat(wall.b.x);
    const y2 = toFloat(wall.b.y);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const geometry = new THREE.BoxGeometry(length, wallHeight, 0.2);
    const mesh = new THREE.Mesh(geometry, wallMat);
    mesh.position.set((x1 + x2) / 2, wallHeight / 2, (y1 + y2) / 2);
    mesh.rotation.y = -angle;
    scene.add(mesh);
  }

  // Checkpoint gates (thin green lines)
  const checkpointMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00aa00, emissiveIntensity: 0.5 });
  for (const cp of track.checkpoints) {
    const x1 = toFloat(cp.a.x);
    const y1 = toFloat(cp.a.y);
    const x2 = toFloat(cp.b.x);
    const y2 = toFloat(cp.b.y);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const geometry = new THREE.BoxGeometry(length, 0.1, 0.05);
    const mesh = new THREE.Mesh(geometry, checkpointMat);
    mesh.position.set((x1 + x2) / 2, 0.05, (y1 + y2) / 2);
    mesh.rotation.y = -angle;
    scene.add(mesh);
  }

  // Start line (red line)
  const startLineMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000, emissiveIntensity: 0.5 });
  const sl = track.startLine;
  const x1 = toFloat(sl.a.x);
  const y1 = toFloat(sl.a.y);
  const x2 = toFloat(sl.b.x);
  const y2 = toFloat(sl.b.y);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const geometry = new THREE.BoxGeometry(length, 0.1, 0.05);
  const mesh = new THREE.Mesh(geometry, startLineMat);
  mesh.position.set((x1 + x2) / 2, 0.05, (y1 + y2) / 2);
  mesh.rotation.y = -angle;
  scene.add(mesh);
}
