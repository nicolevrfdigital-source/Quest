// Dev-only preview: the real dashboard on in-memory sample data, for checking
// layout and design without a Supabase project. Never included in production builds.
import { useMemo, useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { DataContext, type DataContextValue } from '../data/context';
import { buildBackup } from '../lib/backup';
import { addDays, todayString } from '../lib/dates';
import { INITIAL_COUNTDOWNS, INITIAL_QUEST } from '../lib/initial';
import type { Countdown, HabitLog, Quest, Settings } from '../lib/types';

const id = () => Math.random().toString(36).slice(2);

function sampleHabits(): Map<string, HabitLog> {
  const map = new Map<string, HabitLog>();
  const today = todayString();
  for (let i = 1; i < 30; i++) {
    const day = addDays(today, -i);
    map.set(day, { day, nourish: i % 3 !== 0, move: i % 2 === 0, water: i % 4 !== 1, challenge: i % 3 === 2 || i < 4 });
  }
  return map;
}

export default function Demo() {
  const [habits, setHabits] = useState(sampleHabits);
  const [quests, setQuests] = useState<Quest[]>([
    { id: id(), ...INITIAL_QUEST, status: 'active', finished_at: null, created_at: '' },
  ]);
  const [countdowns, setCountdowns] = useState<Countdown[]>(INITIAL_COUNTDOWNS.map((c) => ({ id: id(), ...c })));
  const [settings, setSettings] = useState<Settings>({
    sticky_note: 'Pack the good walking shoes 👟\nCall grandma on Sunday ♡',
    photo_path: null,
  });

  const value = useMemo<DataContextValue>(
    () => ({
      userId: 'demo',
      loading: false,
      loadError: null,
      reload: async () => {},
      habits,
      quests,
      activeQuest: quests.find((q) => q.status === 'active') ?? null,
      countdowns,
      settings,
      stickyNote: settings.sticky_note,
      notePending: false,
      sync: { state: 'saved', pending: 0 },
      retrySync: () => {},
      setHabit: (day, key, v) =>
        setHabits((m) => new Map(m).set(day, { ...(m.get(day) ?? { day, nourish: false, move: false, water: false, challenge: false }), [key]: v })),
      setNote: (text) => setSettings((s) => ({ ...s, sticky_note: text })),
      createQuest: async (q) => setQuests((qs) => [{ id: id(), ...q, status: 'active', finished_at: null, created_at: '' }, ...qs]),
      updateQuest: async (qid, q) => setQuests((qs) => qs.map((x) => (x.id === qid ? { ...x, ...q } : x))),
      finishQuest: async (qid) => setQuests((qs) => qs.map((x) => (x.id === qid ? { ...x, status: 'finished' } : x))),
      deleteQuest: async (qid) => setQuests((qs) => qs.filter((x) => x.id !== qid)),
      createCountdown: async (c) => setCountdowns((cs) => [...cs, { id: id(), sort_order: cs.length, ...c }]),
      updateCountdown: async (cid, c) => setCountdowns((cs) => cs.map((x) => (x.id === cid ? { ...x, ...c } : x))),
      deleteCountdown: async (cid) => setCountdowns((cs) => cs.filter((x) => x.id !== cid)),
      uploadPhoto: async (file) => setSettings((s) => ({ ...s, photo_path: URL.createObjectURL(file) })),
      removePhoto: async () => setSettings((s) => ({ ...s, photo_path: null })),
      exportData: () => buildBackup({ habits: habits.values(), quests, countdowns, stickyNote: settings.sticky_note }),
      importData: async () => {},
    }),
    [habits, quests, countdowns, settings],
  );

  return (
    <DataContext.Provider value={value}>
      <Dashboard email="demo@example.com" onSignOut={() => {}} />
    </DataContext.Provider>
  );
}
