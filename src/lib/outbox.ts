import type { HabitLog } from './types';

/**
 * A tiny persistent write queue for the edits that happen constantly (habit
 * check-ins and the sticky note). Each edit is stored under a key, so only the
 * latest value per day / per note is kept. The queue survives reloads via
 * localStorage and keeps retrying with backoff, so a flaky connection never
 * silently drops an edit.
 */

export type PendingOp = { kind: 'habit'; log: HabitLog } | { kind: 'note'; text: string };

export type SyncState = 'idle' | 'saving' | 'saved' | 'error';

export interface SyncStatus {
  state: SyncState;
  pending: number;
  error?: string;
}

const MAX_RETRY_MS = 60_000;

export function opKey(op: PendingOp): string {
  return op.kind === 'habit' ? `habit:${op.log.day}` : 'note';
}

export class Outbox {
  private ops = new Map<string, PendingOp>();
  private flushing = false;
  private flushAgain = false;
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  status: SyncStatus = { state: 'idle', pending: 0 };

  constructor(
    private readonly storageKey: string,
    private readonly send: (op: PendingOp) => Promise<void>,
    private readonly onStatus: (status: SyncStatus) => void,
  ) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) for (const op of JSON.parse(raw) as PendingOp[]) this.ops.set(opKey(op), op);
    } catch {
      // Unreadable storage just means nothing was pending.
    }
    this.status = { state: 'idle', pending: this.ops.size };
  }

  enqueue(op: PendingOp): void {
    this.ops.set(opKey(op), op);
    this.persist();
    // Notify right away so the UI shows the edit even if a flush is already running.
    this.setStatus({ ...this.status, pending: this.ops.size });
    void this.flush();
  }

  pending(): PendingOp[] {
    return [...this.ops.values()];
  }

  has(key: string): boolean {
    return this.ops.has(key);
  }

  clear(): void {
    this.ops.clear();
    this.persist();
    this.attempt = 0;
    clearTimeout(this.retryTimer);
    this.setStatus({ state: 'idle', pending: 0 });
  }

  async flush(): Promise<void> {
    if (this.flushing) {
      this.flushAgain = true;
      return;
    }
    if (this.ops.size === 0) return;
    clearTimeout(this.retryTimer);
    this.flushing = true;
    this.setStatus({ state: 'saving', pending: this.ops.size });

    let failed = false;
    try {
      for (const [key, op] of [...this.ops]) {
        await this.send(op);
        // Only drop it if it wasn't replaced by a newer edit while sending.
        if (this.ops.get(key) === op) {
          this.ops.delete(key);
          this.persist();
        }
      }
      this.attempt = 0;
    } catch (err) {
      failed = true;
      this.attempt += 1;
      const delay = Math.min(MAX_RETRY_MS, 2000 * 2 ** (this.attempt - 1));
      this.retryTimer = setTimeout(() => void this.flush(), delay);
      this.setStatus({ state: 'error', pending: this.ops.size, error: describeError(err) });
    } finally {
      this.flushing = false;
    }

    if (this.flushAgain || (!failed && this.ops.size > 0)) {
      this.flushAgain = false;
      if (!failed) return this.flush();
    }
    if (!failed) this.setStatus({ state: 'saved', pending: 0 });
  }

  dispose(): void {
    clearTimeout(this.retryTimer);
  }

  private persist(): void {
    try {
      if (this.ops.size === 0) localStorage.removeItem(this.storageKey);
      else localStorage.setItem(this.storageKey, JSON.stringify([...this.ops.values()]));
    } catch {
      // Storage full or blocked — edits still live in memory and keep retrying.
    }
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.onStatus(status);
  }
}

export function describeError(err: unknown): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'You’re offline';
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') return err.message;
  return 'Something went wrong';
}
