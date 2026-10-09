import { diffDays } from './dates';

export interface Challenge {
  emoji: string;
  text: string;
}

/** Small, doable movement nudges — a little push, never a workout plan. */
export const CHALLENGES: readonly Challenge[] = [
  { emoji: '💃', text: 'Dance for 15 minutes' },
  { emoji: '🚶‍♀️', text: 'Take a 20-minute walk' },
  { emoji: '🧘‍♀️', text: 'Stretch for 10 minutes' },
  { emoji: '🎶', text: 'Dance to 3 songs in a row' },
  { emoji: '🪜', text: 'Take the stairs every time today' },
  { emoji: '🌳', text: 'Walk around the block twice' },
  { emoji: '🙆‍♀️', text: 'Gentle morning stretches, 5 min' },
  { emoji: '🦵', text: 'Do 15 squats while the kettle boils' },
  { emoji: '📞', text: 'Walk while you talk on the phone' },
  { emoji: '🌅', text: 'Take a 10-minute sunset walk' },
  { emoji: '🧎‍♀️', text: 'Hold a plank for 3 × 20 seconds' },
  { emoji: '🐈', text: '10 minutes of cat-cow & hip openers' },
  { emoji: '🕺', text: 'Have a kitchen dance party' },
  { emoji: '🎧', text: 'Walk for one full podcast episode' },
  { emoji: '🧺', text: 'Speed-tidy a room for 10 minutes' },
  { emoji: '🍃', text: 'Phone-free walk for 15 minutes' },
  { emoji: '🦶', text: '20 calf raises while you brush' },
  { emoji: '🤸‍♀️', text: '10 minutes of yoga from a video' },
  { emoji: '⏰', text: 'Move for 2 min, 5 times today' },
  { emoji: '🛒', text: 'Walk to run one errand' },
  { emoji: '🏃‍♀️', text: '7-minute workout — just one round' },
  { emoji: '🌸', text: '15-min walk: find 3 pretty things' },
  { emoji: '🪩', text: 'Dance to your favorite album side A' },
  { emoji: '🧍‍♀️', text: 'Wall sit: 3 × 30 seconds' },
  { emoji: '🎵', text: 'Shake it out to one loud song' },
  { emoji: '🚲', text: 'Bike for 20 minutes (any bike!)' },
  { emoji: '🌙', text: '10 minutes of bedtime stretching' },
  { emoji: '👟', text: 'Hit 6,000 steps today' },
  { emoji: '🏞️', text: 'Explore a street you’ve never walked' },
  { emoji: '💪', text: '10 wall push-ups, 3 times today' },
  { emoji: '🦋', text: 'Balance on one foot, 1 min per side' },
  { emoji: '☀️', text: 'Get 15 minutes of moving sunshine' },
];

const EPOCH = '2026-01-01';

/** A tiny deterministic PRNG so every device shows the same challenge on the same day. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledOrder(block: number, length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  const rand = mulberry32(block * 2654435761 + 1);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * The challenge for a calendar day. Days are grouped into blocks the size of
 * the list; each block is a fresh shuffle, so nothing repeats until every
 * challenge has had its turn — and the same day always shows the same one.
 */
export function challengeIndexForDay(day: string, length = CHALLENGES.length): number {
  const n = diffDays(EPOCH, day);
  const block = Math.floor(n / length);
  const pos = n - block * length;
  const order = shuffledOrder(block, length);
  // Avoid the same challenge twice in a row across a block boundary.
  const prevLast = shuffledOrder(block - 1, length)[length - 1];
  if (order[0] === prevLast) [order[0], order[1]] = [order[1], order[0]];
  return order[pos];
}

export function challengeForDay(day: string): Challenge {
  return CHALLENGES[challengeIndexForDay(day)];
}
