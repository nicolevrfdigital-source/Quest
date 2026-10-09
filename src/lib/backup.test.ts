import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup } from './backup';

const valid = () =>
  JSON.parse(
    JSON.stringify(
      buildBackup({
        habits: [
          { day: '2026-10-12', nourish: true, move: false, water: true },
          { day: '2026-10-13', nourish: false, move: false, water: false },
        ],
        quests: [
          { id: 'x', name: 'Pre-Trip Quest', start_date: '2026-10-12', end_date: '2026-11-01', status: 'active', finished_at: null, created_at: '' },
        ],
        countdowns: [{ id: 'y', title: '', target_date: null, linked_to_quest: true, sort_order: 0 }],
        stickyNote: 'hi',
      }),
    ),
  );

describe('backup', () => {
  it('round-trips an export', () => {
    const res = parseBackup(valid());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.habit_logs).toHaveLength(1); // empty days are skipped
      expect(res.data.quests[0].name).toBe('Pre-Trip Quest');
      expect(res.data.sticky_note).toBe('hi');
    }
  });

  it('rejects files from other apps', () => {
    expect(parseBackup({ hello: 'world' }).ok).toBe(false);
    expect(parseBackup(null).ok).toBe(false);
  });

  it('rejects invalid dates, duplicate days and bad quests', () => {
    const a = valid();
    a.habit_logs[0].day = '2026-13-01';
    expect(parseBackup(a).ok).toBe(false);

    const b = valid();
    b.habit_logs.push({ ...b.habit_logs[0] });
    expect(parseBackup(b).ok).toBe(false);

    const c = valid();
    c.quests[0].end_date = '2026-10-01';
    expect(parseBackup(c).ok).toBe(false);

    const d = valid();
    d.quests.push({ ...d.quests[0] });
    expect(parseBackup(d)).toEqual({ ok: false, error: 'Only one quest can be active.' });
  });

  it('requires a date on unlinked countdowns', () => {
    const e = valid();
    e.countdowns[0].linked_to_quest = false;
    expect(parseBackup(e).ok).toBe(false);
  });
});
