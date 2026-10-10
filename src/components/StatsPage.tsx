import { CalendarDays, Check, ChevronLeft, ChevronRight, Flag, Footprints, Flame, Pencil, Scale, Sparkles, Trophy, Utensils, X, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useData } from '../data/context';
import { addDays, diffDays, formatDay, formatShort, isDayString, minDay } from '../lib/dates';
import {
  MANUAL,
  INCOMPLETE_FOOD_LOG,
  MAX_DAY_STARS,
  buildHealthByDay,
  burnedStars,
  consumedStars,
  dayStars,
  hasScore,
  kgToLb,
  lbToKg,
  stepStars,
  summarizeRange,
  type DayHealth,
} from '../lib/health';
import type { HealthKind, Mood } from '../lib/types';
import { Card, CardTitle } from './Card';
import { MOODS, MoodFace, StarRow } from './moods';

interface Range {
  id: string;
  label: string;
  start: string;
  end: string;
  isQuest: boolean;
}

const fmt = (n: number, digits = 0) => n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });

function useRanges(today: string): Range[] {
  const { quests } = useData();
  return useMemo(() => {
    const qs = [...quests]
      .filter((q) => q.start_date <= today)
      .sort((a, b) => (a.status === b.status ? b.start_date.localeCompare(a.start_date) : a.status === 'active' ? -1 : 1))
      .map((q) => ({ id: q.id, label: q.name, start: q.start_date, end: q.end_date, isQuest: true }));
    return [
      ...qs,
      { id: 'last7', label: 'Last 7 days', start: addDays(today, -6), end: today, isQuest: false },
      { id: 'last30', label: 'Last 30 days', start: addDays(today, -29), end: today, isQuest: false },
    ];
  }, [quests, today]);
}

/**
 * The second screen: daily numbers from the phone, a 0–9 star score per day,
 * mood, and how a quest (or the last few weeks) is going.
 */
export function StatsPage({ today, header }: { today: string; header: ReactNode }) {
  const { health, moods, settings } = useData();
  const ranges = useRanges(today);
  const [rangeId, setRangeId] = useState(ranges[0].id);
  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0];
  const [day, setDay] = useState(today);

  const byDay = useMemo(() => buildHealthByDay(health, settings.health_sources), [health, settings.health_sources]);
  const summary = useMemo(() => summarizeRange(range.start, range.end, today, byDay, moods), [range, today, byDay, moods]);

  return (
    <div className="grid grid-cols-1 gap-4 md:min-h-[calc(100dvh-2rem)] md:grid-cols-2 md:grid-rows-[auto_auto_1fr] md:gap-3 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-3.5">
      <div className="md:col-span-2 lg:col-span-3">{header}</div>
      <div className="min-w-0 md:col-span-2 lg:col-span-9">
        <RangeSummaryCard ranges={ranges} range={range} onRange={setRangeId} summary={summary} today={today} />
      </div>
      <div className="grid min-w-0 lg:col-span-5">
        <DayCard day={day} today={today} onDayChange={setDay} health={byDay.get(day)} byDay={byDay} mood={moods.get(day)} />
      </div>
      <div className="grid min-w-0 lg:col-span-7">
        <CalendarCard today={today} byDay={byDay} moods={moods} selected={day} onSelect={setDay} />
      </div>
    </div>
  );
}

/* ───────────────────────── range summary ───────────────────────── */

function RangeSummaryCard({
  ranges,
  range,
  onRange,
  summary,
  today,
}: {
  ranges: Range[];
  range: Range;
  onRange: (id: string) => void;
  summary: ReturnType<typeof summarizeRange>;
  today: string;
}) {
  const total = diffDays(range.start, range.end) + 1;
  const weightChange =
    summary.firstWeightKg !== null && summary.lastWeightKg !== null ? kgToLb(summary.lastWeightKg) - kgToLb(summary.firstWeightKg) : null;
  const topMood = (Object.entries(summary.moods) as [string, number][]).reduce<[Mood | null, number]>(
    (best, [m, n]) => (n > best[1] ? [Number(m) as Mood, n] : best),
    [null, 0],
  )[0];

  return (
    <Card className="flex h-full flex-col justify-between gap-3 p-4 lg:flex-row lg:items-center" tape="bg-butter">
      <div className="min-w-0 lg:w-[30%]">
        <label className="eyebrow mb-1 block text-butter-deep" htmlFor="stats-range">
          Looking at
        </label>
        <select
          id="stats-range"
          value={range.id}
          onChange={(e) => onRange(e.target.value)}
          className="field !min-h-10 !rounded-full !border-butter-mid bg-butter-soft !px-3 font-extrabold"
        >
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 truncate text-xs font-semibold text-muted">
          {range.isQuest ? `Day ${Math.min(summary.days.length, total)} of ${total} · ` : ''}
          {formatShort(range.start)} – {formatShort(minDay(range.end, range.isQuest ? range.end : today))}
        </p>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryChip tone="bg-butter-soft" label="avg per day">
          <span className="text-butter-deep">★</span> {summary.avgStars === null ? '—' : fmt(summary.avgStars, 1)}
          <span className="text-sm text-muted">/{MAX_DAY_STARS}</span>
        </SummaryChip>
        <SummaryChip tone="bg-peach-soft" label={summary.avgSteps === null ? 'steps' : `steps · ${fmt(summary.avgSteps)}/day`}>
          {fmt(summary.totalSteps)}
        </SummaryChip>
        <SummaryChip tone="bg-sage-soft" label="weight change">
          {weightChange === null ? '—' : `${weightChange > 0 ? '+' : weightChange < 0 ? '−' : '±'}${fmt(Math.abs(weightChange), 1)}`}
          {weightChange !== null && <span className="text-sm text-muted"> lb</span>}
        </SummaryChip>
        <SummaryChip tone="bg-lavender-soft" label={topMood ? `mostly ${MOODS[topMood - 1].label.toLowerCase()}` : 'mood'}>
          {topMood ? <MoodFace mood={topMood} className="size-8" /> : '—'}
        </SummaryChip>
      </div>
    </Card>
  );
}

function SummaryChip({ tone, label, children }: { tone: string; label: string; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-center ${tone}`}>
      <span className="flex h-8 items-center gap-0.5 text-[24px] leading-none font-extrabold tracking-tight">{children}</span>
      <span className="mt-1 truncate text-[11px] font-bold text-muted">{label}</span>
    </div>
  );
}

/* ───────────────────────── one day ───────────────────────── */

function relativeLabel(day: string, today: string): string {
  const d = diffDays(today, day);
  if (d === 0) return 'Today';
  if (d === -1) return 'Yesterday';
  return formatDay(day, { weekday: 'long' });
}

const DAY_CHEERS = ['Every day counts ✿', 'A gentle day ✿', 'Nice going!', 'Solid day ✨', 'What a day! ♡'];

function DayCard({
  day,
  today,
  onDayChange,
  health,
  byDay,
  mood,
}: {
  day: string;
  today: string;
  onDayChange: (d: string) => void;
  health: DayHealth | undefined;
  byDay: Map<string, DayHealth>;
  mood: Mood | undefined;
}) {
  const { health: rows, setMood } = useData();
  const stars = dayStars(health);
  const manual = (kind: HealthKind) => rows.some((r) => r.day === day && r.kind === kind && r.origin === MANUAL);

  // The most recent weigh-in before this day, for the little change note.
  const prevWeight = useMemo(() => {
    let best: [string, number] | null = null;
    for (const [d, h] of byDay) if (d < day && h.weightKg !== undefined && (!best || d > best[0])) best = [d, h.weightKg];
    return best?.[1];
  }, [byDay, day]);
  const weightDelta = health?.weightKg !== undefined && prevWeight !== undefined ? kgToLb(health.weightKg) - kgToLb(prevWeight) : null;

  return (
    <Card className="flex min-w-0 flex-col p-4" tape="bg-peach">
      <CardTitle
        icon={CalendarDays}
        iconClass="text-peach-deep"
        right={
          day !== today && (
            <button onClick={() => onDayChange(today)} className="btn !min-h-8 bg-peach-soft !px-3 !text-xs text-peach-deep">
              Back to today
            </button>
          )
        }
      >
        My day
      </CardTitle>

      <div className="mb-2.5 flex items-center gap-2">
        <button
          onClick={() => onDayChange(addDays(day, -1))}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-cream transition hover:bg-peach-soft active:scale-95"
          aria-label="Previous day"
        >
          <ChevronLeft className="size-5" />
        </button>
        <label className="relative flex min-h-11 flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl bg-cream px-2 text-center transition hover:bg-peach-soft">
          <span className="text-[15px] leading-tight font-extrabold">{relativeLabel(day, today)}</span>
          <span className="text-xs font-semibold text-muted">{formatDay(day, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <input
            type="date"
            value={day}
            max={today}
            onChange={(e) => isDayString(e.target.value) && e.target.value <= today && onDayChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Pick a date"
          />
        </label>
        <button
          onClick={() => onDayChange(addDays(day, 1))}
          disabled={day >= today}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-cream transition hover:bg-peach-soft active:scale-95 disabled:opacity-40"
          aria-label="Next day"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-2">
        <MetricTile
          key={`${day}-steps`}
          day={day}
          kind="steps"
          icon={Footprints}
          label="Steps"
          tone="bg-sage-soft"
          iconTone="text-sage-deep"
          value={health?.steps}
          display={(v) => fmt(v)}
          unit="steps"
          stars={stepStars(health?.steps)}
          manual={manual('steps')}
        />
        <MetricTile
          key={`${day}-burned`}
          day={day}
          kind="calories_burned"
          icon={Flame}
          label="Burned"
          tone="bg-peach-soft"
          iconTone="text-peach-deep"
          value={health?.burned}
          display={(v) => fmt(v)}
          unit="kcal"
          stars={burnedStars(health?.burned)}
          manual={manual('calories_burned')}
        />
        <MetricTile
          key={`${day}-consumed`}
          day={day}
          kind="calories_consumed"
          icon={Utensils}
          label="Eaten"
          tone="bg-butter-soft"
          iconTone="text-butter-deep"
          value={health?.consumed}
          display={(v) => fmt(v)}
          unit="kcal"
          stars={consumedStars(health?.consumed)}
          note={health?.consumed !== undefined && health.consumed < INCOMPLETE_FOOD_LOG ? 'All meals logged?' : undefined}
          manual={manual('calories_consumed')}
        />
        <MetricTile
          key={`${day}-weight`}
          day={day}
          kind="weight"
          icon={Scale}
          label="Weight"
          tone="bg-lavender-soft"
          iconTone="text-lavender-deep"
          value={health?.weightKg === undefined ? undefined : kgToLb(health.weightKg)}
          display={(v) => fmt(v, 1)}
          unit="lb"
          note={
            weightDelta === null
              ? undefined
              : `${weightDelta > 0 ? '+' : weightDelta < 0 ? '−' : '±'}${fmt(Math.abs(weightDelta), 1)} since last`
          }
          manual={manual('weight')}
          toStored={lbToKg}
        />
      </div>

      <div className="mt-2.5 rounded-2xl bg-cream px-3 py-2">
        <p className="mb-1 text-center text-xs font-bold text-muted">How did today feel?</p>
        <div className="flex justify-between gap-1" role="radiogroup" aria-label="Mood">
          {MOODS.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={mood === m.value}
              aria-label={m.label}
              onClick={() => setMood(day, mood === m.value ? null : m.value)}
              className={`flex flex-1 flex-col items-center rounded-xl py-1 transition active:scale-95 ${
                mood === m.value ? 'bg-white shadow-card' : mood ? 'opacity-45 hover:opacity-80' : 'hover:bg-white/70'
              }`}
            >
              <MoodFace mood={m.value} className={`size-9 transition ${mood === m.value ? 'animate-pop' : ''}`} />
              <span className="text-[10px] font-bold text-muted">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 flex items-center justify-center gap-2 text-center text-sm font-extrabold">
        <span className="text-butter-deep">★</span>
        {hasScore(health) ? (
          <>
            {stars.total} / {MAX_DAY_STARS}
            <span className="text-xs font-bold text-muted">{DAY_CHEERS[Math.min(4, Math.floor((stars.total / MAX_DAY_STARS) * 5))]}</span>
          </>
        ) : (
          <span className="text-xs font-bold text-muted">No numbers yet for this day</span>
        )}
      </p>
    </Card>
  );
}

function MetricTile({
  day,
  kind,
  icon: Icon,
  label,
  tone,
  iconTone,
  value,
  display,
  unit,
  stars,
  note,
  manual,
  toStored = (v) => v,
}: {
  day: string;
  kind: HealthKind;
  icon: LucideIcon;
  label: string;
  tone: string;
  iconTone: string;
  value: number | undefined;
  display: (v: number) => string;
  unit: string;
  stars?: number | null;
  note?: string;
  manual: boolean;
  /** Converts what's typed (e.g. lb) into what's stored (kg). */
  toStored?: (v: number) => number;
}) {
  const { setManualHealth } = useData();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) setText(value === undefined ? '' : String(Math.round(value * 10) / 10));
  }, [editing, value]);

  const save = async (next: number | null) => {
    setBusy(true);
    setError(null);
    try {
      await setManualHealth(day, kind, next === null ? null : toStored(next));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save');
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(text.replace(',', '.'));
    if (!text.trim() || !Number.isFinite(n) || n < 0) return setError('Enter a number');
    void save(n);
  };

  if (editing) {
    return (
      <form onSubmit={submit} className={`flex min-h-[92px] flex-col justify-center gap-1.5 rounded-2xl p-2.5 ${tone}`}>
        <span className={`flex items-center gap-1 text-xs font-extrabold ${iconTone}`}>
          <Icon className="size-3.5" strokeWidth={2.6} /> {label} ({unit})
        </span>
        <div className="flex gap-1.5">
          <input
            autoFocus
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="field !min-h-9 min-w-0 flex-1 !px-2 font-extrabold"
            aria-label={`${label} in ${unit}`}
          />
          <button type="submit" disabled={busy} className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-white" aria-label="Save">
            <Check className="size-4" strokeWidth={3} />
          </button>
          <button type="button" onClick={() => setEditing(false)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white" aria-label="Cancel">
            <X className="size-4" />
          </button>
        </div>
        {error ? (
          <span className="text-[11px] font-bold text-peach-deep">{error}</span>
        ) : (
          manual && (
            <button type="button" onClick={() => void save(null)} className="self-start text-[11px] font-bold text-muted underline">
              Use the synced number instead
            </button>
          )
        )}
      </form>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group relative flex min-h-[92px] flex-col justify-between rounded-2xl p-2.5 text-left transition active:scale-[0.98] ${tone}`}
      aria-label={`${label}: ${value === undefined ? 'no data' : `${display(value)} ${unit}`}. Tap to edit`}
    >
      <span className="flex w-full items-center justify-between gap-1">
        <span className={`flex items-center gap-1 text-xs font-extrabold ${iconTone}`}>
          <Icon className="size-3.5" strokeWidth={2.6} /> {label}
        </span>
        {manual ? (
          <span className="rounded-full bg-white/80 px-1.5 text-[10px] font-bold text-muted">typed</span>
        ) : (
          <Pencil className="size-3 text-muted opacity-0 transition group-hover:opacity-100" />
        )}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="text-[30px] leading-none font-extrabold tracking-tight">{value === undefined ? '—' : display(value)}</span>
        {value !== undefined && <span className="text-xs font-bold text-muted">{unit}</span>}
      </span>
      {stars !== undefined ? (
        <span className="flex items-center justify-between gap-1">
          <StarRow count={stars} className="size-5" />
          {note && <span className="truncate text-[11px] font-bold text-muted">{note}</span>}
        </span>
      ) : (
        <span className="text-[11px] font-bold text-muted">{note ?? (value === undefined ? 'Tap to add' : ' ')}</span>
      )}
    </button>
  );
}

/* ───────────────────────── calendar ───────────────────────── */

function scoreTone(total: number | null): string {
  if (total === null) return 'bg-cream';
  if (total >= 8) return 'bg-sage';
  if (total >= 6) return 'bg-sage-soft';
  if (total >= 3) return 'bg-butter-soft';
  return 'bg-peach-soft';
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const monthStart = (day: string) => `${day.slice(0, 7)}-01`;
/** First day of the month `n` months after the one `start` is in. */
function shiftMonth(start: string, n: number): string {
  const d = new Date(Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

/** A whole calendar month; the arrows page back through earlier months. */
function CalendarCard({
  today,
  byDay,
  moods,
  selected,
  onSelect,
}: {
  today: string;
  byDay: Map<string, DayHealth>;
  moods: Map<string, Mood>;
  selected: string;
  onSelect: (d: string) => void;
}) {
  const [month, setMonth] = useState(() => monthStart(selected));
  // Follow the day picked in "My day" into its month.
  useEffect(() => setMonth(monthStart(selected)), [selected]);

  const days = useMemo(() => {
    const out: string[] = [];
    for (let d = month; d.slice(0, 7) === month.slice(0, 7); d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);
  const summary = useMemo(() => summarizeRange(days[0], days.at(-1)!, today, byDay, moods), [days, today, byDay, moods]);
  const isCurrentMonth = month === monthStart(today);

  // Which quests start or end on each day, for the little flag and trophy.
  const { quests } = useData();
  // Paging forward stops at this month, or at the month the last quest ends in.
  const lastMonth = quests.reduce((m, q) => (monthStart(q.end_date) > m ? monthStart(q.end_date) : m), monthStart(today));
  const questMarks = useMemo(() => {
    const marks = new Map<string, { starts: string[]; ends: string[] }>();
    const at = (d: string) => marks.get(d) ?? (marks.set(d, { starts: [], ends: [] }), marks.get(d)!);
    for (const q of quests) {
      at(q.start_date).starts.push(q.name);
      at(q.end_date).ends.push(q.name);
    }
    return marks;
  }, [quests]);
  // Monday-first offset so the grid lines up under the weekday letters.
  const lead = (new Date(`${days[0]}T12:00:00`).getDay() + 6) % 7;
  const rows = Math.ceil((lead + days.length) / 7);

  const weights = summary.days.map((d) => byDay.get(d)?.weightKg).filter((w): w is number => w !== undefined);

  return (
    <Card className="flex min-w-0 flex-col p-4" tape="bg-sage">
      <CardTitle
        icon={Sparkles}
        sub={formatDay(month, { month: 'long', year: 'numeric' })}
        right={
          <span className="flex gap-1">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="grid size-9 place-items-center rounded-full bg-cream transition hover:bg-sage-soft active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              disabled={month >= lastMonth}
              className="grid size-9 place-items-center rounded-full bg-cream transition hover:bg-sage-soft active:scale-95 disabled:opacity-40"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </span>
        }
      >
        Star days
      </CardTitle>

      <div className="grid grid-cols-7 gap-1.5 pb-1 text-center text-[11px] font-extrabold text-muted">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div
        className="grid flex-1 grid-cols-7 gap-1.5"
        // Rows share the space, shrinking for long ranges but never ballooning for short ones.
        style={{ gridTemplateRows: `repeat(${rows}, minmax(2.5rem, 1fr))`, maxHeight: `${rows * 6}rem` }}
      >
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((d) => {
          const h = byDay.get(d);
          const future = d > today;
          const total = hasScore(h) ? dayStars(h).total : null;
          const mood = moods.get(d);
          const mark = questMarks.get(d);
          const markText = mark
            ? [...mark.starts.map((n) => `${n} starts`), ...mark.ends.map((n) => `${n} ends`)].join(', ')
            : '';
          return (
            <button
              key={d}
              disabled={future}
              onClick={() => onSelect(d)}
              aria-label={`${formatShort(d)}: ${total === null ? 'no data' : `${total} stars`}${mood ? `, ${MOODS[mood - 1].label}` : ''}${markText ? `, ${markText}` : ''}`}
              title={markText || undefined}
              aria-pressed={d === selected}
              className={`relative flex flex-col justify-between rounded-xl p-1.5 text-left transition active:scale-95 ${
                future ? 'border-2 border-dashed border-line bg-transparent' : scoreTone(total)
              } ${d === selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : ''}`}
            >
              <span className={`text-xs font-extrabold ${d === today ? 'rounded-full bg-ink px-1.5 text-white' : 'text-ink/70'} self-start`}>
                {Number(d.slice(8))}
              </span>
              {mood && <MoodFace mood={mood} className="absolute top-1 right-1 size-[clamp(14px,28%,24px)]" />}
              {mark && (
                <span aria-hidden className="absolute bottom-1 left-1 flex gap-0.5">
                  {mark.starts.length > 0 && (
                    <span className="grid size-6 place-items-center rounded-full bg-white text-sage-deep shadow-card ring-1 ring-sage">
                      <Flag className="size-3.5" fill="currentColor" strokeWidth={2.4} />
                    </span>
                  )}
                  {mark.ends.length > 0 && (
                    <span className="grid size-6 place-items-center rounded-full bg-white text-butter-deep shadow-card ring-1 ring-butter-mid">
                      <Trophy className="size-3.5" fill="var(--color-butter)" strokeWidth={2.4} />
                    </span>
                  )}
                </span>
              )}
              {total !== null && (
                <span className="self-end text-[12px] leading-none font-extrabold">
                  {total}
                  <span className="text-butter-deep">★</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto grid grid-cols-4 gap-2 pt-3">
        <Average label="steps / day" value={summary.avgSteps} stars={summary.avgSteps === null ? null : stepStars(summary.avgSteps)} />
        <Average label="burned / day" value={summary.avgBurned} stars={summary.avgBurned === null ? null : burnedStars(summary.avgBurned)} />
        <Average label="eaten / day" value={summary.avgConsumed} stars={summary.avgConsumed === null ? null : consumedStars(summary.avgConsumed)} />
        <div className="flex flex-col items-center justify-center rounded-2xl bg-lavender-soft px-2 py-1.5">
          <WeightSparkline weights={weights} />
          <span className="text-[11px] font-bold text-muted">
            {weights.length ? `${fmt(kgToLb(weights.at(-1)!), 1)} lb ${isCurrentMonth ? 'now' : 'at month end'}` : 'weight'}
          </span>
        </div>
      </div>
    </Card>
  );
}

function Average({ label, value, stars }: { label: string; value: number | null; stars: number | null }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-cream px-1 py-1.5 text-center">
      <span className="text-[17px] leading-tight font-extrabold">{value === null ? '—' : fmt(value)}</span>
      <StarRow count={stars} className="size-3" />
      <span className="text-[11px] font-bold text-muted">{label}</span>
    </div>
  );
}

function WeightSparkline({ weights }: { weights: number[] }) {
  if (weights.length < 2) return <Scale className="my-1 size-5 text-lavender-deep" />;
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;
  const points = weights.map((w, i) => `${(i / (weights.length - 1)) * 100},${26 - ((w - min) / span) * 22}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      <polyline points={points} fill="none" stroke="var(--color-lavender-deep)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
