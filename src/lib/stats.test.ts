import { describe, expect, it } from 'vitest';
import { countCompletedDays } from './stats';
import type { HabitLog } from './types';

const log = (day: string, nourish = false, move = false, water = false): HabitLog => ({ day, nourish, move, water });

describe('habit counters', () => {
  const logs = [
    log('2026-10-01', true, true, true), // before quest
    log('2026-10-12', true, false, true),
    log('2026-10-13', true, true, false),
    log('2026-10-14', false, false, false),
    log('2026-10-15', false, true, true), // "today"
    log('2026-10-20', true, true, true), // future — planned ahead
  ];
  const today = '2026-10-15';

  it('counts completed days across all history, excluding the future', () => {
    expect(countCompletedDays(logs, today)).toEqual({ nourish: 3, move: 3, water: 3 });
  });

  it('counts only days within the quest range', () => {
    expect(countCompletedDays(logs, today, { start: '2026-10-12', end: '2026-11-01' })).toEqual({ nourish: 2, move: 2, water: 2 });
  });

  it('counts each habit at most once per calendar day', () => {
    const dupes = [log('2026-10-12', true, true, true), log('2026-10-12', true, true, true)];
    expect(countCompletedDays(dupes, today)).toEqual({ nourish: 1, move: 1, water: 1 });
  });

  it('includes days in a finished quest up to its end', () => {
    expect(countCompletedDays(logs, '2026-12-01', { start: '2026-10-12', end: '2026-10-13' })).toEqual({ nourish: 2, move: 1, water: 1 });
  });

  it('never goes down when a day is missed', () => {
    const before = countCompletedDays(logs, '2026-10-15');
    const after = countCompletedDays([...logs, log('2026-10-16')], '2026-10-16');
    expect(after.nourish).toBeGreaterThanOrEqual(before.nourish);
    expect(after.move).toBeGreaterThanOrEqual(before.move);
  });

  it('returns zeros for no data', () => {
    expect(countCompletedDays([], today)).toEqual({ nourish: 0, move: 0, water: 0 });
  });
});
