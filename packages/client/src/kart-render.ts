/**
 * Kart mesh management.
 * Render-side only: never writes to sim state.
 */

import * as THREE from 'three';
import type { KartState } from '@kart-racer/sim';
import { toFloat } from '@kart-racer/sim';

const kartMeshes = new Map<number, THREE.Group>();

export function createKartMesh(playerIndex: number, scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  group.name = `kart-${playerIndex}`;

  // Kart body
  const bodyGeo = new THREE.BoxGeometry(0.6, 0.3, 0.4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: playerIndex === 0 ? 0xff0000 : 0x0000ff });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.2;
  group.add(body);

  // Direction indicator
  const arrowGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
  const arrowMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const arrow = new THREE.Mesh(arrowGeo, arrowMat);
  arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 0.2, 0.4);
  group.add(arrow);

  scene.add(group);
  kartMeshes.set(playerIndex, group);
  return group;
}

export function updateKartMesh(kart: KartState): void {
  const mesh = kartMeshes.get(kart.playerIndex);
  if (!mesh) return;

  const x = toFloat(kart.position.x);
  const y = toFloat(kart.position.y);
  const heading = (kart.heading / 65536) * Math.PI * 2;

  mesh.position.set(x, 0, y);
  mesh.rotation.y = -heading;
}

export function clearKartMeshes(): void {
  kartMeshes.clear();
}
