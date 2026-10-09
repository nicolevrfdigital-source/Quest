import { describe, expect, it } from 'vitest';
import { addDays, diffDays, isDayString, msUntilNextDay, toDayString } from './dates';

describe('date navigation', () => {
  it('moves forward and back by a day', () => {
    expect(addDays('2026-10-12', 1)).toBe('2026-10-13');
    expect(addDays('2026-10-12', -1)).toBe('2026-10-11');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('is unaffected by daylight-saving changes', () => {
    // US DST ends 2026-11-01, EU DST ends 2026-10-25.
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2);
    expect(diffDays('2026-10-12', '2026-11-01')).toBe(20);
  });

  it('round-trips many steps', () => {
    let d = '2026-10-12';
    for (let i = 0; i < 400; i++) d = addDays(d, 1);
    for (let i = 0; i < 400; i++) d = addDays(d, -1);
    expect(d).toBe('2026-10-12');
  });

  it('uses the local calendar date, not UTC', () => {
    // 11:30pm local is still that day, whatever the timezone.
    expect(toDayString(new Date(2026, 9, 12, 23, 30))).toBe('2026-10-12');
    expect(toDayString(new Date(2026, 9, 13, 0, 5))).toBe('2026-10-13');
  });

  it('validates day strings', () => {
    expect(isDayString('2026-10-12')).toBe(true);
    expect(isDayString('2026-02-30')).toBe(false);
    expect(isDayString('2026-1-1')).toBe(false);
    expect(isDayString(20261012)).toBe(false);
  });

  it('knows how long until midnight', () => {
    expect(msUntilNextDay(new Date(2026, 9, 12, 23, 59, 0))).toBe(60_000);
  });
});
