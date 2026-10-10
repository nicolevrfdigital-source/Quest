import { Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { useData } from '../data/context';
import { countCompletedDays } from '../lib/stats';
import { HABITS } from '../lib/habits';
import { Card, CardTitle } from './Card';

export function HabitCounters({ today }: { today: string }) {
  const { habits, activeQuest } = useData();
  const total = useMemo(() => countCompletedDays(habits.values(), today), [habits, today]);
  // Until the quest has started there's nothing to count in it yet, so show all-time totals.
  const quest = activeQuest && activeQuest.start_date <= today ? activeQuest : null;
  const inQuest = useMemo(
    () =>
      quest
        ? countCompletedDays(habits.values(), today, { start: quest.start_date, end: quest.end_date })
        : null,
    [habits, today, quest],
  );

  return (
    <Card className="flex flex-col p-4" tape="bg-peach">
      <CardTitle icon={Trophy} iconClass="text-peach-deep" sub="days completed">
        Little wins
      </CardTitle>
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        {HABITS.map((h) => {
          const Icon = h.icon;
          return (
            <div key={h.key} className={`flex flex-col items-center justify-between rounded-2xl px-1 py-3 text-center ${h.soft}`}>
              <span className={`flex items-center gap-1 text-[12px] font-extrabold ${h.deep}`}>
                <Icon className="size-3.5" strokeWidth={2.6} /> {h.label}
              </span>
              <span className="my-1 flex flex-col">
                <span className="text-[36px] leading-none font-extrabold tracking-tight">{inQuest ? inQuest[h.key] : total[h.key]}</span>
                <span className="mt-1 text-[11px] font-bold text-muted">{inQuest ? 'this quest' : 'all time'}</span>
              </span>
              {inQuest && (
                <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[11px] font-bold text-muted">
                  <span className="text-ink">{total[h.key]}</span> all time
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs font-bold text-muted">Every day you show up adds one. Nothing ever resets.</p>
    </Card>
  );
}
