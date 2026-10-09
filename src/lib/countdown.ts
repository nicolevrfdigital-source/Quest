import type { Countdown, Quest } from './types';
import { diffDays } from './dates';

export interface CountdownView {
  id: string;
  title: string;
  target: string | null;
  /** Days from today to the target (negative once it has passed). Null when there's no target. */
  daysLeft: number | null;
  linked: boolean;
  /** Only for quest-linked countdowns while a quest exists. */
  quest?: { day: number; total: number; startsIn: number };
}

export function resolveCountdown(c: Countdown, activeQuest: Quest | null, today: string): CountdownView {
  if (c.linked_to_quest) {
    if (!activeQuest) {
      return { id: c.id, title: c.title || 'Quest', target: null, daysLeft: null, linked: true };
    }
    const total = diffDays(activeQuest.start_date, activeQuest.end_date) + 1;
    const elapsed = diffDays(activeQuest.start_date, today) + 1;
    return {
      id: c.id,
      title: c.title || activeQuest.name,
      target: activeQuest.end_date,
      daysLeft: diffDays(today, activeQuest.end_date),
      linked: true,
      quest: {
        day: Math.max(0, Math.min(total, elapsed)),
        total,
        startsIn: Math.max(0, diffDays(today, activeQuest.start_date)),
      },
    };
  }
  return {
    id: c.id,
    title: c.title || 'Countdown',
    target: c.target_date,
    daysLeft: c.target_date ? diffDays(today, c.target_date) : null,
    linked: false,
  };
}

/** The big number and the small caption under it. */
export function describeDaysLeft(daysLeft: number | null): { value: string; caption: string } {
  if (daysLeft === null) return { value: '—', caption: 'no date set' };
  if (daysLeft === 0) return { value: 'Today', caption: 'it’s here ✿' };
  if (daysLeft === 1) return { value: '1', caption: 'day to go' };
  if (daysLeft > 1) return { value: String(daysLeft), caption: 'days to go' };
  const ago = -daysLeft;
  return { value: '✓', caption: ago === 1 ? 'yesterday' : `${ago} days ago` };
}
