import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { formatClock, useTimer } from '../hooks/useTimer';
import { Card, CardTitle } from './Card';

const PRESETS = [2, 5, 10, 15, 25];
const R = 52;
const CIRC = 2 * Math.PI * R;

export function TimerWidget() {
  const t = useTimer();
  const minutes = Math.round(t.duration / 60_000);
  const done = t.status === 'done';

  return (
    <Card className="flex flex-col p-4" tape="bg-sage">
      <CardTitle icon={Timer}>Timer</CardTitle>

      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Timer length">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => t.choose(m)}
            disabled={t.status === 'running'}
            aria-pressed={minutes === m}
            className={`min-h-9 min-w-11 rounded-full lg:min-h-8 px-2.5 text-sm font-extrabold transition disabled:opacity-40 ${
              minutes === m ? 'bg-sage text-white' : 'bg-cream text-muted hover:bg-sage-soft'
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="relative mx-auto my-1.5 grid flex-1 place-items-center">
        <svg viewBox="0 0 120 120" className="size-32 -rotate-90 lg:size-[clamp(6.5rem,14vh,9.5rem)]" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-sage-soft)" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={done ? 'var(--color-peach)' : 'var(--color-sage)'}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - t.progress)}
            style={{ transition: 'stroke-dashoffset 250ms linear' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center" role="timer" aria-live="off">
          <div>
            <div className={`text-[28px] leading-none font-extrabold tabular-nums ${done ? 'animate-wiggle text-peach-deep' : ''}`}>
              {done ? '✿' : formatClock(t.remaining)}
            </div>
            <div className="mt-1 text-[11px] font-bold text-muted">
              {done ? 'Time’s up!' : t.status === 'paused' ? 'paused' : t.status === 'running' ? 'you’ve got this' : 'ready'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {t.status === 'running' ? (
          <button onClick={t.pause} className="btn min-w-28 bg-sage-deep text-white">
            <Pause className="size-4" fill="currentColor" /> Pause
          </button>
        ) : (
          <button onClick={done ? t.reset : t.start} className="btn min-w-28 bg-sage-deep text-white">
            {done ? <RotateCcw className="size-4" /> : <Play className="size-4" fill="currentColor" />}
            {done ? 'Again' : t.status === 'paused' ? 'Resume' : 'Start'}
          </button>
        )}
        <button onClick={t.reset} disabled={t.status === 'idle'} className="btn bg-cream text-muted" aria-label="Reset timer">
          <RotateCcw className="size-4" /> Reset
        </button>
      </div>
    </Card>
  );
}
