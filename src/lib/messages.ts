export const MESSAGES: readonly string[] = [
  'You don’t need motivation. Just press play.',
  'One song counts.',
  'Progress doesn’t require a perfect day.',
  'Do something today that future you will thank you for.',
  'Hey, remember why you started. ♡',
  'A glass of water is a tiny act of kindness to yourself.',
  'Small steps still move you forward.',
  'You’re allowed to start again at any time — even at 4pm.',
  'Gentle is still progress.',
  'Ten minutes is plenty. Ten minutes is a win.',
  'You showed up. That’s the whole trick.',
  'Rest is part of the plan, not a break from it.',
  'Your body is on your team.',
  'Nourish, don’t punish.',
  'Be the friend to yourself you’d be to anyone else.',
  'Done is lovelier than perfect.',
  'Dance like the kitchen is a stage.',
  'Every check mark is a little thank-you note to yourself.',
  'Slow mornings and small wins — that’s a good day.',
  'You can do hard things. You can also do easy things. Both count.',
  'Missed yesterday? Today doesn’t mind.',
  'Fresh air fixes more than you’d think.',
  'Look how far you’ve already come.',
  'Hydrated and hopeful — the perfect combo.',
  'Your future self is cheering for you right now.',
  'It’s not about streaks. It’s about coming back.',
  'Put on your favorite song and see where it takes you.',
  'Little by little, a little becomes a lot.',
  'The trip is coming. So is a stronger, happier you. ✈',
  'You are doing better than you think.',
];

export function randomMessageIndex(exclude?: number): number {
  if (MESSAGES.length < 2) return 0;
  let i = Math.floor(Math.random() * MESSAGES.length);
  if (i === exclude) i = (i + 1 + Math.floor(Math.random() * (MESSAGES.length - 1))) % MESSAGES.length;
  return i;
}
