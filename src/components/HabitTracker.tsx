import { Check, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { useData } from '../data/context';
import { addDays, diffDays, formatDay, isDayString } from '../lib/dates';
import { HABITS } from '../lib/habits';
import { Card, CardTitle } from './Card';

function relativeLabel(day: string, today: string): string {
  const d = diffDays(today, day);
  if (d === 0) return 'Today';
  if (d === -1) return 'Yesterday';
  if (d === 1) return 'Tomorrow';
  return formatDay(day, { weekday: 'long' });
}

const CHEERS = ['Fresh page, fresh start ✿', 'One down — lovely start!', 'Two out of three, look at you!', 'All three! What a day ♡'];

export function HabitTracker({ day, today, onDayChange }: { day: string; today: string; onDayChange: (day: string) => void }) {
  const { habits, setHabit } = useData();
  const log = habits.get(day);
  const done = HABITS.filter((h) => log?.[h.key]).length;
  const isFuture = day > today;

  return (
    <Card className="flex flex-col p-4" tape="bg-sage">
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

      <ul className="flex flex-1 flex-col gap-2">
        {HABITS.map((h) => {
          const checked = Boolean(log?.[h.key]);
          const Icon = h.icon;
          return (
            <li key={h.key} className="flex-1">
              <button
                role="checkbox"
                aria-checked={checked}
                onClick={() => setHabit(day, h.key, !checked)}
                className={`flex h-full min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 px-3 text-left transition active:scale-[0.98] ${
                  checked ? `${h.soft} ${h.ring}` : 'border-transparent bg-cream hover:bg-white'
                }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${checked ? 'bg-white/80' : h.soft} ${h.deep}`}>
                  <Icon className="size-[18px]" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-tight font-extrabold">{h.label}</span>
                  <span className="block truncate text-xs font-semibold text-muted">{h.description}</span>
                </span>
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
      <p className="mt-2 text-center text-xs font-bold text-muted">
        {isFuture ? 'Planning ahead? You can check things off any day.' : CHEERS[done]}
      </p>
    </Card>
  );
}
