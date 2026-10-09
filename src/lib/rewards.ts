import { HABIT_KEYS, type HabitLog } from './types';

export function isPerfectDay(log: HabitLog | undefined): boolean {
  return Boolean(log) && HABIT_KEYS.every((k) => log![k]);
}

/** Every day (up to today) where all four check-ins are done, oldest first. */
export function perfectDays(logs: Iterable<HabitLog>, today: string): string[] {
  const days = new Set<string>();
  for (const log of logs) if (log.day <= today && isPerfectDay(log)) days.add(log.day);
  return [...days].sort();
}

export interface StickerCollection {
  /** For each sticker, the days it was earned (oldest first). */
  earned: string[][];
  total: number;
}

/**
 * The n-th perfect day earns sticker n, so the book fills up in order and
 * every sticker is collected before any repeats. Nothing is stored — the
 * collection is always rebuilt from the habit history.
 */
export function collectStickers(days: string[], stickerCount: number): StickerCollection {
  const earned: string[][] = Array.from({ length: stickerCount }, () => []);
  days.forEach((day, i) => earned[i % stickerCount].push(day));
  return { earned, total: days.length };
}

/** Which sticker a given perfect day earned, or null if it isn't one. */
export function stickerIndexForDay(days: string[], day: string, stickerCount: number): number | null {
  const i = days.indexOf(day);
  return i === -1 ? null : i % stickerCount;
}
