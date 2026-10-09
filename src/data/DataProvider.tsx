import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PHOTO_BUCKET, supabase } from '../lib/supabase';
import { Outbox, type PendingOp, type SyncStatus } from '../lib/outbox';
import type { Countdown, HabitKey, HabitLog, Quest, Settings } from '../lib/types';
import { INITIAL_COUNTDOWNS, INITIAL_QUEST } from '../lib/initial';
import { resizeImage } from '../lib/image';
import { buildBackup, type BackupFile } from '../lib/backup';
import { DataContext, type DataContextValue, type QuestInput, type CountdownInput } from './context';

type Table = 'habits' | 'quests' | 'countdowns' | 'settings';

const EMPTY_SETTINGS: Settings = { sticky_note: '', photo_path: null };
const PAGE = 1000;

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

async function fetchHabits(): Promise<HabitLog[]> {
  const rows: HabitLog[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = check(
      await supabase.from('habit_logs').select('day, nourish, move, water').order('day').range(from, from + PAGE - 1),
    ) as HabitLog[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

async function fetchQuests(): Promise<Quest[]> {
  return check(await supabase.from('quests').select('*').order('start_date', { ascending: false })) as Quest[];
}

async function fetchCountdowns(): Promise<Countdown[]> {
  return check(
    await supabase.from('countdowns').select('id, title, target_date, linked_to_quest, sort_order').order('sort_order').order('created_at'),
  ) as Countdown[];
}

async function fetchSettings(): Promise<Settings> {
  const row = check(await supabase.from('user_settings').select('sticky_note, photo_path').maybeSingle()) as Settings | null;
  return row ?? EMPTY_SETTINGS;
}

/** Seeds the starter quest and countdowns exactly once per account. */
async function ensureInitialData(userId: string): Promise<void> {
  // Only the device that actually creates the settings row gets a row back, so
  // two devices signing in at once can't both seed.
  const created = check(
    await supabase.from('user_settings').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true }).select('user_id'),
  ) as unknown[];
  if (!created?.length) return;
  check(await supabase.from('quests').insert({ ...INITIAL_QUEST, user_id: userId, status: 'active' }));
  check(await supabase.from('countdowns').insert(INITIAL_COUNTDOWNS.map((c) => ({ ...c, user_id: userId }))));
}

function friendlyError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('quests_one_active_per_user')) return new Error('You already have an active quest. Finish it first.');
  if (msg.includes('quests_dates_ordered')) return new Error('The end date must be on or after the start date.');
  if (/fetch|network/i.test(msg) || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return new Error('Couldn’t reach the server. Check your connection and try again.');
  }
  return err instanceof Error ? err : new Error(msg);
}

export function DataProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverHabits, setServerHabits] = useState<HabitLog[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [settings, setSettings] = useState<Settings>(EMPTY_SETTINGS);
  const [sync, setSync] = useState<SyncStatus>({ state: 'idle', pending: 0 });
  // Bumped whenever the outbox changes so pending edits re-overlay server data.
  const [outboxVersion, setOutboxVersion] = useState(0);

  const outbox = useMemo(() => {
    const send = async (op: PendingOp) => {
      if (op.kind === 'habit') {
        check(await supabase.from('habit_logs').upsert({ user_id: userId, ...op.log }, { onConflict: 'user_id,day' }));
      } else {
        check(await supabase.from('user_settings').upsert({ user_id: userId, sticky_note: op.text }, { onConflict: 'user_id' }));
      }
    };
    return new Outbox(`questhq:outbox:${userId}`, send, (s) => {
      setSync(s);
      setOutboxVersion((v) => v + 1);
    });
  }, [userId]);

  useEffect(() => () => outbox.dispose(), [outbox]);

  const refetch = useCallback(async (tables: Table[]) => {
    const jobs: Promise<void>[] = [];
    if (tables.includes('habits')) jobs.push(fetchHabits().then(setServerHabits));
    if (tables.includes('quests')) jobs.push(fetchQuests().then(setQuests));
    if (tables.includes('countdowns')) jobs.push(fetchCountdowns().then(setCountdowns));
    if (tables.includes('settings')) jobs.push(fetchSettings().then(setSettings));
    await Promise.all(jobs);
  }, []);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      await ensureInitialData(userId);
      await refetch(['habits', 'quests', 'countdowns', 'settings']);
      setLoading(false);
      void outbox.flush();
    } catch (err) {
      setLoadError(friendlyError(err).message);
    }
  }, [userId, refetch, outbox]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Live sync between devices, plus a refresh whenever the app comes back into view
  // (iOS suspends background tabs, so realtime alone isn't enough).
  useEffect(() => {
    const timers = new Map<Table, ReturnType<typeof setTimeout>>();
    const schedule = (t: Table) => {
      clearTimeout(timers.get(t));
      timers.set(t, setTimeout(() => void refetch([t]).catch(() => {}), 300));
    };
    const filter = `user_id=eq.${userId}`;
    const channel = supabase
      .channel(`quest-hq:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs', filter }, () => schedule('habits'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests', filter }, () => schedule('quests'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'countdowns', filter }, () => schedule('countdowns'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings', filter }, () => schedule('settings'))
      .subscribe();

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void outbox.flush();
      void refetch(['habits', 'quests', 'countdowns', 'settings']).catch(() => {});
    };
    const onOnline = () => void outbox.flush();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      timers.forEach(clearTimeout);
      void supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [userId, refetch, outbox]);

  // Server data with any not-yet-saved local edits laid on top.
  const habits = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const h of serverHabits) map.set(h.day, h);
    for (const op of outbox.pending()) if (op.kind === 'habit') map.set(op.log.day, op.log);
    return map;
  }, [serverHabits, outbox, outboxVersion]);

  const pendingNote = useMemo(() => {
    const op = outbox.pending().find((o) => o.kind === 'note');
    return op?.kind === 'note' ? op.text : null;
  }, [outbox, outboxVersion]);

  const activeQuest = useMemo(() => quests.find((q) => q.status === 'active') ?? null, [quests]);

  const setHabit = useCallback(
    (day: string, key: HabitKey, value: boolean) => {
      const current = habits.get(day) ?? { day, nourish: false, move: false, water: false };
      outbox.enqueue({ kind: 'habit', log: { ...current, [key]: value } });
    },
    [habits, outbox],
  );

  const setNote = useCallback((text: string) => outbox.enqueue({ kind: 'note', text }), [outbox]);

  // Explicit actions throw a friendly error so the calling form can show it.
  const run = useCallback(
    async (tables: Table[], fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (err) {
        throw friendlyError(err);
      }
      await refetch(tables).catch(() => {});
    },
    [refetch],
  );

  const value: DataContextValue = {
    userId,
    loading,
    loadError,
    reload: loadAll,
    habits,
    quests,
    activeQuest,
    countdowns,
    settings,
    stickyNote: pendingNote ?? settings.sticky_note,
    notePending: pendingNote !== null,
    sync,
    retrySync: () => void outbox.flush(),
    setHabit,
    setNote,

    createQuest: (q: QuestInput) =>
      run(['quests'], async () => check(await supabase.from('quests').insert({ ...q, user_id: userId, status: 'active' }))),
    updateQuest: (id: string, q: QuestInput) =>
      run(['quests'], async () => check(await supabase.from('quests').update(q).eq('id', id))),
    finishQuest: (id: string) =>
      run(['quests'], async () =>
        check(await supabase.from('quests').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', id)),
      ),
    deleteQuest: (id: string) => run(['quests'], async () => check(await supabase.from('quests').delete().eq('id', id))),

    createCountdown: (c: CountdownInput) =>
      run(['countdowns'], async () => {
        const sort_order = countdowns.reduce((max, x) => Math.max(max, x.sort_order), -1) + 1;
        check(await supabase.from('countdowns').insert({ ...c, sort_order, user_id: userId }));
      }),
    updateCountdown: (id: string, c: CountdownInput) =>
      run(['countdowns'], async () => check(await supabase.from('countdowns').update(c).eq('id', id))),
    deleteCountdown: (id: string) =>
      run(['countdowns'], async () => check(await supabase.from('countdowns').delete().eq('id', id))),

    uploadPhoto: (file: File) =>
      run(['settings'], async () => {
        const blob = await resizeImage(file);
        const path = `${userId}/photo-${Date.now()}.jpg`;
        check(await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
        const previous = settings.photo_path;
        check(await supabase.from('user_settings').upsert({ user_id: userId, photo_path: path }, { onConflict: 'user_id' }));
        if (previous) await supabase.storage.from(PHOTO_BUCKET).remove([previous]);
      }),
    removePhoto: () =>
      run(['settings'], async () => {
        const previous = settings.photo_path;
        check(await supabase.from('user_settings').upsert({ user_id: userId, photo_path: null }, { onConflict: 'user_id' }));
        if (previous) await supabase.storage.from(PHOTO_BUCKET).remove([previous]);
      }),

    exportData: (): BackupFile =>
      buildBackup({ habits: habits.values(), quests, countdowns, stickyNote: pendingNote ?? settings.sticky_note }),
    importData: async (data: BackupFile) => {
      // Pending local edits would otherwise be replayed on top of the imported data.
      outbox.clear();
      await run(['habits', 'quests', 'countdowns', 'settings'], async () =>
        check(await supabase.rpc('import_backup', { payload: data })),
      );
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
