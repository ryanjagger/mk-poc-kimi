# Kart Racer — Architectural Decisions

This document captures the pre-made decisions from the PRD §11 that guide the implementation.

## Fixed-point math

**Decision:** Roll-your-own Q16.16 in pure TypeScript.

**Rationale:** Native JS floats (`number`) are not bit-identical across all platforms and engines. Q16.16 gives us 16 bits of integer range and 16 bits of fractional precision, sufficient for a top-down kart racer with sub-pixel precision. We use split-multiply or BigInt for wide intermediate results to avoid overflow past 53 bits.

## Tick rate / window

**Decision:** 60 Hz fixed simulation, render decoupled with interpolation.

**Rationale:** A fixed timestep is the foundation of deterministic replay and rollback. Rendering at the display refresh rate with interpolation between the two most recent sim states keeps motion smooth without affecting sim determinism. The max rollback window is ~8 frames (~130 ms) — large enough to absorb typical network jitter, small enough to keep re-sim cost low.

## Input delay

**Decision:** Start at 0 input-delay frames.

**Rationale:** Local play should feel immediate. We only add 1 frame of input delay if rollbacks become visibly frequent in network play.

## Network topology

**Decision:** Server-relayed inputs over WebSockets.

**Rationale:** The server timestamps and orders incoming input frames, then fans them out to all clients in the room. Inputs only travel on the wire — never full world state. This minimizes bandwidth and keeps all clients as authoritative simulators. The server can also re-run the sim for hash-checking (anti-cheat groundwork).

## Input source

**Decision:** Keyboard only for v1.

**Rationale:** The input frame shape is source-agnostic (bit flags), so gamepad can be wired in later without touching the sim.

## Laps

**Decision:** Default 3 laps, configurable in room settings.

**Rationale:** Matches common arcade kart conventions. Room settings keep the choice visible before the race starts.

## Technology stack

**Decision:** pnpm monorepo with packages `sim/`, `client/`, `server/`, `shared/`.

**Rationale:**
- `sim` — pure, deterministic simulation; no platform dependencies.
- `shared` — types and protocol schemas shared between client and server.
- `client` — Vite + Three.js rendering; depends on `sim` and `shared`.
- `server` — WebSocket relay; depends on `shared`.

TypeScript `strict: true` with `noUncheckedIndexedAccess` catches a large class of bugs. Zod validates every inbound network message at the boundary.

## Determinism enforcement

See [`DETERMINISM.md`](./DETERMINISM.md) for the full checklist.

## Rendering separation

**Decision:** Rendering never writes to sim state.

**Rationale:** The render layer converts `Fixed` to float via `toFloat` for mesh positioning, but must never mutate simulation state. This separation is what makes rollback and replay possible.
