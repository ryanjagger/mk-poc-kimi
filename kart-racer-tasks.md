# Kart Racer — Build Tasks

Ordered, self-contained task list derived from `kart-racer-prd.md`. Designed for Claude Code to execute sequentially in a loop: do one task, verify its "Done when", commit, mark it `[x]`, move on.

## How to use this file (loop protocol)

1. Find the **first unchecked `[ ]` task** in order. Do not skip ahead — later tasks depend on earlier ones.
2. Read its **Do** and **Done when**. Implement only that task.
3. Run the listed verification. If it fails, fix it before proceeding — do not check the box on a failing task.
4. When green, run `pnpm -w typecheck && pnpm -w test` (once those exist) to confirm nothing regressed.
5. `git add -A && git commit -m "<task id>: <summary>"`.
6. Change the task's `[ ]` to `[x]` and commit that too.
7. Repeat.

**Hard gates** (marked 🚧) must be green before any subsequent task starts. The biggest is **T2.9 (determinism test)** — no netcode is written until it passes.

**Decisions are pre-made** per PRD §11 and recorded in T1.2; treat them as confirmed defaults. If implementation reveals one is wrong, stop, update the decision doc, and note why.

---

## Pre-flight decisions (from PRD §11, confirmed defaults)

- **Fixed-point:** roll-your-own **Q16.16** in pure TS. Split-multiply or BigInt for wide ops. LUT/CORDIC trig, no `Math.sin/cos`. `Math.sqrt` allowed after verification.
- **Tick rate / window:** **60Hz** fixed sim, render decoupled (interpolate two latest states). **~8-frame** (~130ms) max rollback window. Start at **0 input-delay frames**; add 1 only if rollbacks are visibly frequent.
- **Topology:** **server-relayed inputs** over **WebSockets**. Inputs only on the wire, never state. Server can re-run sim for hash-checking.
- **Input:** keyboard only (v1), structured so gamepad can feed the same input frame later.
- **Laps:** default **3**, configurable in room settings.
- **Stack:** pnpm monorepo, packages `sim/ client/ server/ shared/`. TS `strict: true`. Vite client. Three.js rendering. Zod for network boundary validation.

---

## M1 — Foundations

Exit: fixed-point math tested; fixed-point approach, tick rate, topology decided & documented.

- [x] **T1.1 — Monorepo scaffold.**
  - Do: Init pnpm workspace with `pnpm-workspace.yaml` listing `packages/*`. Create packages `sim`, `shared`, `client`, `server`, each with `package.json` and `tsconfig.json` extending a root `tsconfig.base.json` with `"strict": true`, `"noUncheckedIndexedAccess": true`. Root `package.json` with workspace scripts: `typecheck`, `test`, `dev`, `build`. Add `vitest` to root.
  - Done when: `pnpm install` succeeds and `pnpm -w typecheck` runs clean across all four empty packages.
  - Verify: `pnpm install && pnpm -w typecheck`

- [x] **T1.2 — Decisions & determinism checklist doc.**
  - Do: Write `docs/DECISIONS.md` capturing the §11 choices (above) with one-line rationale each. Write `docs/DETERMINISM.md` — the checklist the sim must obey: no native float in sim (NFR-1), no DOM/Three/Node globals/`Date`/wall-clock (NFR-2), no `Math.random` (NFR-3), no `Map`/`Set` iteration-order dependence (NFR-4), bit-identical browser vs Node (NFR-5). Reference both from root `README.md`.
  - Done when: Both docs exist and README links them.
  - Verify: files present; links resolve.

- [x] **T1.3 — Fixed-point Q16.16 core.**
  - Do: In `sim/src/fixed.ts` implement a branded `Fixed` integer type and ops: `fromInt`, `fromFraction(num,den)`, `toFloat` (debug/render only), `add`, `sub`, `mul` (split-multiply or BigInt to avoid 2^53 overflow), `div`, `floor`, `abs`, `neg`, `min`, `max`, `clamp`, `sign`, comparisons. All return 32-bit-range Q16.16 integers. No `Math.*` except internal where proven safe.
  - Done when: every op implemented and exported with TSDoc noting overflow strategy.
  - Verify: covered by T1.4 tests.

- [x] **T1.4 — Fixed-point unit tests.** 🚧
  - Do: `sim/src/fixed.test.ts` — test identities, overflow edges (large×large near 32.32 intermediate), rounding, sign, div-by-fraction, round-trip `fromFloat`/`toFloat` tolerance. Include a known-answer table.
  - Done when: tests cover every op incl. overflow path.
  - Verify: `pnpm -w test fixed`

- [x] **T1.5 — Deterministic trig (sin/cos) via LUT.**
  - Do: `sim/src/trig.ts` — integer angle units (e.g. 0..65535 = full turn). Precompute a sin LUT at fixed angular resolution (generated deterministically, no `Math.sin` at runtime — bake the table into source or generate-and-snapshot). `sin(angle): Fixed`, `cos(angle)`. Document resolution and interpolation choice.
  - Done when: implemented; no runtime `Math.sin/cos`.
  - Verify: T1.6.

- [x] **T1.6 — Trig + sqrt tests.** 🚧
  - Do: Test `sin/cos` against known angles within documented tolerance; verify quadrant symmetry and periodicity. Add `fpSqrt` (verify `Math.sqrt` is correctly-rounded & deterministic on target, or implement integer sqrt) with tests.
  - Done when: trig and sqrt tests pass.
  - Verify: `pnpm -w test trig`

- [x] **T1.7 — Deterministic PRNG.**
  - Do: `sim/src/prng.ts` — seeded integer PRNG (e.g. xorshift32 / PCG), pure, serializable state (plain integers), `next()`, `nextInRange(n)`, `getState`/`setState`. No `Math.random`, no float.
  - Done when: implemented + serializable.
  - Verify: T1.8.

- [x] **T1.8 — PRNG determinism test.** 🚧
  - Do: Same seed → identical sequence across two instances; save/restore state mid-stream reproduces the tail exactly; snapshot a reference sequence.
  - Done when: tests pass.
  - Verify: `pnpm -w test prng`

- [x] **T1.9 — Fixed-point vector math.**
  - Do: `sim/src/vec2.ts` (top-down kart sim plane) using `Fixed`: add, sub, scale, dot, length (via `fpSqrt`), normalize, rotate(by angle units). Tests with known answers.
  - Done when: implemented + tested.
  - Verify: `pnpm -w test vec2`

---

## M2 — Deterministic sim (HARD GATE)

Exit: same seed + input sequence run twice (and in Node) → bit-identical state hashes. Nothing proceeds until T2.9 is green.

- [x] **T2.1 — Input frame type.**
  - Do: In `shared/src/input.ts` define the per-tick `InputFrame` (accelerate, brake/reverse, steerLeft, steerRight, drift as bits/bytes — keyboard-derived, but source-agnostic). Pure data, no DOM. Export a `Zod` schema for it (used later at the net boundary).
  - Done when: type + Zod schema exported and consumed by `sim`.
  - Verify: `pnpm -w typecheck`

- [x] **T2.2 — Sim state shape + tick scaffold.**
  - Do: `sim/src/state.ts` — `SimState` (tick number, PRNG state, array of kart states: position `Vec2`, velocity `Vec2`, heading angle, drift/boost state, lap/checkpoint progress — all `Fixed`/int). `sim/src/step.ts` — `step(state, inputs[]): SimState` pure function, fixed timestep, deterministic iteration order (indexed arrays, never `Map`/`Set` iteration). Start with movement = no-op placeholder.
  - Done when: `step` is pure and typechecks; deterministic ordering enforced.
  - Verify: `pnpm -w typecheck`

- [x] **T2.3 — Arcade kart physics (FR-1, FR-4).**
  - Do: Implement acceleration, braking/reverse, steering in `step` using fixed-point: throttle→velocity, friction/drag, turn rate scaled by speed, max speed clamp. Tunable constants in one `sim/src/tuning.ts` file (all `Fixed`).
  - Done when: a kart driven by inputs accelerates, turns, and stops sensibly (assert via unit test on state after N ticks).
  - Verify: `pnpm -w test physics`

- [x] **T2.4 — Drift + mini-boost (FR-2).**
  - Do: Drift state machine: hold drift while steering → charge timer (int ticks), release → speed burst for M ticks. Deterministic thresholds, all fixed-point/int.
  - Done when: unit test shows charge→release yields a measurable, repeatable boost.
  - Verify: `pnpm -w test drift`

- [x] **T2.5 — Track representation (FR-5).**
  - Do: `sim/src/track.ts` — data-only track: walls as line segments, a few turns, start line, ordered checkpoint gates as segments, lap config. Geometrically simple. Pure data + helpers (no rendering).
  - Done when: one track defined with walls + ordered checkpoints + start line.
  - Verify: `pnpm -w typecheck`

- [x] **T2.6 — Collision: kart↔wall (FR-3).**
  - Do: Fixed-point circle/point-vs-segment resolution against walls; push-out + velocity response, arcade feel. Ensure fast karts don't tunnel at 60Hz (swept check if needed).
  - Done when: kart driven into a wall is stopped/deflected, never passes through (unit test).
  - Verify: `pnpm -w test collision-wall`

- [x] **T2.7 — Collision: kart↔kart (FR-3).**
  - Do: Fixed-point circle/circle resolution between karts; symmetric push-apart. Deterministic pair iteration order.
  - Done when: two overlapping karts separate deterministically (unit test).
  - Verify: `pnpm -w test collision-kart`

- [x] **T2.8 — State hashing.**
  - Do: `sim/src/hash.ts` — deterministic hash over the full `SimState` (stable field order, integers only). Also `serialize`/`deserialize` to a compact snapshot (sets up NFR-12).
  - Done when: hash is stable for equal states, differs for changed states; round-trip serialize→deserialize→hash is identical.
  - Verify: `pnpm -w test hash`

- [x] **T2.9 — DETERMINISM TEST.** 🚧🚧 **(M2 GATE — nothing proceeds until green)**
  - Do: `sim/src/determinism.test.ts` — drive a fixed seed + scripted multi-kart input sequence through `step` for K ticks. Assert: (a) two independent runs produce identical per-tick hashes; (b) running the same in Node (these tests run in Node) is bit-identical to a committed golden hash list. Add to CI.
  - Done when: per-tick hashes identical across runs and match the golden file.
  - Verify: `pnpm -w test determinism` — **must be green before T3.x.**

---

## M3 — Rendering

Exit: drivable locally (single-player, no net); sim/render separation verified.

- [x] **T3.1 — Client app + Vite + Three.js scaffold (NFR-20, NFR-21).**
  - Do: `client/` Vite app, Three.js scene, camera, render loop (`requestAnimationFrame`). Client depends on `sim` and `shared`. No game logic in render loop yet.
  - Done when: `pnpm --filter client dev` shows an empty 3D scene.
  - Verify: dev server boots; blank scene renders.

- [x] **T3.2 — Render track + kart from sim state (NFR-7).**
  - Do: Build Three.js meshes from the `track` data and a kart mesh. Each frame, read `SimState` and position meshes (convert `Fixed`→float via `toFloat`, render-side only). Rendering **never writes** to sim state.
  - Done when: track + kart drawn at sim positions; a lint/review note confirms render layer has no writes into sim.
  - Verify: visual; grep shows no sim mutation from client render code.

- [ ] **T3.3 — Keyboard input → input frame.**
  - Do: `client/src/input.ts` — capture keyboard into an `InputFrame` each tick. Source-agnostic shape (gamepad later).
  - Done when: keypresses produce populated input frames (debug overlay or log).
  - Verify: visual/logged.

- [ ] **T3.4 — Fixed-timestep driver + render interpolation (NFR-8).**
  - Do: Accumulator loop stepping sim at fixed 60Hz independent of render FPS; render interpolates between the two latest sim states for smoothness. Local input drives the sim directly (no net).
  - Done when: kart is drivable locally, smooth at varying render FPS, sim ticks at fixed rate.
  - Verify: drive around the track in-browser.

- [ ] **T3.5 — Sim/render separation check.**
  - Do: Add an eslint rule or a test/CI grep asserting `sim/` imports nothing from `client`/`three`/DOM, and uses no `Math.random`/`Date`/float literals in physics paths. Document in DETERMINISM.md.
  - Done when: check runs in CI and passes.
  - Verify: `pnpm -w lint` (or the grep test) green.

---

## M4 — Rollback core (local)

Exit: a test that delays/reorders inputs converges to the same hashes as the no-delay run.

- [ ] **T4.1 — Ring buffer of states + inputs (NFR-10, NFR-12).**
  - Do: `sim/src/rollback/buffer.ts` — ring buffer spanning the ~8-frame window storing per-tick snapshots + input frames. Cheap save/restore using T2.8 serialize.
  - Done when: store/fetch by tick within window; eviction beyond window.
  - Verify: `pnpm -w test ringbuffer`

- [ ] **T4.2 — Prediction (NFR-9).**
  - Do: When a remote input for a tick is missing, predict by repeating that player's last known input. Local input never delayed.
  - Done when: missing inputs are filled by last-input prediction (unit-tested).
  - Verify: `pnpm -w test predict`

- [ ] **T4.3 — Rollback + re-sim loop (NFR-11).**
  - Do: `sim/src/rollback/engine.ts` — on receiving a corrected input for a past tick: restore the snapshot at that tick, re-apply corrected inputs, re-sim forward to the present. Confine to the rollback window; if a correction is older than the window, slow/stall rather than predict further.
  - Done when: engine restores + re-sims correctly within budget.
  - Verify: T4.4.

- [ ] **T4.4 — ROLLBACK CONVERGENCE TEST.** 🚧
  - Do: `sim/src/rollback/converge.test.ts` — run a scenario with no delay to get golden hashes; run the same inputs delivered late/reordered through the rollback engine; assert final (and post-correction) hashes match the golden run.
  - Done when: delayed/reordered run converges to identical hashes.
  - Verify: `pnpm -w test converge` — must pass before M5.

- [ ] **T4.5 — Frame-budget instrumentation (R2).**
  - Do: Measure re-sim cost (ticks re-simulated, ms) per frame; expose a debug readout. Confirm worst-case window re-sim fits one frame budget locally.
  - Done when: budget metric visible; window re-sim within one frame at current sim cost.
  - Verify: debug overlay/log.

---

## M5 — Two players (networked)

Exit: two clients stay in sync over a race; induced desyncs are caught by the detector.

- [ ] **T5.1 — Shared message protocol (NFR-15).**
  - Do: In `shared/src/protocol.ts` define typed messages: join/create room, ready, start, per-tick input frame (with tick #), state-hash report, sync/handshake. Zod schema for every inbound message (NFR-16).
  - Done when: all messages typed + Zod-validated; shared by client & server.
  - Verify: `pnpm -w typecheck`

- [ ] **T5.2 — WebSocket relay server (NFR-13, NFR-14).**
  - Do: `server/` WebSocket server: accept connections, timestamp/order incoming input frames, fan out to all clients in the room. **Relays inputs only, never world state.** Validate every inbound message with Zod at the boundary.
  - Done when: server relays input frames between two connected clients.
  - Verify: `pnpm --filter server dev`; two clients exchange inputs.

- [ ] **T5.3 — Client net transport + input exchange.**
  - Do: Client sends local input frames per tick to server; receives remote frames; feeds them into the rollback engine (predict when not yet arrived, correct on arrival).
  - Done when: two tabs/machines each drive their kart and see the other moving.
  - Verify: two-client manual test.

- [ ] **T5.4 — Desync detector (NFR-17, R4).**
  - Do: Clients periodically exchange `SimState` hashes (via T2.8) tagged with tick #. On mismatch, log loudly with the **diverging frame number** and both hashes. Optional: server runs the sim too and hash-checks (anti-cheat groundwork).
  - Done when: matching clients report no desync; a deliberately injected divergence is logged with the frame number.
  - Verify: run with an induced desync toggle; detector fires.

- [ ] **T5.5 — Two-player sync soak.** 🚧
  - Do: Run a full two-client race start→finish; confirm no desync from the detector across the whole race.
  - Done when: full race completes with zero desync reports.
  - Verify: manual two-client full race.

---

## M6 — Four players + race structure

Exit: 4-player race start→finish with correct placements, staying in sync.

- [ ] **T6.1 — Rooms & join codes (FR-9, FR-10).**
  - Do: Server: create room → return join code; join by code; track up to 4 members. Client UI for create/join.
  - Done when: 4 clients can be in one room by code.
  - Verify: 4-client join test.

- [ ] **T6.2 — Ready-up + host start (FR-11).**
  - Do: Ready flow; race starts when all ready or host starts. Lobby UI shows readiness.
  - Done when: race only starts on all-ready/host-start.
  - Verify: manual lobby test.

- [ ] **T6.3 — Deterministic seeded countdown (FR-12).**
  - Do: On start, server broadcasts a shared seed + start tick. Countdown is computed from the seeded deterministic clock so all clients begin the sim on the same tick.
  - Done when: all clients begin simulating the same tick; countdown identical.
  - Verify: 4-client start; logs show identical start tick.

- [ ] **T6.4 — Checkpoints + anti-shortcut (FR-6).**
  - Do: In `step`, advance a kart's checkpoint progress only when it crosses gates in order; reject skips/shortcuts. Fixed-point segment crossing.
  - Done when: a kart that cuts the course does not gain lap progress (unit test).
  - Verify: `pnpm -w test checkpoints`

- [ ] **T6.5 — Lap counting (FR-7).**
  - Do: Increment lap on crossing start line after completing all checkpoints. Lap count configurable (default 3) via room settings.
  - Done when: laps count correctly; config respected (unit test).
  - Verify: `pnpm -w test laps`

- [ ] **T6.6 — Finish detection + placement (FR-8).**
  - Do: Detect race finish per kart at final lap; compute final placement ordering deterministically (handle ties by tick + index).
  - Done when: finishing order computed correctly (unit test with scripted finishes).
  - Verify: `pnpm -w test placement`

- [ ] **T6.7 — Results screen (FR-13).**
  - Do: Client results UI showing finishing order after the race.
  - Done when: results display matches sim placement.
  - Verify: visual at race end.

- [ ] **T6.8 — Four-player race soak.** 🚧
  - Do: Full 4-client race start→finish; verify correct placements and zero desync; confirm re-sim stays within one frame budget at 4 players (R2, acceptance §9).
  - Done when: 4-player full race completes, correct placements, no desync, within frame budget.
  - Verify: manual 4-client full race + budget readout.

---

## M7 — Items

Exit: item spawn/pickup deterministic; re-sims identical.

- [ ] **T7.1 — Item system + speed-boost pickup (FR-14, FR-16).**
  - Do: `sim/src/items.ts` — extensible item model (one type now: speed boost). Pickup entities live in `SimState`; pickup-on-overlap applies a boost effect. Structured so new item types slot in without rework.
  - Done when: kart driving over a pickup gets a boost; item state in sim snapshot.
  - Verify: `pnpm -w test items`

- [ ] **T7.2 — Seeded deterministic spawning (FR-15, NFR-3).**
  - Do: All item spawn timing/placement randomness driven by the sim PRNG (T1.7) from the race seed. No `Math.random`.
  - Done when: spawns are reproducible from the seed.
  - Verify: `pnpm -w test item-spawn`

- [ ] **T7.3 — Item determinism under rollback.** 🚧
  - Do: Extend determinism + rollback convergence tests to cover item spawn/pickup: same seed+inputs → identical hashes including item state; rollback re-sim across a pickup converges to the same hashes.
  - Done when: item-inclusive determinism and convergence tests pass.
  - Verify: `pnpm -w test determinism converge`

- [ ] **T7.4 — Render items.**
  - Do: Three.js meshes for pickups + a boost VFX/indicator, read from sim state (no writes back).
  - Done when: pickups visible; boost shows feedback.
  - Verify: visual.

---

## Final acceptance (PRD §9)

- [ ] **TA.1** Determinism test green in CI (M2 gate). — `pnpm -w test determinism`
- [ ] **TA.2** Delayed/reordered-input test converges to identical hashes (M4). — `pnpm -w test converge`
- [ ] **TA.3** Two- and four-client full races complete with no desync; induced desyncs detected & logged with frame numbers.
- [ ] **TA.4** No artificial local input delay (rollback, not delay-based) — confirm by code + behavior.
- [ ] **TA.5** Rollback re-sim within one frame budget at 4 players on target hardware. — budget readout.
- [ ] **TA.6** No floats in sim (lint/review enforced), strict TS passes, all inbound network input Zod-validated. — `pnpm -w lint && pnpm -w typecheck`
- [ ] **TA.7** Every milestone independently runnable; README documents how to run each.
