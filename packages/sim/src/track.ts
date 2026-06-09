/**
 * Track data: walls, checkpoints, start line.
 *
 * Pure data + geometry helpers. No rendering.
 */

import * as fp from './fixed.js';
import type { Fixed } from './fixed.js';
import type { Vec2 } from './vec2.js';
import { fpSqrt } from './trig.js';

export interface Segment {
  a: Vec2;
  b: Vec2;
}

export interface Track {
  name: string;
  /** Wall segments — kart collision boundaries. */
  walls: Segment[];
  /** Ordered checkpoint gates. Kart must cross them in order. */
  checkpoints: Segment[];
  /** Start line. */
  startLine: Segment;
  /** Spawn positions for each player (1..4). */
  spawnPositions: Vec2[];
  /** Spawn headings (0..65535). */
  spawnHeadings: number[];
}

export function createOvalTrack(): Track {
  // A simple oval-ish track for testing
  const walls: Segment[] = [
    // Outer walls
    { a: { x: fp.fromInt(0), y: fp.fromInt(0) }, b: { x: fp.fromInt(20), y: fp.fromInt(0) } },
    { a: { x: fp.fromInt(20), y: fp.fromInt(0) }, b: { x: fp.fromInt(20), y: fp.fromInt(10) } },
    { a: { x: fp.fromInt(20), y: fp.fromInt(10) }, b: { x: fp.fromInt(0), y: fp.fromInt(10) } },
    { a: { x: fp.fromInt(0), y: fp.fromInt(10) }, b: { x: fp.fromInt(0), y: fp.fromInt(0) } },
    // Inner island (creates a loop)
    { a: { x: fp.fromInt(5), y: fp.fromInt(3) }, b: { x: fp.fromInt(15), y: fp.fromInt(3) } },
    { a: { x: fp.fromInt(15), y: fp.fromInt(3) }, b: { x: fp.fromInt(15), y: fp.fromInt(7) } },
    { a: { x: fp.fromInt(15), y: fp.fromInt(7) }, b: { x: fp.fromInt(5), y: fp.fromInt(7) } },
    { a: { x: fp.fromInt(5), y: fp.fromInt(7) }, b: { x: fp.fromInt(5), y: fp.fromInt(3) } },
  ];

  const checkpoints: Segment[] = [
    { a: { x: fp.fromInt(10), y: fp.fromInt(0) }, b: { x: fp.fromInt(10), y: fp.fromInt(3) } },
    { a: { x: fp.fromInt(20), y: fp.fromInt(5) }, b: { x: fp.fromInt(15), y: fp.fromInt(5) } },
    { a: { x: fp.fromInt(10), y: fp.fromInt(10) }, b: { x: fp.fromInt(10), y: fp.fromInt(7) } },
    { a: { x: fp.fromInt(0), y: fp.fromInt(5) }, b: { x: fp.fromInt(5), y: fp.fromInt(5) } },
  ];

  const startLine: Segment = {
    a: { x: fp.fromInt(2), y: fp.fromInt(0) },
    b: { x: fp.fromInt(2), y: fp.fromInt(3) },
  };

  const spawnPositions: Vec2[] = [
    { x: fp.fromInt(2), y: fp.fromInt(1) },
    { x: fp.fromInt(2), y: fp.fromInt(2) },
    { x: fp.fromInt(3), y: fp.fromInt(1) },
    { x: fp.fromInt(3), y: fp.fromInt(2) },
  ];

  const spawnHeadings: number[] = [0, 0, 0, 0]; // All facing right

  return {
    name: 'Oval Test Track',
    walls,
    checkpoints,
    startLine,
    spawnPositions,
    spawnHeadings,
  };
}

/** Check if a point is on the right side of a directed segment (cross product). */
export function pointSideOfSegment(p: Vec2, seg: Segment): Fixed {
  // cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
  const dx1 = fp.sub(seg.b.x, seg.a.x);
  const dy1 = fp.sub(seg.b.y, seg.a.y);
  const dx2 = fp.sub(p.x, seg.a.x);
  const dy2 = fp.sub(p.y, seg.a.y);
  return fp.sub(fp.mul(dx1, dy2), fp.mul(dy1, dx2));
}

/** Check if two line segments intersect (excluding endpoints). */
export function segmentsIntersect(s1: Segment, s2: Segment): boolean {
  const s1_a = pointSideOfSegment(s1.a, s2);
  const s1_b = pointSideOfSegment(s1.b, s2);
  const s2_a = pointSideOfSegment(s2.a, s1);
  const s2_b = pointSideOfSegment(s2.b, s1);

  // Check if endpoints are on opposite sides (or one is zero)
  const opposite1 = fp.lte(fp.mul(s1_a, s1_b), fp.ZERO);
  const opposite2 = fp.lte(fp.mul(s2_a, s2_b), fp.ZERO);

  return opposite1 && opposite2;
}

/** Distance squared from point to line segment. */
export function distSqToSegment(p: Vec2, seg: Segment): Fixed {
  const l2 = fp.add(
    fp.mul(fp.sub(seg.b.x, seg.a.x), fp.sub(seg.b.x, seg.a.x)),
    fp.mul(fp.sub(seg.b.y, seg.a.y), fp.sub(seg.b.y, seg.a.y))
  );

  if (l2 === fp.ZERO) {
    // Segment is a point
    const dx = fp.sub(p.x, seg.a.x);
    const dy = fp.sub(p.y, seg.a.y);
    return fp.add(fp.mul(dx, dx), fp.mul(dy, dy));
  }

  // Project p onto segment, clamped to [0,1]
  const t = fp.div(
    fp.add(
      fp.mul(fp.sub(p.x, seg.a.x), fp.sub(seg.b.x, seg.a.x)),
      fp.mul(fp.sub(p.y, seg.a.y), fp.sub(seg.b.y, seg.a.y))
    ),
    l2
  );
  const clampedT = fp.clamp(t, fp.ZERO, fp.ONE);

  const projX = fp.add(seg.a.x, fp.mul(fp.sub(seg.b.x, seg.a.x), clampedT));
  const projY = fp.add(seg.a.y, fp.mul(fp.sub(seg.b.y, seg.a.y), clampedT));

  const dx = fp.sub(p.x, projX);
  const dy = fp.sub(p.y, projY);
  return fp.add(fp.mul(dx, dx), fp.mul(dy, dy));
}

/** Check if a point crosses a segment (moving from oldPos to newPos). */
export function segmentCrossed(oldPos: Vec2, newPos: Vec2, seg: Segment): boolean {
  return segmentsIntersect(
    { a: oldPos, b: newPos },
    seg
  );
}

/** Resolve a circle against a wall segment. Returns corrected position and velocity. */
export function resolveCircleWall(
  pos: Vec2,
  vel: Vec2,
  radius: Fixed,
  wall: Segment,
): { pos: Vec2; vel: Vec2 } | null {
  const distSq = distSqToSegment(pos, wall);
  const rSq = fp.mul(radius, radius);

  if (fp.gt(distSq, rSq)) {
    return null; // No collision
  }

  // Find closest point on segment
  const l2 = fp.add(
    fp.mul(fp.sub(wall.b.x, wall.a.x), fp.sub(wall.b.x, wall.a.x)),
    fp.mul(fp.sub(wall.b.y, wall.a.y), fp.sub(wall.b.y, wall.a.y))
  );

  let closest: Vec2;
  if (l2 === fp.ZERO) {
    closest = wall.a;
  } else {
    const t = fp.div(
      fp.add(
        fp.mul(fp.sub(pos.x, wall.a.x), fp.sub(wall.b.x, wall.a.x)),
        fp.mul(fp.sub(pos.y, wall.a.y), fp.sub(wall.b.y, wall.a.y))
      ),
      l2
    );
    const clampedT = fp.clamp(t, fp.ZERO, fp.ONE);
    closest = {
      x: fp.add(wall.a.x, fp.mul(fp.sub(wall.b.x, wall.a.x), clampedT)),
      y: fp.add(wall.a.y, fp.mul(fp.sub(wall.b.y, wall.a.y), clampedT)),
    };
  }

  // Push vector from closest point to circle center
  const dx = fp.sub(pos.x, closest.x);
  const dy = fp.sub(pos.y, closest.y);
  const dist = fpSqrt(fp.add(fp.mul(dx, dx), fp.mul(dy, dy)));

  if (dist === fp.ZERO) {
    // Center is exactly on the wall — push along wall normal
    const wallDx = fp.sub(wall.b.x, wall.a.x);
    const wallDy = fp.sub(wall.b.y, wall.a.y);
    // Normal is (-wallDy, wallDx)
    const normalX = fp.neg(wallDy);
    const normalY = wallDx;
    const normalLen = fpSqrt(fp.add(fp.mul(normalX, normalX), fp.mul(normalY, normalY)));
    const pushX = fp.div(normalX, normalLen);
    const pushY = fp.div(normalY, normalLen);
    return {
      pos: {
        x: fp.add(pos.x, fp.mul(pushX, radius)),
        y: fp.add(pos.y, fp.mul(pushY, radius)),
      },
      vel: { x: fp.ZERO, y: fp.ZERO },
    };
  }

  // Push out by (radius - dist) along the normal
  const pushFactor = fp.div(fp.sub(radius, dist), dist);
  const pushX = fp.mul(dx, pushFactor);
  const pushY = fp.mul(dy, pushFactor);

  const newPos = {
    x: fp.add(pos.x, pushX),
    y: fp.add(pos.y, pushY),
  };

  // Reflect velocity: v' = v - 2 * (v·n) * n
  // For arcade feel, just remove the normal component and keep tangent
  const normalX = fp.div(dx, dist);
  const normalY = fp.div(dy, dist);
  const dot = fp.add(fp.mul(vel.x, normalX), fp.mul(vel.y, normalY));

  const newVel = {
    x: fp.sub(vel.x, fp.mul(dot, normalX)),
    y: fp.sub(vel.y, fp.mul(dot, normalY)),
  };

  return { pos: newPos, vel: newVel };
}
