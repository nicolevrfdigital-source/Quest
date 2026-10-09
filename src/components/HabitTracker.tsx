import { Check, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { useData } from '../data/context';
import { addDays, diffDays, formatDay, isDayString } from '../lib/dates';
import { challengeForDay } from '../lib/challenges';
import { HABITS } from '../lib/habits';
import { isPerfectDay, perfectDays, stickerIndexForDay } from '../lib/rewards';
import { HABIT_KEYS, type HabitKey } from '../lib/types';
import { STICKERS } from './stickers';
import { Card, CardTitle } from './Card';

function relativeLabel(day: string, today: string): string {
  const d = diffDays(today, day);
  if (d === 0) return 'Today';
  if (d === -1) return 'Yesterday';
  if (d === 1) return 'Tomorrow';
  return formatDay(day, { weekday: 'long' });
}

const CHEERS = [
  'Fresh page, fresh start ✿',
  'One down — lovely start!',
  'Two down, look at you!',
  'Three! One more for a sticker ✨',
  'All four — sticker earned ♡',
];

export function HabitTracker({
  day,
  today,
  onDayChange,
  onSticker,
}: {
  day: string;
  today: string;
  onDayChange: (day: string) => void;
  /** Called with the sticker index when a tap completes all four check-ins. */
  onSticker: (index: number) => void;
}) {
  const { habits, setHabit } = useData();
  const log = habits.get(day);
  const done = HABIT_KEYS.filter((k) => log?.[k]).length;
  const isFuture = day > today;
  const challenge = challengeForDay(day);

  const toggle = (key: HabitKey, value: boolean) => {
    setHabit(day, key, value);
    const next = { day, nourish: false, move: false, water: false, challenge: false, ...log, [key]: value };
    if (!value || isFuture || isPerfectDay(log) || !isPerfectDay(next)) return;
    const index = stickerIndexForDay(perfectDays([...habits.values(), next], today), day, STICKERS.length);
    if (index !== null) onSticker(index);
  };

  return (
    <Card className="flex min-w-0 flex-col p-4" tape="bg-sage">
      <CardTitle
        icon={ListChecks}
        right={
          day !== today && (
            <button onClick={() => onDayChange(today)} className="btn !min-h-8 bg-sage-soft !px-3 !text-xs text-sage-deep">
              Back to today
            </button>
          )
        }
      >
        Daily habits
      </CardTitle>

      <div className="mb-2.5 flex items-center gap-2">
        <button
          onClick={() => onDayChange(addDays(day, -1))}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-cream transition hover:bg-sage-soft active:scale-95"
          aria-label="Previous day"
        >
          <ChevronLeft className="size-5" />
        </button>
        {/* The visible label is a real date input underneath, so tapping it opens the native picker. */}
        <label className="relative flex min-h-11 flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl bg-cream px-2 text-center transition hover:bg-sage-soft">
          <span className="text-[15px] leading-tight font-extrabold">{relativeLabel(day, today)}</span>
          <span className="text-xs font-semibold text-muted">{formatDay(day, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <input
            type="date"
            value={day}
            onChange={(e) => isDayString(e.target.value) && onDayChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Pick a date"
          />
        </label>
        <button
          onClick={() => onDayChange(addDays(day, 1))}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-cream transition hover:bg-sage-soft active:scale-95"
          aria-label="Next day"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <ul className="flex flex-1 flex-col gap-1.5">
        {HABITS.map((h) => {
          const checked = Boolean(log?.[h.key]);
          const Icon = h.icon;
          const isChallenge = h.key === 'challenge';
          return (
            <li key={h.key} className="flex-1">
              <button
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(h.key, !checked)}
                className={`flex h-full min-h-[44px] w-full items-center gap-3 rounded-2xl border-2 px-3 text-left transition active:scale-[0.98] ${
                  checked
                    ? `${h.soft} ${h.ring}`
                    : isChallenge
                      ? 'border-dashed border-butter-mid bg-butter-soft/60 hover:bg-butter-soft'
                      : 'border-transparent bg-cream hover:bg-white'
                }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${checked ? 'bg-white/80' : h.soft} ${h.deep}`}>
                  {isChallenge ? <span className="text-lg leading-none">{challenge.emoji}</span> : <Icon className="size-[18px]" strokeWidth={2.4} />}
                </span>
                {isChallenge ? (
                  <span className="min-w-0 flex-1">
                    <span className={`flex items-center gap-1 text-[10px] font-extrabold tracking-[0.1em] uppercase ${h.deep}`}>
                      <Icon className="size-3" strokeWidth={2.8} /> Daily challenge
                    </span>
                    <span className="line-clamp-2 text-[15px] leading-tight font-extrabold">{challenge.text}</span>
                  </span>
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-tight font-extrabold">{h.label}</span>
                    <span className="block truncate text-xs font-semibold text-muted">{h.description}</span>
                  </span>
                )}
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full border-2 transition ${
                    checked ? `${h.solid} ${h.ring} text-white` : 'border-line bg-white'
                  }`}
                >
                  {checked && <Check key="c" className="animate-pop size-[18px]" strokeWidth={3.2} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-center text-xs font-bold text-muted">
        {isFuture ? 'Planning ahead? You can check things off any day.' : CHEERS[done]}
      </p>
    </Card>
  );
}
