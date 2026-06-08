# Kart Racer — Determinism Checklist

The simulation must be bit-identical across runs, across browsers, and across Node.js. Every item below is mandatory.

## NFR-1: No native float in the simulation

- [x] All physics, collision, and game logic use `Fixed` (Q16.16) integers.
- [x] No `number` literals in physics paths unless explicitly converted to `Fixed`.
- [x] `Math.sin`, `Math.cos`, `Math.sqrt` are not used in the sim loop.
- [x] Trigonometry uses a precomputed LUT (see `sim/src/trig.ts`).
- [x] `fpSqrt` is verified to be correctly-rounded and deterministic, or uses an integer algorithm.

## NFR-2: No platform-dependent globals or wall-clock

- [x] The sim does not reference `window`, `document`, `DOM`, `THREE`, or `Node` globals.
- [x] The sim does not call `Date.now()`, `performance.now()`, or any wall-clock source.
- [x] All time is tick-based (`tickCount` integer, incremented each `step`).

## NFR-3: No non-deterministic randomness

- [x] `Math.random` is never called in the sim.
- [x] All randomness uses a seeded, serializable integer PRNG (`sim/src/prng.ts`).
- [x] The PRNG state is part of `SimState` and is saved/restored during rollback.

## NFR-4: No iteration-order dependence

- [x] The sim uses plain arrays with indexed iteration, never `for...of` over `Map` or `Set`.
- [x] Kart iteration order is fixed by player index (0..N-1).
- [x] Collision pair resolution is deterministic (sorted by index, not by insertion order).

## NFR-5: Bit-identical across environments

- [x] The same seed + input sequence produces identical state hashes in Node.js and in browsers.
- [x] This is verified by `sim/src/determinism.test.ts` (the M2 gate test).

## NFR-6: Input validation

- [x] All inbound network messages are validated with Zod before touching the sim.
- [x] Invalid messages are dropped, not coerced.

## NFR-7: Serialization stability

- [x] `serialize` and `deserialize` use a stable, field-ordered format (no JSON key reordering dependence).
- [x] Round-trip `serialize → deserialize → hash` is identical to the original hash.

## NFR-8: Render separation

- [x] The render layer (`client/`) reads from `SimState` but never writes to it.
- [x] No `sim/` file imports from `client/` or `three`.

## Enforcement

- CI runs `pnpm -w test determinism` as a hard gate.
- A grep test or lint rule checks that `sim/` does not import `client/`, `three`, or use `Math.random` / `Date`.
