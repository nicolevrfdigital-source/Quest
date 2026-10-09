import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Outbox, type PendingOp } from './outbox';

// Minimal localStorage for the node test environment.
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});

const habit = (day: string, nourish: boolean): PendingOp => ({ kind: 'habit', log: { day, nourish, move: false, water: false, challenge: false } });

describe('outbox', () => {
  beforeEach(() => {
    store.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('sends edits and reports saved', async () => {
    const sent: PendingOp[] = [];
    const statuses: string[] = [];
    const box = new Outbox('k', async (op) => void sent.push(op), (s) => statuses.push(s.state));
    box.enqueue(habit('2026-10-12', true));
    await vi.runAllTimersAsync();
    expect(sent).toHaveLength(1);
    expect(statuses.at(-1)).toBe('saved');
    expect(store.has('k')).toBe(false);
  });

  it('keeps failed edits, persists them and retries', async () => {
    let online = false;
    const sent: PendingOp[] = [];
    const box = new Outbox('k', async (op) => {
      if (!online) throw new Error('offline');
      sent.push(op);
    }, () => {});
    box.enqueue(habit('2026-10-12', true));
    await vi.advanceTimersByTimeAsync(0);
    expect(box.status.state).toBe('error');
    expect(JSON.parse(store.get('k')!)).toHaveLength(1);

    // A reload restores the pending edit.
    const restored = new Outbox('k', async () => {}, () => {});
    expect(restored.pending()).toHaveLength(1);
    restored.dispose();

    online = true;
    await vi.advanceTimersByTimeAsync(2000);
    expect(sent).toHaveLength(1);
    expect(box.status.state).toBe('saved');
  });

  it('keeps only the latest edit per day', async () => {
    const sent: PendingOp[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const box = new Outbox('k', async (op) => {
      await gate;
      sent.push(op);
    }, () => {});
    box.enqueue(habit('2026-10-12', true));
    box.enqueue(habit('2026-10-12', false)); // replaced while the first is in flight
    release();
    await vi.runAllTimersAsync();
    const last = sent.at(-1) as Extract<PendingOp, { kind: 'habit' }>;
    expect(last.log.nourish).toBe(false);
    expect(box.pending()).toHaveLength(0);
  });
});
