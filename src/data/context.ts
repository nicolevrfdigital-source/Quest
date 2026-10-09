import { createContext, useContext } from 'react';
import type { SyncStatus } from '../lib/outbox';
import type { Countdown, HabitKey, HabitLog, Quest, Settings } from '../lib/types';
import type { BackupFile } from '../lib/backup';

export interface QuestInput {
  name: string;
  start_date: string;
  end_date: string;
}

export interface CountdownInput {
  title: string;
  target_date: string | null;
  linked_to_quest: boolean;
}

export interface DataContextValue {
  userId: string;
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;

  habits: Map<string, HabitLog>;
  quests: Quest[];
  activeQuest: Quest | null;
  countdowns: Countdown[];
  settings: Settings;
  stickyNote: string;
  notePending: boolean;

  sync: SyncStatus;
  retrySync: () => void;
  setHabit: (day: string, key: HabitKey, value: boolean) => void;
  setNote: (text: string) => void;

  createQuest: (q: QuestInput) => Promise<void>;
  updateQuest: (id: string, q: QuestInput) => Promise<void>;
  finishQuest: (id: string) => Promise<void>;
  deleteQuest: (id: string) => Promise<void>;

  createCountdown: (c: CountdownInput) => Promise<void>;
  updateCountdown: (id: string, c: CountdownInput) => Promise<void>;
  deleteCountdown: (id: string) => Promise<void>;

  uploadPhoto: (file: File) => Promise<void>;
  removePhoto: () => Promise<void>;

  exportData: () => BackupFile;
  importData: (data: BackupFile) => Promise<void>;
}

export const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
