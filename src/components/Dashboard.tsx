import { LoaderCircle, RotateCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useData } from '../data/context';
import { useToday } from '../hooks/useToday';
import { Countdowns } from './Countdowns';
import { HabitCounters } from './HabitCounters';
import { HabitTracker } from './HabitTracker';
import { Header } from './Header';
import { MessageCard } from './MessageCard';
import { PhotoWidget } from './PhotoWidget';
import { SettingsPanel, type SettingsTab } from './SettingsPanel';
import { StickyNote } from './StickyNote';
import { TimerWidget } from './TimerWidget';

/**
 * Layout
 *  - Phone: one column, habits & counters first, then the note, then the rest.
 *  - Tablet portrait: two columns.
 *  - iPad landscape (lg): a 12-column grid that fills the screen —
 *      header + countdowns / habits · counters · message / note · timer · photo.
 *    Rows stretch to fill the viewport but grow (and the page scrolls) rather than clip.
 */
export function Dashboard({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  const { loading, loadError, reload } = useData();
  const today = useToday();
  const [day, setDay] = useState(today);
  const [settings, setSettings] = useState<SettingsTab | null>(null);
  const closeSettings = useCallback(() => setSettings(null), []);

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        {loadError ? (
          <div className="card max-w-sm p-6">
            <p className="text-lg font-extrabold">Couldn’t load your dashboard</p>
            <p className="mt-1 text-sm text-muted">{loadError}</p>
            <button onClick={() => void reload()} className="btn mt-4 bg-sage-deep text-white">
              <RotateCw className="size-4" /> Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted">
            <LoaderCircle className="size-8 animate-spin text-sage-deep" />
            <p className="font-bold">Opening your journal…</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[1440px] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-5 lg:py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:min-h-[calc(100dvh-2rem)] lg:grid-cols-12 lg:grid-rows-[auto_auto_1fr] lg:gap-3.5">
        <div className="order-1 md:col-span-2 lg:order-none lg:col-span-3">
          <Header today={today} onOpenSettings={() => setSettings('quest')} />
        </div>
        <div className="order-5 min-w-0 md:order-1 md:col-span-2 lg:order-none lg:col-span-9 [&>section]:h-full">
          <Countdowns today={today} onEdit={() => setSettings('countdowns')} />
        </div>
        <div className="order-2 grid lg:order-none lg:col-span-5">
          <HabitTracker day={day} today={today} onDayChange={setDay} />
        </div>
        <div className="order-3 grid lg:order-none lg:col-span-4">
          <HabitCounters today={today} />
        </div>
        <div className="order-6 grid lg:order-none lg:col-span-3">
          <MessageCard />
        </div>
        <div className="order-4 grid pt-2 lg:order-none lg:col-span-4 lg:pt-1">
          <StickyNote />
        </div>
        <div className="order-7 grid lg:order-none lg:col-span-4">
          <TimerWidget />
        </div>
        <div className="order-8 grid pt-2 lg:order-none lg:col-span-4 lg:pt-1">
          <PhotoWidget />
        </div>
      </div>

      {settings && (
        <SettingsPanel
          tab={settings}
          onTab={setSettings}
          onClose={closeSettings}
          today={today}
          email={email}
          onSignOut={onSignOut}
        />
      )}
    </main>
  );
}
