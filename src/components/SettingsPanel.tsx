import { CalendarHeart, Download, Flag, LogOut, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useData } from '../data/context';
import { addDays, diffDays, formatShort, isDayString } from '../lib/dates';
import { countCompletedDays } from '../lib/stats';
import { parseBackup, type BackupFile } from '../lib/backup';
import { HABITS } from '../lib/habits';
import type { Countdown, Quest } from '../lib/types';

export type SettingsTab = 'quest' | 'countdowns' | 'data';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'quest', label: 'Quests' },
  { id: 'countdowns', label: 'Countdowns' },
  { id: 'data', label: 'Data & account' },
];

export function SettingsPanel({
  tab,
  onTab,
  onClose,
  today,
  email,
  onSignOut,
}: {
  tab: SettingsTab;
  onTab: (t: SettingsTab) => void;
  onClose: () => void;
  today: string;
  email: string | null;
  onSignOut: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    dialog.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-float-in flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl outline-none sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 pt-4 pb-3">
          <h2 className="text-lg font-extrabold">Settings</h2>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-cream" aria-label="Close settings">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-5 pt-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
              className={`btn shrink-0 ${tab === t.id ? 'bg-ink text-white' : 'bg-cream text-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {tab === 'quest' && <QuestSettings today={today} />}
          {tab === 'countdowns' && <CountdownSettings />}
          {tab === 'data' && <DataSettings email={email} onSignOut={onSignOut} />}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <section className="mb-6">
      <h3 className="text-[15px] font-extrabold">{title}</h3>
      {hint && <p className="mb-3 text-sm text-muted">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-2 rounded-xl bg-peach-soft px-3 py-2 text-sm font-bold text-peach-deep">
      {error}
    </p>
  );
}

/** Runs an async action with busy + error state. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

/* ───────────────────────── quests ───────────────────────── */

function QuestForm({
  initial,
  submitLabel,
  onSubmit,
  extendOptions,
}: {
  initial: { name: string; start_date: string; end_date: string };
  submitLabel: string;
  onSubmit: (q: { name: string; start_date: string; end_date: string }) => Promise<void>;
  /** Quick "+N days" buttons that push the end date out. */
  extendOptions?: number[];
}) {
  const [name, setName] = useState(initial.name);
  const [start, setStart] = useState(initial.start_date);
  const [end, setEnd] = useState(initial.end_date);
  const { busy, error, setError, run } = useAction();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(initial.name);
    setStart(initial.start_date);
    setEnd(initial.end_date);
  }, [initial.name, initial.start_date, initial.end_date]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    if (!name.trim()) return setError('Give your quest a name.');
    if (!isDayString(start) || !isDayString(end)) return setError('Pick a start and end date.');
    if (end < start) return setError('The end date must be on or after the start date.');
    if (await run(() => onSubmit({ name: name.trim(), start_date: start, end_date: end }))) setSaved(true);
  };

  const length = isDayString(start) && isDayString(end) && end >= start ? diffDays(start, end) + 1 : null;

  return (
    <form onSubmit={submit} className="rounded-2xl bg-cream p-4">
      <label className="label" htmlFor="quest-name">Name</label>
      <input id="quest-name" className="field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="quest-start">Starts</label>
          <input id="quest-start" type="date" className="field" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="quest-end">Ends</label>
          <input id="quest-end" type="date" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      {extendOptions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {extendOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => isDayString(end) && setEnd(addDays(end, n))}
              className="btn !min-h-9 bg-white text-sage-deep"
            >
              <Plus className="size-4" /> {n} days
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn bg-sage-deep text-white">
          {busy ? 'Saving…' : submitLabel}
        </button>
        {length && <span className="text-sm font-semibold text-muted">{length} days</span>}
        {saved && !busy && <span className="text-sm font-bold text-sage-deep">Saved ✓</span>}
      </div>
      <ErrorText error={error} />
    </form>
  );
}

function QuestSettings({ today }: { today: string }) {
  const { activeQuest, quests, habits, createQuest, updateQuest, finishQuest, deleteQuest } = useData();
  const past = quests.filter((q) => q.status === 'finished');
  const finish = useAction();

  const newQuestDefaults = useMemo(() => ({ name: '', start_date: today, end_date: addDays(today, 20) }), [today]);

  return (
    <>
      {activeQuest ? (
        <Section title="Active quest" hint="Extending a quest keeps all your progress — habits are stored separately from quests.">
          <QuestForm
            initial={activeQuest}
            submitLabel="Save changes"
            onSubmit={(q) => updateQuest(activeQuest.id, q)}
            extendOptions={[7, 14]}
          />
          <div className="mt-3">
            <button
              disabled={finish.busy}
              onClick={() =>
                window.confirm(`Finish “${activeQuest.name}”? Your habit history stays exactly as it is.`) &&
                void finish.run(() => finishQuest(activeQuest.id))
              }
              className="btn bg-lavender-soft text-lavender-deep"
            >
              <Flag className="size-4" /> {finish.busy ? 'Finishing…' : 'Finish quest'}
            </button>
            <ErrorText error={finish.error} />
          </div>
        </Section>
      ) : (
        <Section title="Start a new quest" hint="Quests are optional. Your habits keep counting either way.">
          <QuestForm initial={newQuestDefaults} submitLabel="Start quest" onSubmit={createQuest} />
        </Section>
      )}

      <Section title="Previous quests">
        {past.length === 0 ? (
          <p className="rounded-2xl bg-cream p-4 text-sm font-semibold text-muted">Finished quests will show up here.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {past.map((q) => (
              <PastQuest key={q.id} quest={q} today={today} habits={habits} onDelete={() => deleteQuest(q.id)} />
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function PastQuest({
  quest,
  today,
  habits,
  onDelete,
}: {
  quest: Quest;
  today: string;
  habits: ReturnType<typeof useData>['habits'];
  onDelete: () => Promise<void>;
}) {
  const counts = countCompletedDays(habits.values(), today, { start: quest.start_date, end: quest.end_date });
  const del = useAction();
  return (
    <li className="rounded-2xl bg-cream p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-extrabold">{quest.name}</p>
          <p className="text-xs font-semibold text-muted">
            {formatShort(quest.start_date)} – {formatShort(quest.end_date)} · {diffDays(quest.start_date, quest.end_date) + 1} days
          </p>
        </div>
        <button
          onClick={() =>
            window.confirm(`Delete the quest “${quest.name}”? Habit records are not affected.`) && void del.run(onDelete)
          }
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-peach-soft hover:text-peach-deep"
          aria-label={`Delete ${quest.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {HABITS.map((h) => (
          <span key={h.key} className={`rounded-full px-2.5 py-1 text-xs font-bold ${h.soft} ${h.deep}`}>
            {h.label} {counts[h.key]}
          </span>
        ))}
      </div>
      <ErrorText error={del.error} />
    </li>
  );
}

/* ───────────────────────── countdowns ───────────────────────── */

function CountdownSettings() {
  const { countdowns, activeQuest, createCountdown } = useData();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const add = useAction();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return add.setError('Give it a title.');
    if (!isDayString(date)) return add.setError('Pick a date.');
    if (await add.run(() => createCountdown({ title: title.trim(), target_date: date, linked_to_quest: false }))) {
      setTitle('');
      setDate('');
    }
  };

  return (
    <>
      <Section title="Your countdowns" hint="A countdown linked to your quest follows its end date automatically.">
        <ul className="flex flex-col gap-2">
          {countdowns.map((c) => (
            <CountdownRow key={c.id} countdown={c} questName={activeQuest?.name ?? null} />
          ))}
        </ul>
      </Section>
      <Section title="Add a countdown">
        <form onSubmit={submit} className="rounded-2xl bg-cream p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
            <div>
              <label className="label" htmlFor="new-cd-title">Title</label>
              <input id="new-cd-title" className="field" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Birthday, concert…" />
            </div>
            <div>
              <label className="label" htmlFor="new-cd-date">Date</label>
              <input id="new-cd-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={add.busy} className="btn mt-4 bg-sage-deep text-white">
            <CalendarHeart className="size-4" /> {add.busy ? 'Adding…' : 'Add countdown'}
          </button>
          <ErrorText error={add.error} />
        </form>
      </Section>
    </>
  );
}

function CountdownRow({ countdown, questName }: { countdown: Countdown; questName: string | null }) {
  const { updateCountdown, deleteCountdown } = useData();
  const [title, setTitle] = useState(countdown.title);
  const [date, setDate] = useState(countdown.target_date ?? '');
  const [linked, setLinked] = useState(countdown.linked_to_quest);
  const save = useAction();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTitle(countdown.title);
    setDate(countdown.target_date ?? '');
    setLinked(countdown.linked_to_quest);
  }, [countdown.title, countdown.target_date, countdown.linked_to_quest]);

  const dirty = title !== countdown.title || (date || null) !== countdown.target_date || linked !== countdown.linked_to_quest;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    if (!linked && !title.trim()) return save.setError('Give it a title.');
    if (!linked && !isDayString(date)) return save.setError('Pick a date, or link it to your quest.');
    const ok = await save.run(() =>
      updateCountdown(countdown.id, { title: title.trim(), target_date: isDayString(date) ? date : null, linked_to_quest: linked }),
    );
    if (ok) setSaved(true);
  };

  return (
    <li className="rounded-2xl bg-cream p-3.5">
      <form onSubmit={submit}>
        <div className="grid gap-2 sm:grid-cols-[1fr_11rem]">
          <input
            className="field"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={linked ? `Uses quest name${questName ? ` (${questName})` : ''}` : 'Title'}
            aria-label="Countdown title"
          />
          {linked ? (
            <div className="field flex items-center text-sm font-semibold text-muted">Quest end date</div>
          ) : (
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Countdown date" />
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <label className="mr-auto inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-bold text-muted">
            <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} className="size-4 accent-[var(--color-sage-deep)]" />
            Linked to active quest
          </label>
          {saved && !dirty && <span className="text-sm font-bold text-sage-deep">Saved ✓</span>}
          <button type="submit" disabled={!dirty || save.busy} className="btn !min-h-9 bg-sage-deep text-white">
            {save.busy ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() =>
              window.confirm(`Remove the countdown “${countdown.title || questName || 'Quest'}”?`) &&
              void save.run(() => deleteCountdown(countdown.id))
            }
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-peach-soft hover:text-peach-deep"
            aria-label="Remove countdown"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <ErrorText error={save.error} />
      </form>
    </li>
  );
}

/* ───────────────────────── data & account ───────────────────────── */

function DataSettings({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  const { exportData, importData } = useData();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [done, setDone] = useState(false);
  const imp = useAction();

  const download = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quest-hq-backup-${data.exported_at.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const onFile = async (file: File | undefined) => {
    setPending(null);
    setDone(false);
    imp.setError(null);
    if (!file) return;
    try {
      const parsed = parseBackup(JSON.parse(await file.text()));
      if (!parsed.ok) imp.setError(parsed.error);
      else setPending(parsed.data);
    } catch {
      imp.setError('That file isn’t valid JSON.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!pending) return;
    if (!window.confirm('Replace ALL your current habits, quests, countdowns and sticky note with this backup? This can’t be undone.')) return;
    if (await imp.run(() => importData(pending))) {
      setPending(null);
      setDone(true);
    }
  };

  return (
    <>
      <Section title="Export" hint="Download your habit records, quests, countdowns and sticky note as a JSON file.">
        <button onClick={download} className="btn bg-sage-deep text-white">
          <Download className="size-4" /> Download backup
        </button>
      </Section>
      <Section title="Import" hint="Restore from a Quest HQ backup. This replaces your current data (your photo isn’t touched).">
        <button onClick={() => fileInput.current?.click()} className="btn bg-cream text-ink">
          <Upload className="size-4" /> Choose backup file
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        {pending && (
          <div className="mt-3 rounded-2xl bg-butter-soft p-4">
            <p className="font-extrabold">Ready to import</p>
            <ul className="mt-1 text-sm font-semibold text-muted">
              <li>{pending.habit_logs.length} days of habit records</li>
              <li>{pending.quests.length} quests</li>
              <li>{pending.countdowns.length} countdowns</li>
              <li>{pending.sticky_note ? 'A sticky note' : 'An empty sticky note'}</li>
              {pending.exported_at && <li>Exported {new Date(pending.exported_at).toLocaleString()}</li>}
            </ul>
            <div className="mt-3 flex gap-2">
              <button onClick={confirmImport} disabled={imp.busy} className="btn bg-peach-deep text-white">
                {imp.busy ? 'Importing…' : 'Replace my data'}
              </button>
              <button onClick={() => setPending(null)} className="btn bg-white">Cancel</button>
            </div>
          </div>
        )}
        {done && <p className="mt-3 text-sm font-bold text-sage-deep">Imported ✓</p>}
        <ErrorText error={imp.error} />
      </Section>
      <Section title="Account">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream p-4">
          <span className="text-sm font-semibold text-muted">
            Signed in as <span className="font-extrabold text-ink">{email ?? 'you'}</span>
          </span>
          <button onClick={onSignOut} className="btn bg-white text-ink">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </Section>
    </>
  );
}
