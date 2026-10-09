export type HabitKey = 'nourish' | 'move' | 'water' | 'challenge';

export const HABIT_KEYS: readonly HabitKey[] = ['nourish', 'move', 'water', 'challenge'];

/** One calendar day of habit check-ins. `day` is a local date string, YYYY-MM-DD. */
export interface HabitLog {
  day: string;
  nourish: boolean;
  move: boolean;
  water: boolean;
  /** The day's movement challenge (see lib/challenges). */
  challenge: boolean;
}

export type QuestStatus = 'active' | 'finished';

export interface Quest {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: QuestStatus;
  finished_at: string | null;
  created_at: string;
}

export interface Countdown {
  id: string;
  title: string;
  /** Ignored when `linked_to_quest` is true — the active quest's end date is used instead. */
  target_date: string | null;
  linked_to_quest: boolean;
  sort_order: number;
}

export interface Settings {
  sticky_note: string;
  photo_path: string | null;
}

export type HabitCounts = Record<HabitKey, number>;
