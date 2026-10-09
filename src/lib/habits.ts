import { Droplet, Footprints, Salad, Zap, type LucideIcon } from 'lucide-react';
import type { HabitKey } from './types';

export interface HabitMeta {
  key: HabitKey;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Static class strings so Tailwind can see them. */
  soft: string;
  solid: string;
  deep: string;
  ring: string;
}

export const HABITS: readonly HabitMeta[] = [
  {
    key: 'nourish',
    label: 'Nourish',
    description: 'Intentional eating & nutrition',
    icon: Salad,
    soft: 'bg-sage-soft',
    solid: 'bg-sage',
    deep: 'text-sage-deep',
    ring: 'border-sage',
  },
  {
    key: 'move',
    label: 'Move',
    description: 'Walk, dance, anything joyful',
    icon: Footprints,
    soft: 'bg-peach-soft',
    solid: 'bg-peach',
    deep: 'text-peach-deep',
    ring: 'border-peach',
  },
  {
    key: 'water',
    label: 'Water',
    description: 'Stay happily hydrated',
    icon: Droplet,
    soft: 'bg-lavender-soft',
    solid: 'bg-lavender',
    deep: 'text-lavender-deep',
    ring: 'border-lavender',
  },
  {
    key: 'challenge',
    label: 'Challenge',
    // Replaced on screen by the day's challenge (lib/challenges).
    description: 'A little daily movement nudge',
    icon: Zap,
    soft: 'bg-butter-soft',
    solid: 'bg-butter-mid',
    deep: 'text-butter-deep',
    ring: 'border-butter-mid',
  },
];
