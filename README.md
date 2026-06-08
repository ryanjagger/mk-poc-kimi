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

# Start dev client
pnpm -w dev

# Start relay server
pnpm --filter server dev
```

## Milestones

| Milestone | Status | Description |
|-----------|--------|-------------|
| M1 | ✅ | Foundations: fixed-point math, trig, PRNG |
| M2 | ✅ | Deterministic simulation: physics, collision, hashing |
| M3 | ⏳ | Rendering: Three.js, input, interpolation |
| M4 | ⏳ | Rollback core: ring buffer, prediction, convergence |
| M5 | ⏳ | Two players networked |
| M6 | ⏳ | Four players + race structure |
| M7 | ⏳ | Items |

## Project structure

```
packages/
  sim/       — pure deterministic simulation (no platform deps)
  shared/    — types, protocol schemas, Zod validators
  client/    — Vite + Three.js rendering
  server/    — WebSocket relay server
```
