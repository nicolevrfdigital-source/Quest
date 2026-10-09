import { BookHeart, Lock, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useData } from '../data/context';
import { formatShort } from '../lib/dates';
import { collectStickers, perfectDays } from '../lib/rewards';
import { Sparkle } from './Card';
import { STICKERS, StickerArt } from './stickers';

/** A little hand-placed wobble so the book looks stuck-on, not printed. */
const TILT = [-5, 3, -2, 6, -4, 2, -6, 4, -3, 5];

function Modal({ label, onClose, children, className = '' }: { label: string; onClose: () => void; children: ReactNode; className?: string }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`animate-float-in relative max-h-[94dvh] w-full overflow-y-auto rounded-3xl bg-paper shadow-2xl outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function useStickerCollection(today: string) {
  const { habits } = useData();
  return useMemo(() => collectStickers(perfectDays(habits.values(), today), STICKERS.length), [habits, today]);
}

export function StickerBook({ today, onClose }: { today: string; onClose: () => void }) {
  const { earned, total } = useStickerCollection(today);
  const collected = earned.filter((d) => d.length > 0).length;
  const [selected, setSelected] = useState<number | null>(null);
  const sel = selected === null ? null : { sticker: STICKERS[selected], days: earned[selected] };

  return (
    <Modal label="Sticker book" onClose={onClose} className="max-w-[720px]">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <BookHeart className="size-5 text-peach-deep" strokeWidth={2.4} />
          <h2 className="text-lg font-extrabold">Sticker book</h2>
          <span className="rounded-full bg-peach-soft px-2.5 py-0.5 text-xs font-extrabold text-peach-deep">
            {collected} / {STICKERS.length}
          </span>
        </div>
        <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-cream" aria-label="Close sticker book">
          <X className="size-5" />
        </button>
      </div>
      <p className="px-5 text-sm font-semibold text-muted">
        Check off all four habits in a day to earn the next sticker.{' '}
        {total > 0 && (
          <>
            <span className="text-ink">{total}</span> perfect {total === 1 ? 'day' : 'days'} so far ♡
          </>
        )}
      </p>

      {/* The page: dot-grid paper, like the rest of the journal. */}
      <div
        className="mx-4 mt-3 grid grid-cols-6 gap-1.5 rounded-2xl bg-cream p-3 sm:grid-cols-8"
        style={{ backgroundImage: 'radial-gradient(var(--color-dot) 1.1px, transparent 1.3px)', backgroundSize: '18px 18px' }}
      >
        {STICKERS.map((s, i) => {
          const days = earned[i];
          const has = days.length > 0;
          return (
            <button
              key={s.name}
              onClick={() => setSelected(i === selected ? null : i)}
              aria-label={has ? s.name : `Sticker ${i + 1}, not yet earned`}
              aria-pressed={i === selected}
              className={`relative grid aspect-square place-items-center rounded-2xl transition active:scale-95 ${
                i === selected ? 'bg-white shadow-card' : 'hover:bg-white/60'
              }`}
            >
              {has ? (
                <>
                  <span className="size-[78%]" style={{ rotate: `${TILT[i % TILT.length]}deg` }}>
                    <StickerArt index={i} className="size-full" />
                  </span>
                  {days.length > 1 && (
                    <span className="absolute top-0.5 right-0.5 rounded-full bg-ink px-1.5 text-[10px] leading-4 font-extrabold text-white">
                      ×{days.length}
                    </span>
                  )}
                </>
              ) : (
                <span className="grid size-[70%] place-items-center rounded-full border-2 border-dashed border-dot text-sm font-extrabold text-dot">
                  {i + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[64px] items-center gap-3 px-5 py-3">
        {sel ? (
          sel.days.length > 0 ? (
            <>
              <StickerArt index={selected!} className="size-11 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold">{sel.sticker.name}</p>
                <p className="truncate text-xs font-semibold text-muted">
                  Earned {sel.days.map((d) => formatShort(d)).join(' · ')}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-muted">
                <Lock className="size-5" />
              </span>
              <p className="text-sm font-semibold text-muted">
                Sticker #{selected! + 1} is still a surprise. Keep going — it’s waiting for you!
              </p>
            </>
          )
        ) : (
          <p className="text-sm font-semibold text-muted">Tap a sticker to see when you earned it.</p>
        )}
      </div>
    </Modal>
  );
}

const BURST = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { dx: `${Math.cos(a) * 120}px`, dy: `${Math.sin(a) * 110}px`, color: ['text-peach', 'text-lavender', 'text-butter-mid', 'text-sage'][i % 4] };
});

export function StickerReward({ index, onClose, onOpenBook }: { index: number; onClose: () => void; onOpenBook: () => void }) {
  const sticker = STICKERS[index];
  return (
    <Modal label="New sticker" onClose={onClose} className="max-w-sm overflow-hidden text-center">
      <span aria-hidden className="tape bg-peach" style={{ top: 10 }} />
      <div className="px-6 pt-9 pb-6">
        <p className="eyebrow text-peach-deep">Perfect day!</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">You earned a sticker ✿</h2>
        <div className="relative mx-auto my-5 grid size-44 place-items-center">
          {BURST.map((b, i) => (
            <span
              key={i}
              aria-hidden
              className="animate-burst absolute"
              // CSS custom properties drive each sparkle's flight path.
              style={{ '--dx': b.dx, '--dy': b.dy, animationDelay: '250ms' } as CSSProperties}
            >
              <Sparkle className={`size-5 ${b.color}`} />
            </span>
          ))}
          <StickerArt index={index} className="animate-sticker-in size-40" />
        </div>
        <p className="text-lg font-extrabold">{sticker.name}</p>
        <p className="text-sm font-semibold text-muted">
          Sticker #{index + 1} of {STICKERS.length} · all four check-ins done
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={onOpenBook} className="btn bg-peach-soft text-peach-deep">
            <BookHeart className="size-4" /> Sticker book
          </button>
          <button onClick={onClose} className="btn bg-sage-deep text-white">
            Yay!
          </button>
        </div>
      </div>
    </Modal>
  );
}
