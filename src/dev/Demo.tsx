// Dev-only preview: the real dashboard on in-memory sample data, for checking
// layout and design without a Supabase project. Never included in production builds.
import { useMemo, useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { DataContext, type DataContextValue } from '../data/context';
import { buildBackup } from '../lib/backup';
import { addDays, todayString } from '../lib/dates';
import { INITIAL_COUNTDOWNS, INITIAL_QUEST } from '../lib/initial';
import type { Countdown, DailyHealthRow, HabitLog, Mood, Quest, Settings } from '../lib/types';

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

function sampleHealth(): DailyHealthRow[] {
  const rows: DailyHealthRow[] = [];
  const today = todayString();
  for (let i = 0; i < 30; i++) {
    const day = addDays(today, -i);
    const wave = Math.sin(i * 1.7);
    rows.push({ day, kind: 'steps', origin: 'health_connect', value: Math.round((i === 0 ? 4200 : 8200) + wave * 3200) });
    rows.push({ day, kind: 'calories_burned', origin: 'com.fitbit.FitbitMobile', value: Math.round(1850 + wave * 260) });
    rows.push({ day, kind: 'calories_burned', origin: 'com.google.android.apps.fitness', value: Math.round(1500 + wave * 200) });
    if (i > 0) rows.push({ day, kind: 'calories_consumed', origin: 'com.cronometer.android.gold', value: i === 1 ? 820 : Math.round(1480 + Math.cos(i * 1.3) * 220) });
    if (i % 3 === 0) rows.push({ day, kind: 'weight', origin: 'com.fitbit.FitbitMobile', value: 68 + i * 0.06 });
  }
  return rows;
}

function sampleMoods(): Map<string, Mood> {
  const map = new Map<string, Mood>();
  const today = todayString();
  for (let i = 1; i < 30; i++) map.set(addDays(today, -i), (((i * 7) % 5) + 1) as Mood);
  return map;
}

export default function Demo() {
  const [health, setHealth] = useState(sampleHealth);
  const [moods, setMoods] = useState(sampleMoods);
  const [habits, setHabits] = useState(sampleHabits);
  const [quests, setQuests] = useState<Quest[]>([
    { id: id(), ...INITIAL_QUEST, status: 'active', finished_at: null, created_at: '' },
  ]);
  const [countdowns, setCountdowns] = useState<Countdown[]>(INITIAL_COUNTDOWNS.map((c) => ({ id: id(), ...c })));
  const [settings, setSettings] = useState<Settings>({
    sticky_note: 'Pack the good walking shoes 👟\nCall grandma on Sunday ♡',
    photo_path: null,
    health_sources: {},
  });

  const value = useMemo<DataContextValue>(
    () => ({
      userId: 'demo',
      loading: false,
      loadError: null,
      reload: async () => {},
      habits,
      health,
      moods,
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
      setMood: (day, mood) =>
        setMoods((m) => {
          const next = new Map(m);
          if (mood === null) next.delete(day);
          else next.set(day, mood);
          return next;
        }),
      setManualHealth: async (day, kind, value) =>
        setHealth((rows) => [
          ...rows.filter((x) => !(x.day === day && x.kind === kind && x.origin === 'manual')),
          ...(value === null ? [] : [{ day, kind, origin: 'manual', value }]),
        ]),
      setHealthSources: async (health_sources) => setSettings((s) => ({ ...s, health_sources })),
      createHealthToken: async () => 'qhq_demo_token_not_real',
      healthToken: null,
      createQuest: async (q) => setQuests((qs) => [{ id: id(), ...q, status: 'active', finished_at: null, created_at: '' }, ...qs]),
      updateQuest: async (qid, q) => setQuests((qs) => qs.map((x) => (x.id === qid ? { ...x, ...q } : x))),
      finishQuest: async (qid) => setQuests((qs) => qs.map((x) => (x.id === qid ? { ...x, status: 'finished' } : x))),
      deleteQuest: async (qid) => setQuests((qs) => qs.filter((x) => x.id !== qid)),
      createCountdown: async (c) => setCountdowns((cs) => [...cs, { id: id(), sort_order: cs.length, ...c }]),
      updateCountdown: async (cid, c) => setCountdowns((cs) => cs.map((x) => (x.id === cid ? { ...x, ...c } : x))),
      deleteCountdown: async (cid) => setCountdowns((cs) => cs.filter((x) => x.id !== cid)),
      uploadPhoto: async (file) => setSettings((s) => ({ ...s, photo_path: URL.createObjectURL(file) })),
      removePhoto: async () => setSettings((s) => ({ ...s, photo_path: null })),
      exportData: () => buildBackup({ habits: habits.values(), quests, countdowns, moods, stickyNote: settings.sticky_note }),
      importData: async () => {},
    }),
    [habits, health, moods, quests, countdowns, settings],
  );

  return (
    <DataContext.Provider value={value}>
      <Dashboard email="demo@example.com" onSignOut={() => {}} />
    </DataContext.Provider>
  );
}
