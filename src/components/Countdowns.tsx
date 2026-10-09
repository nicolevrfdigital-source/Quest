import { CalendarHeart, Link2, Plus } from 'lucide-react';
import { useData } from '../data/context';
import { describeDaysLeft, resolveCountdown, type CountdownView } from '../lib/countdown';
import { formatDay } from '../lib/dates';

const TONES = [
  { card: 'bg-butter-soft', accent: 'text-butter-deep', bar: 'bg-butter', tape: 'bg-butter' },
  { card: 'bg-peach-soft', accent: 'text-peach-deep', bar: 'bg-peach', tape: 'bg-peach' },
  { card: 'bg-lavender-soft', accent: 'text-lavender-deep', bar: 'bg-lavender', tape: 'bg-lavender' },
  { card: 'bg-sage-soft', accent: 'text-sage-deep', bar: 'bg-sage', tape: 'bg-sage' },
];

export function Countdowns({ today, onEdit }: { today: string; onEdit: () => void }) {
  const { countdowns, activeQuest } = useData();
  const views = countdowns.map((c) => resolveCountdown(c, activeQuest, today));

  return (
    <section aria-label="Countdowns" className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 [scrollbar-width:none] pt-2 pb-1 lg:pt-0">
      {views.map((v, i) => (
        <CountdownCard key={v.id} view={v} tone={TONES[i % TONES.length]} onEdit={onEdit} />
      ))}
      {views.length === 0 && (
        <button onClick={onEdit} className="card flex min-h-24 flex-1 items-center justify-center gap-2 p-4 font-bold text-muted">
          <Plus className="size-5" /> Add a countdown
        </button>
      )}
    </section>
  );
}

function CountdownCard({ view, tone, onEdit }: { view: CountdownView; tone: (typeof TONES)[number]; onEdit: () => void }) {
  const { value, caption } = describeDaysLeft(view.daysLeft);
  const q = view.quest;

  let footer: string;
  if (view.linked && !view.target) footer = 'No active quest';
  else if (q && q.startsIn > 0) footer = `Starts in ${q.startsIn} ${q.startsIn === 1 ? 'day' : 'days'}`;
  else if (q && view.daysLeft !== null && view.daysLeft < 0) footer = 'Ended · extend or finish';
  else if (q) footer = `Day ${q.day} of ${q.total}`;
  else footer = view.target ? formatDay(view.target, { weekday: 'short', month: 'short', day: 'numeric' }) : '';

  return (
    <button
      onClick={onEdit}
      className={`card relative flex min-w-[150px] flex-1 snap-start flex-col justify-between overflow-visible p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] ${tone.card}`}
      aria-label={`${view.title}: ${value} ${caption}. Edit countdowns`}
    >
      <span aria-hidden className={`tape ${tone.tape} !w-14`} />
      <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
        {view.linked ? <Link2 className={`size-3.5 ${tone.accent}`} /> : <CalendarHeart className={`size-3.5 ${tone.accent}`} />}
        <span className="truncate">{view.title}</span>
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <span className={`text-[34px] leading-none font-extrabold tracking-tight ${tone.accent}`}>{value}</span>
        <span className="text-xs font-bold text-muted">{caption}</span>
      </span>
      {q && q.startsIn === 0 && (
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/70">
          <span className={`block h-full rounded-full ${tone.bar}`} style={{ width: `${(q.day / q.total) * 100}%` }} />
        </span>
      )}
      <span className="mt-1.5 text-xs font-semibold text-muted">{footer}</span>
    </button>
  );
}
