import { Star } from 'lucide-react';
import type { Mood } from '../lib/types';

const INK = '#3d3833';

export const MOODS: readonly { value: Mood; label: string; fill: string }[] = [
  { value: 1, label: 'Rough', fill: '#c8bde0' },
  { value: 2, label: 'Low', fill: '#c9dcf2' },
  { value: 3, label: 'Okay', fill: '#fbe7a1' },
  { value: 4, label: 'Good', fill: '#f5c3a5' },
  { value: 5, label: 'Amazing', fill: '#f7a8b8' },
];

const MOUTHS: Record<Mood, string> = {
  1: 'M13.5 27.5q6.5-5 13 0',
  2: 'M14 26.5q6-2.5 12 0',
  3: 'M14.5 25.5h11',
  4: 'M13.5 24q6.5 5.5 13 0',
  5: 'M12.5 23h15q-1 7.5-7.5 7.5T12.5 23Z',
};

/** A little hand-drawn face for each mood. */
export function MoodFace({ mood, className = '' }: { mood: Mood; className?: string }) {
  const m = MOODS[mood - 1];
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label={m.label}>
      <g stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="16.5" fill={m.fill} />
        {mood === 5 ? (
          <path d="M12 17.5q2.5-3 5 0M23 17.5q2.5-3 5 0" fill="none" />
        ) : mood === 1 ? (
          <path d="M12.5 15.5l4 1.5M27.5 15.5l-4 1.5" fill="none" />
        ) : null}
        {mood !== 5 && (
          <>
            <circle cx="15" cy="19" r="1.7" fill={INK} stroke="none" />
            <circle cx="25" cy="19" r="1.7" fill={INK} stroke="none" />
          </>
        )}
        <path d={MOUTHS[mood]} fill={mood === 5 ? '#fff' : 'none'} />
        {mood >= 4 && (
          <>
            <ellipse cx="10.5" cy="23" rx="2.4" ry="1.5" fill="#f08a7e" opacity={0.45} stroke="none" />
            <ellipse cx="29.5" cy="23" rx="2.4" ry="1.5" fill="#f08a7e" opacity={0.45} stroke="none" />
          </>
        )}
        {mood === 1 && <path d="M27 22.5q-1.6 3 0 4 1.6-1 0-4Z" fill="#8fb4e0" strokeWidth={1.2} />}
      </g>
    </svg>
  );
}

/** Three stars, `count` of them filled. `null` means no data yet. */
export function StarRow({ count, className = 'size-4' }: { count: number | null; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={count === null ? 'No data' : `${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={`${className} ${count !== null && i < count ? 'fill-butter-mid text-butter-deep' : 'fill-none text-line'}`}
          strokeWidth={2.2}
        />
      ))}
    </span>
  );
}
