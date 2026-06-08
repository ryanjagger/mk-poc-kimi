# Kart Racer

A deterministic, rollback-based multiplayer kart racer built with TypeScript, Three.js, and WebSockets.

## Architecture

- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — pre-made architectural decisions
- [`docs/DETERMINISM.md`](./docs/DETERMINISM.md) — determinism enforcement checklist

## Development

```bash
# Install dependencies
pnpm install

# Typecheck
pnpm -w typecheck

# Run tests
pnpm -w test

# Run determinism gate (must pass before network code)
pnpm -w test determinism

# Run convergence test
pnpm -w test converge

# Start dev client
pnpm -w dev

# Start relay server
pnpm --filter server dev
```

## Deployment

### Server (Railway)

The server is configured to deploy on Railway:

```bash
# Deploy server
railway deploy --path packages/server
```

Environment variables:
- `PORT` — server port (default: 3000)

### Client

The client is a static Vite app. Build with:

```bash
pnpm --filter client build
```

Then deploy the `packages/client/dist` folder to any static host.

## Milestones

| Milestone | Status | Description |
|-----------|--------|-------------|
| M1 | ✅ | Foundations: fixed-point math, trig, PRNG |
| M2 | ✅ | Deterministic simulation: physics, collision, hashing |
| M3 | ✅ | Rendering: Three.js, input, interpolation |
| M4 | ✅ | Rollback core: ring buffer, prediction, convergence |
| M5 | ✅ | Two players networked: protocol, relay, desync detector |
| M6 | ✅ | Four players + race structure: checkpoints, laps, finish |
| M7 | ✅ | Items: deterministic spawn/pickup |

## Acceptance Criteria

| Criterion | Status | Verification |
|-----------|--------|-------------|
| TA.1 | ✅ | Determinism test green: `pnpm -w test determinism` |
| TA.2 | ✅ | Rollback convergence: `pnpm -w test converge` |
| TA.3 | ✅ | No desync detected in unit tests |
| TA.4 | ✅ | Zero input delay (rollback-based) |
| TA.5 | ✅ | Budget readout in `sim/src/rollback/metrics.ts` |
| TA.6 | ✅ | No floats in sim (lint/review enforced), strict TS, Zod validation |
| TA.7 | ✅ | Every milestone independently runnable with tests |

## Project structure

```
packages/
  sim/       — pure deterministic simulation (no platform deps)
  shared/    — types, protocol schemas, Zod validators
  client/    — Vite + Three.js rendering
  server/    — WebSocket relay server
```
