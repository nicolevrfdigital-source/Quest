import { addDays, minDay } from './dates';
import type { DailyHealthRow, HealthKind, HealthSources, Mood } from './types';

export const MANUAL = 'manual';

/** The numbers for one day. Missing means "no data", which is different from zero. */
export interface DayHealth {
  steps?: number;
  burned?: number;
  consumed?: number;
  weightKg?: number;
}

const FIELD: Record<HealthKind, keyof DayHealth> = {
  steps: 'steps',
  calories_burned: 'burned',
  calories_consumed: 'consumed',
  weight: 'weightKg',
};

/**
 * Picks one value per day and kind: a number typed in Quest HQ wins, then the
 * preferred source app, otherwise the highest value (a watch usually counts
 * more than a phone left on the desk).
 */
export function buildHealthByDay(rows: Iterable<DailyHealthRow>, sources: HealthSources = {}): Map<string, DayHealth> {
  const best = new Map<string, { rank: number; value: number }>();
  for (const r of rows) {
    const key = `${r.day}|${r.kind}`;
    const rank = r.origin === MANUAL ? 2 : r.origin === sources[r.kind] ? 1 : 0;
    const cur = best.get(key);
    if (!cur || rank > cur.rank || (rank === cur.rank && r.value > cur.value)) best.set(key, { rank, value: r.value });
  }
  const days = new Map<string, DayHealth>();
  for (const [key, { value }] of best) {
    const [day, kind] = key.split('|') as [string, HealthKind];
    const entry = days.get(day) ?? {};
    entry[FIELD[kind]] = value;
    days.set(day, entry);
  }
  return days;
}

/** Source apps seen per kind (for choosing one in Settings). */
export function originsByKind(rows: Iterable<DailyHealthRow>): Record<HealthKind, string[]> {
  const out: Record<HealthKind, Set<string>> = {
    steps: new Set(),
    calories_burned: new Set(),
    calories_consumed: new Set(),
    weight: new Set(),
  };
  for (const r of rows) if (r.origin !== MANUAL) out[r.kind].add(r.origin);
  return {
    steps: [...out.steps].sort(),
    calories_burned: [...out.calories_burned].sort(),
    calories_consumed: [...out.calories_consumed].sort(),
    weight: [...out.weight].sort(),
  };
}

/* ───────────── stars ───────────── */

export type Stars = 0 | 1 | 2 | 3;

export function stepStars(steps: number | undefined): Stars | null {
  if (steps === undefined) return null;
  if (steps >= 10_000) return 3;
  if (steps >= 7_000) return 2;
  return 1;
}

export function burnedStars(kcal: number | undefined): Stars | null {
  if (kcal === undefined) return null;
  if (kcal >= 2_000) return 3;
  if (kcal >= 1_700) return 2;
  if (kcal >= 1_500) return 1;
  return 0;
}

export function consumedStars(kcal: number | undefined): Stars | null {
  if (kcal === undefined) return null;
  if (kcal <= 1_400) return 3;
  if (kcal <= 1_600) return 2;
  return 1;
}

export const MAX_DAY_STARS = 9;

export function dayStars(h: DayHealth | undefined): { steps: Stars | null; burned: Stars | null; consumed: Stars | null; total: number } {
  const steps = stepStars(h?.steps);
  const burned = burnedStars(h?.burned);
  const consumed = consumedStars(h?.consumed);
  return { steps, burned, consumed, total: (steps ?? 0) + (burned ?? 0) + (consumed ?? 0) };
}

export function hasScore(h: DayHealth | undefined): boolean {
  return h !== undefined && (h.steps !== undefined || h.burned !== undefined || h.consumed !== undefined);
}

/* ───────────── units ───────────── */

const LB_PER_KG = 2.2046226218;
export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const lbToKg = (lb: number) => lb / LB_PER_KG;

/* ───────────── a quest (or any range) at a glance ───────────── */

export interface RangeSummary {
  /** Every day from the start through min(end, today). */
  days: string[];
  scoredDays: number;
  avgStars: number | null;
  totalSteps: number;
  avgSteps: number | null;
  avgBurned: number | null;
  avgConsumed: number | null;
  firstWeightKg: number | null;
  lastWeightKg: number | null;
  moods: Record<Mood, number>;
  bestDay: string | null;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function summarizeRange(
  start: string,
  end: string,
  today: string,
  byDay: Map<string, DayHealth>,
  moods: Map<string, Mood>,
): RangeSummary {
  const last = minDay(end, today);
  const days: string[] = [];
  for (let d = start; d <= last; d = addDays(d, 1)) days.push(d);

  const stars: number[] = [];
  const steps: number[] = [];
  const burned: number[] = [];
  const consumed: number[] = [];
  const weights: number[] = [];
  const moodCounts: Record<Mood, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let bestDay: string | null = null;
  let bestStars = -1;

  for (const d of days) {
    const h = byDay.get(d);
    if (hasScore(h)) {
      const t = dayStars(h).total;
      stars.push(t);
      if (t > bestStars) [bestStars, bestDay] = [t, d];
    }
    if (h?.steps !== undefined) steps.push(h.steps);
    if (h?.burned !== undefined) burned.push(h.burned);
    if (h?.consumed !== undefined) consumed.push(h.consumed);
    if (h?.weightKg !== undefined) weights.push(h.weightKg);
    const m = moods.get(d);
    if (m) moodCounts[m] += 1;
  }

  return {
    days,
    scoredDays: stars.length,
    avgStars: avg(stars),
    totalSteps: steps.reduce((a, b) => a + b, 0),
    avgSteps: avg(steps),
    avgBurned: avg(burned),
    avgConsumed: avg(consumed),
    firstWeightKg: weights[0] ?? null,
    lastWeightKg: weights.at(-1) ?? null,
    moods: moodCounts,
    bestDay,
  };
}
