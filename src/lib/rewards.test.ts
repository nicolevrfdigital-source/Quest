import { describe, expect, it } from 'vitest';
import { CHALLENGES, challengeIndexForDay } from './challenges';
import { addDays } from './dates';
import { collectStickers, perfectDays, stickerIndexForDay } from './rewards';
import type { HabitLog } from './types';

const all = (day: string): HabitLog => ({ day, nourish: true, move: true, water: true, challenge: true });

describe('daily challenges', () => {
  it('has at least 30 challenges', () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(30);
  });

  it('is stable for a given day', () => {
    expect(challengeIndexForDay('2026-10-12')).toBe(challengeIndexForDay('2026-10-12'));
  });

  it('never repeats within a block and never twice in a row', () => {
    const n = CHALLENGES.length;
    const seq = Array.from({ length: n * 6 }, (_, i) => challengeIndexForDay(addDays('2026-01-01', i)));
    for (let b = 0; b < 6; b++) expect(new Set(seq.slice(b * n, (b + 1) * n)).size).toBe(n);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });
});

describe('stickers', () => {
  const logs = [
    all('2026-10-12'),
    { ...all('2026-10-13'), challenge: false },
    all('2026-10-14'),
    all('2026-10-20'), // future — doesn't count yet
  ];

  it('only counts days with all four check-ins, up to today', () => {
    expect(perfectDays(logs, '2026-10-15')).toEqual(['2026-10-12', '2026-10-14']);
  });

  it('awards stickers in order, then repeats', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03'];
    expect(stickerIndexForDay(days, '2026-10-03', 32)).toBe(2);
    expect(stickerIndexForDay(days, '2026-10-03', 2)).toBe(0);
    expect(stickerIndexForDay(days, '2026-10-09', 32)).toBeNull();
    const { earned, total } = collectStickers(days, 2);
    expect(total).toBe(3);
    expect(earned).toEqual([['2026-10-01', '2026-10-03'], ['2026-10-02']]);
  });
});
