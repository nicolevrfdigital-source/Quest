import { describe, expect, it } from 'vitest';
import { buildHealthByDay, burnedStars, consumedStars, dayStars, originsByKind, stepStars, summarizeRange } from './health';
import type { DailyHealthRow, Mood } from './types';

const row = (day: string, kind: DailyHealthRow['kind'], origin: string, value: number): DailyHealthRow => ({ day, kind, origin, value });

describe('stars', () => {
  it('scores steps', () => {
    expect([stepStars(undefined), stepStars(3000), stepStars(7000), stepStars(9999), stepStars(10000)]).toEqual([null, 1, 2, 2, 3]);
  });
  it('scores calories burned, with 0 stars under 1500', () => {
    expect([burnedStars(1499), burnedStars(1500), burnedStars(1700), burnedStars(2000)]).toEqual([0, 1, 2, 3]);
  });
  it('scores calories consumed', () => {
    expect([consumedStars(1200), consumedStars(1400), consumedStars(1600), consumedStars(1601), consumedStars(undefined)]).toEqual([3, 3, 2, 1, null]);
  });
  it('gives one star to a food log that looks incomplete', () => {
    expect([consumedStars(400), consumedStars(999), consumedStars(1000)]).toEqual([1, 1, 3]);
  });
  it('adds up a day, treating missing data as no stars', () => {
    expect(dayStars({ steps: 10500, burned: 1750 }).total).toBe(5);
    expect(dayStars(undefined).total).toBe(0);
  });
});

describe('picking one value per day', () => {
  const rows = [
    row('2026-10-12', 'calories_burned', 'com.google.android.apps.fitness', 1650),
    row('2026-10-12', 'calories_burned', 'com.fitbit.FitbitMobile', 2100),
    row('2026-10-12', 'steps', 'health_connect', 8000),
    row('2026-10-13', 'weight', 'com.fitbit.FitbitMobile', 68),
    row('2026-10-13', 'weight', 'manual', 67.5),
  ];

  it('prefers manual, then the chosen source, then the highest value', () => {
    expect(buildHealthByDay(rows).get('2026-10-12')).toEqual({ burned: 2100, steps: 8000 });
    expect(buildHealthByDay(rows, { calories_burned: 'com.google.android.apps.fitness' }).get('2026-10-12')?.burned).toBe(1650);
    expect(buildHealthByDay(rows).get('2026-10-13')?.weightKg).toBe(67.5);
  });

  it('lists source apps, without manual entries', () => {
    expect(originsByKind(rows).weight).toEqual(['com.fitbit.FitbitMobile']);
  });
});

describe('range summary', () => {
  it('averages only days with data and stops at today', () => {
    const byDay = buildHealthByDay([
      row('2026-10-12', 'steps', 'hc', 10000),
      row('2026-10-12', 'weight', 'hc', 70),
      row('2026-10-14', 'steps', 'hc', 6000),
      row('2026-10-14', 'weight', 'hc', 69),
      row('2026-10-20', 'steps', 'hc', 9000), // after "today"
    ]);
    const moods = new Map<string, Mood>([['2026-10-12', 5], ['2026-10-13', 5]]);
    const s = summarizeRange('2026-10-12', '2026-11-01', '2026-10-14', byDay, moods);
    expect(s.days).toHaveLength(3);
    expect(s.totalSteps).toBe(16000);
    expect(s.avgSteps).toBe(8000);
    expect(s.avgStars).toBe(2);
    expect(s.firstWeightKg).toBe(70);
    expect(s.lastWeightKg).toBe(69);
    expect(s.moods[5]).toBe(2);
    expect(s.bestDay).toBe('2026-10-12');
  });
});
