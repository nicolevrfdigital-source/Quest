import { BarChart3, BookHeart, ListChecks, Settings2 } from 'lucide-react';
import { formatDay } from '../lib/dates';
import { Card, Sparkle } from './Card';
import { SaveStatus } from './SaveStatus';

export type Page = 'today' | 'stats';

function greeting(hour: number): string {
  if (hour < 5) return 'Hello, night owl';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const PAGES: { id: Page; label: string; icon: typeof ListChecks }[] = [
  { id: 'today', label: 'Today', icon: ListChecks },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

export function Header({
  today,
  page,
  onPage,
  stickers,
  onOpenSettings,
  onOpenStickers,
}: {
  today: string;
  page: Page;
  onPage: (page: Page) => void;
  /** How many different stickers have been collected. */
  stickers: number;
  onOpenSettings: () => void;
  onOpenStickers: () => void;
}) {
  return (
    // Two rows (greeting + settings / page switch + stickers); on a portrait tablet,
    // where the header spans the full width, everything sits on one line instead.
    <Card
      as="header"
      className="grid h-full grid-cols-[1fr_auto] content-between items-center gap-x-2 gap-y-2 overflow-hidden p-4 [grid-template-areas:'text_gear'_'foot_foot'] md:max-lg:grid-cols-[1fr_auto_auto_auto] md:max-lg:gap-x-3 md:max-lg:[grid-template-areas:'text_pages_book_gear']"
    >
      <Sparkle className="pointer-events-none absolute -right-1 -bottom-2 size-14 text-butter/80" />
      <div className="min-w-0 [grid-area:text]">
        <p className="eyebrow flex items-center gap-1.5 text-sage-deep">
          <Sparkle className="size-3" /> Quest HQ <SaveStatus compact />
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
      <div className="flex items-center gap-2 [grid-area:foot] md:max-lg:contents">
        <div role="tablist" aria-label="Screen" className="flex flex-1 rounded-full bg-cream p-1 md:max-lg:[grid-area:pages]">
          {PAGES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={page === id}
              onClick={() => onPage(id)}
              className={`flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-extrabold transition ${
                page === id ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={onOpenStickers}
          className="btn relative z-10 !min-h-10 shrink-0 bg-peach-soft !px-3 text-peach-deep hover:bg-peach hover:text-white md:max-lg:[grid-area:book]"
          aria-label={`Open sticker book (${stickers} collected)`}
        >
          <BookHeart className="size-4" />
          <span className="text-[13px] font-extrabold">{stickers}</span>
        </button>
      </div>
    </Card>
  );
}
