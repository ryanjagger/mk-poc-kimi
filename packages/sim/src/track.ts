/**
 * Track data: walls, checkpoints, start line.
 *
 * Pure data + geometry helpers. No rendering.
 */

import * as fp from './fixed';
import type { Fixed } from './fixed';
import type { Vec2 } from './vec2';

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
