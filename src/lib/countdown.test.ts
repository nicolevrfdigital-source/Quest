import { describe, expect, it } from 'vitest';
import { describeDaysLeft, resolveCountdown } from './countdown';
import type { Countdown, Quest } from './types';

const quest: Quest = {
  id: 'q1',
  name: 'Pre-Trip Quest',
  start_date: '2026-10-12',
  end_date: '2026-11-01',
  status: 'active',
  finished_at: null,
  created_at: '',
};

const fixed = (target: string): Countdown => ({ id: 'c', title: 'My Trip', target_date: target, linked_to_quest: false, sort_order: 0 });
const linked: Countdown = { id: 'l', title: '', target_date: null, linked_to_quest: true, sort_order: 1 };

describe('countdowns', () => {
  it('counts whole calendar days to a fixed date', () => {
    expect(resolveCountdown(fixed('2026-12-12'), quest, '2026-10-09').daysLeft).toBe(64);
    expect(resolveCountdown(fixed('2026-10-18'), quest, '2026-10-09').daysLeft).toBe(9);
    expect(resolveCountdown(fixed('2026-10-18'), quest, '2026-10-18').daysLeft).toBe(0);
    expect(resolveCountdown(fixed('2026-10-18'), quest, '2026-10-20').daysLeft).toBe(-2);
  });

  it('follows the active quest end date and name', () => {
    const v = resolveCountdown(linked, quest, '2026-10-09');
    expect(v.title).toBe('Pre-Trip Quest');
    expect(v.target).toBe('2026-11-01');
    expect(v.daysLeft).toBe(23);
    expect(v.quest).toEqual({ day: 0, total: 21, startsIn: 3 });
  });

  it('updates automatically when the quest is extended', () => {
    const extended = { ...quest, end_date: '2026-11-08' };
    const v = resolveCountdown(linked, extended, '2026-10-20');
    expect(v.daysLeft).toBe(19);
    expect(v.quest).toEqual({ day: 9, total: 28, startsIn: 0 });
  });

  it('leaves independent countdowns alone when the quest changes', () => {
    const extended = { ...quest, end_date: '2026-11-08' };
    expect(resolveCountdown(fixed('2026-12-12'), extended, '2026-10-09').daysLeft).toBe(64);
  });

  it('keeps a custom title on a linked countdown', () => {
    expect(resolveCountdown({ ...linked, title: 'Quest end' }, quest, '2026-10-09').title).toBe('Quest end');
  });

  it('handles no active quest', () => {
    const v = resolveCountdown(linked, null, '2026-10-09');
    expect(v.daysLeft).toBeNull();
    expect(v.target).toBeNull();
  });

  it('describes days left', () => {
    expect(describeDaysLeft(0).value).toBe('Today');
    expect(describeDaysLeft(1)).toEqual({ value: '1', caption: 'day to go' });
    expect(describeDaysLeft(9)).toEqual({ value: '9', caption: 'days to go' });
    expect(describeDaysLeft(-3).caption).toBe('3 days ago');
    expect(describeDaysLeft(null).value).toBe('—');
  });
});
