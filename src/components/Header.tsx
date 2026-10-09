import { Settings2 } from 'lucide-react';
import { formatDay } from '../lib/dates';
import { Card, Sparkle } from './Card';
import { SaveStatus } from './SaveStatus';

function greeting(hour: number): string {
  if (hour < 5) return 'Hello, night owl';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Header({ today, onOpenSettings }: { today: string; onOpenSettings: () => void }) {
  return (
    <Card as="header" className="flex h-full flex-col justify-between gap-2 overflow-hidden p-4">
      <Sparkle className="pointer-events-none absolute -right-1 -bottom-2 size-14 text-butter/80" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-1 text-sage-deep">
            <Sparkle className="size-3" /> Quest HQ
          </p>
          <h1 className="mt-0.5 text-[22px] leading-tight font-extrabold tracking-tight">{greeting(new Date().getHours())}</h1>
          <p className="text-sm font-semibold text-muted">{formatDay(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-muted transition hover:bg-lavender-soft hover:text-lavender-deep"
          aria-label="Open settings"
        >
          <Settings2 className="size-5" />
        </button>
      </div>
      <div className="relative">
        <SaveStatus />
      </div>
    </Card>
  );
}
