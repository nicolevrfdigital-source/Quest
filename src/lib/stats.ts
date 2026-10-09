import { HABIT_KEYS, type HabitCounts, type HabitLog } from './types';
import { minDay } from './dates';

export interface DayRange {
  start: string;
  end: string;
}

/**
 * Counts completed days per habit. Each habit counts at most once per calendar
 * day, future days are ignored, and an optional range limits the window.
 * No streaks, no resets — every completed day simply adds one.
 */
export function countCompletedDays(
  logs: Iterable<HabitLog>,
  today: string,
  range?: DayRange,
): HabitCounts {
  const counts: HabitCounts = { nourish: 0, move: 0, water: 0 };
  const lastDay = range ? minDay(range.end, today) : today;
  const seen = new Set<string>();

  for (const log of logs) {
    if (seen.has(log.day)) continue;
    seen.add(log.day);
    if (log.day > lastDay) continue;
    if (range && log.day < range.start) continue;
    for (const key of HABIT_KEYS) if (log[key]) counts[key] += 1;
  }
  return counts;
}
