import { BookHeart, Settings2 } from 'lucide-react';
import { formatDay } from '../lib/dates';
import { Card, Sparkle } from './Card';
import { SaveStatus } from './SaveStatus';

function greeting(hour: number): string {
  if (hour < 5) return 'Hello, night owl';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Header({
  today,
  stickers,
  onOpenSettings,
  onOpenStickers,
}: {
  today: string;
  /** How many different stickers have been collected. */
  stickers: number;
  onOpenSettings: () => void;
  onOpenStickers: () => void;
}) {
  return (
    // Two rows (greeting + settings / save status + stickers); on a portrait tablet,
    // where the header spans the full width, everything sits on one line instead.
    <Card
      as="header"
      className="grid h-full grid-cols-[1fr_auto] content-between items-center gap-x-2 gap-y-2 overflow-hidden p-4 [grid-template-areas:'text_gear'_'foot_foot'] md:max-lg:grid-cols-[1fr_auto_auto_auto] md:max-lg:gap-x-3 md:max-lg:[grid-template-areas:'text_status_book_gear']"
    >
      <Sparkle className="pointer-events-none absolute -right-1 -bottom-2 size-14 text-butter/80" />
      <div className="min-w-0 [grid-area:text]">
        <p className="eyebrow flex items-center gap-1 text-sage-deep">
          <Sparkle className="size-3" /> Quest HQ
        </p>
        <h1 className="mt-0.5 text-[22px] leading-tight font-extrabold tracking-tight">{greeting(new Date().getHours())}</h1>
        <p className="text-sm font-semibold text-muted">{formatDay(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>
      <button
        onClick={onOpenSettings}
        className="grid size-11 shrink-0 place-items-center self-start rounded-full bg-cream text-muted transition [grid-area:gear] hover:bg-lavender-soft hover:text-lavender-deep md:max-lg:self-center"
        aria-label="Open settings"
      >
        <Settings2 className="size-5" />
      </button>
      <div className="flex items-center justify-between gap-2 [grid-area:foot] md:max-lg:contents">
        <div className="relative md:max-lg:[grid-area:status]">
          <SaveStatus />
        </div>
        <button
          onClick={onOpenStickers}
          className="btn relative z-10 !min-h-9 shrink-0 bg-peach-soft !px-3 text-peach-deep hover:bg-peach hover:text-white md:max-lg:[grid-area:book]"
          aria-label={`Open sticker book (${stickers} collected)`}
        >
          <BookHeart className="size-4" /> Stickers
          <span className="rounded-full bg-white/80 px-1.5 text-[11px] leading-4 font-extrabold">{stickers}</span>
        </button>
      </div>
    </Card>
  );
}
