import { isDayString } from './dates';
import type { Countdown, HabitLog, Quest } from './types';

export interface BackupQuest {
  name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'finished';
  finished_at: string | null;
}

export interface BackupCountdown {
  title: string;
  target_date: string | null;
  linked_to_quest: boolean;
  sort_order: number;
}

export interface BackupFile {
  app: 'quest-hq';
  version: 1;
  exported_at: string;
  habit_logs: HabitLog[];
  quests: BackupQuest[];
  countdowns: BackupCountdown[];
  sticky_note: string;
}

export function buildBackup(input: {
  habits: Iterable<HabitLog>;
  quests: Quest[];
  countdowns: Countdown[];
  stickyNote: string;
}): BackupFile {
  return {
    app: 'quest-hq',
    version: 1,
    exported_at: new Date().toISOString(),
    habit_logs: [...input.habits]
      .filter((h) => h.nourish || h.move || h.water || h.challenge)
      .map(({ day, nourish, move, water, challenge }) => ({ day, nourish, move, water, challenge }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    quests: input.quests.map(({ name, start_date, end_date, status, finished_at }) => ({
      name, start_date, end_date, status, finished_at,
    })),
    countdowns: input.countdowns.map(({ title, target_date, linked_to_quest, sort_order }) => ({
      title, target_date, linked_to_quest, sort_order,
    })),
    sticky_note: input.stickyNote,
  };
}

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validates an imported file thoroughly before anything is overwritten. */
export function parseBackup(input: unknown): ParseResult {
  const fail = (error: string): ParseResult => ({ ok: false, error });
  if (!isObj(input)) return fail('This file isn’t a Quest HQ backup.');
  if (input.app !== 'quest-hq') return fail('This file isn’t a Quest HQ backup.');
  if (input.version !== 1) return fail(`Unsupported backup version: ${String(input.version)}`);
  const { habit_logs, quests, countdowns, sticky_note } = input;
  if (!Array.isArray(habit_logs) || !Array.isArray(quests) || !Array.isArray(countdowns)) {
    return fail('The backup is missing habit logs, quests or countdowns.');
  }
  if (typeof sticky_note !== 'string' || sticky_note.length > 5000) return fail('The sticky note is invalid.');

  const days = new Set<string>();
  const logs: HabitLog[] = [];
  for (const [i, h] of habit_logs.entries()) {
    if (!isObj(h) || !isDayString(h.day)) return fail(`Habit record #${i + 1} has an invalid date.`);
    if (days.has(h.day)) return fail(`The date ${h.day} appears twice.`);
    days.add(h.day);
    for (const k of ['nourish', 'move', 'water'] as const) {
      if (typeof h[k] !== 'boolean') return fail(`Habit record ${h.day} has an invalid “${k}” value.`);
    }
    // Backups made before daily challenges existed simply have none.
    const challenge = h.challenge ?? false;
    if (typeof challenge !== 'boolean') return fail(`Habit record ${h.day} has an invalid “challenge” value.`);
    logs.push({ day: h.day, nourish: h.nourish as boolean, move: h.move as boolean, water: h.water as boolean, challenge });
  }

  const outQuests: BackupQuest[] = [];
  for (const [i, q] of quests.entries()) {
    const label = `Quest #${i + 1}`;
    if (!isObj(q)) return fail(`${label} is invalid.`);
    if (typeof q.name !== 'string' || q.name.trim().length < 1 || q.name.length > 80) return fail(`${label} needs a name (up to 80 characters).`);
    if (!isDayString(q.start_date) || !isDayString(q.end_date)) return fail(`${label} has invalid dates.`);
    if (q.end_date < q.start_date) return fail(`${label} ends before it starts.`);
    if (q.status !== 'active' && q.status !== 'finished') return fail(`${label} has an invalid status.`);
    const finished_at = q.finished_at ?? null;
    if (finished_at !== null && (typeof finished_at !== 'string' || Number.isNaN(Date.parse(finished_at)))) {
      return fail(`${label} has an invalid finish time.`);
    }
    outQuests.push({ name: q.name.trim(), start_date: q.start_date, end_date: q.end_date, status: q.status, finished_at });
  }
  if (outQuests.filter((q) => q.status === 'active').length > 1) return fail('Only one quest can be active.');

  const outCountdowns: BackupCountdown[] = [];
  for (const [i, c] of countdowns.entries()) {
    const label = `Countdown #${i + 1}`;
    if (!isObj(c)) return fail(`${label} is invalid.`);
    if (typeof c.title !== 'string' || c.title.length > 60) return fail(`${label} has an invalid title.`);
    if (typeof c.linked_to_quest !== 'boolean') return fail(`${label} is invalid.`);
    const target = c.target_date ?? null;
    if (target !== null && !isDayString(target)) return fail(`${label} has an invalid date.`);
    if (!c.linked_to_quest && target === null) return fail(`${label} needs a date.`);
    const sort = typeof c.sort_order === 'number' && Number.isInteger(c.sort_order) ? c.sort_order : i;
    outCountdowns.push({ title: c.title, target_date: target, linked_to_quest: c.linked_to_quest, sort_order: sort });
  }

  return {
    ok: true,
    data: {
      app: 'quest-hq',
      version: 1,
      exported_at: typeof input.exported_at === 'string' ? input.exported_at : '',
      habit_logs: logs,
      quests: outQuests,
      countdowns: outCountdowns,
      sticky_note,
    },
  };
}
