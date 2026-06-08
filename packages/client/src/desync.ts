/**
 * Desync detector.
 *
 * Clients periodically exchange SimState hashes tagged with tick #.
 * On mismatch, log the diverging frame number and both hashes.
 */

export interface DesyncReport {
  tick: number;
  localHash: number;
  remoteHash: number;
  remotePlayerIndex: number;
}

export type DesyncHandler = (report: DesyncReport) => void;

export class DesyncDetector {
  private localHashes = new Map<number, number>();
  private remoteHashes = new Map<number, Map<number, number>>();
  private handlers: DesyncHandler[] = [];
  private lastCheckTick = 0;

  /** Record our own hash for a tick. */
  recordLocalHash(tick: number, hash: number): void {
    this.localHashes.set(tick, hash);
  }

  /** Record a remote hash report. */
  recordRemoteHash(tick: number, playerIndex: number, hash: number): void {
    if (!this.remoteHashes.has(tick)) {
      this.remoteHashes.set(tick, new Map());
    }
    this.remoteHashes.get(tick)!.set(playerIndex, hash);
  }

  /** Check for desyncs at a given tick. */
  checkTick(tick: number): void {
    const localHash = this.localHashes.get(tick);
    if (localHash === undefined) return;

    const remoteMap = this.remoteHashes.get(tick);
    if (!remoteMap) return;

    for (const [playerIndex, remoteHash] of remoteMap) {
      if (remoteHash !== localHash) {
        const report: DesyncReport = {
          tick,
          localHash,
          remoteHash,
          remotePlayerIndex: playerIndex,
        };
        for (const handler of this.handlers) {
          handler(report);
        }
      }
    }
  }

  /** Check all recorded ticks up to the current tick. */
  checkUpTo(tick: number): void {
    for (let t = this.lastCheckTick + 1; t <= tick; t++) {
      this.checkTick(t);
    }
    this.lastCheckTick = tick;
  }

  /** Clean up old hashes to prevent memory leaks. */
  prune(tick: number): void {
    for (const t of this.localHashes.keys()) {
      if (t < tick - 120) {
        this.localHashes.delete(t);
      }
    }
    for (const [t, map] of this.remoteHashes) {
      if (t < tick - 120) {
        this.remoteHashes.delete(t);
      } else {
        for (const p of map.keys()) {
          if (p < tick - 120) {
            map.delete(p);
          }
        }
      }
    }
  }

  onDesync(handler: DesyncHandler): void {
    this.handlers.push(handler);
  }
}
