/**
 * Calendar-date helpers. Days are plain local date strings (YYYY-MM-DD) so a
 * check-in made at 11pm stays on that day regardless of timezone, and day
 * arithmetic is done in UTC to stay immune to daylight-saving shifts.
 */

const DAY_MS = 86_400_000;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar date of a Date object. */
export function toDayString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayString(now: Date = new Date()): string {
  return toDayString(now);
}

export function isDayString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = DAY_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = new Date(Date.UTC(y, mo - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === mo - 1 && utc.getUTCDate() === d;
}

function dayToUTC(day: string): number {
  const m = DAY_RE.exec(day);
  if (!m) throw new Error(`Invalid day: ${day}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function addDays(day: string, amount: number): string {
  const d = new Date(dayToUTC(day) + amount * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: string, to: string): number {
  return Math.round((dayToUTC(to) - dayToUTC(from)) / DAY_MS);
}

/** A local Date at noon on the given day — safe to hand to toLocaleDateString. */
export function dayToLocalDate(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function formatDay(day: string, options: Intl.DateTimeFormatOptions): string {
  return dayToLocalDate(day).toLocaleDateString(undefined, options);
}

export function formatShort(day: string): string {
  return formatDay(day, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function minDay(a: string, b: string): string {
  return a < b ? a : b;
}
