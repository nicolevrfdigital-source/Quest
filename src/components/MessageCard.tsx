import { Quote, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { MESSAGES, randomMessageIndex } from '../lib/messages';
import { Card, Sparkle } from './Card';

export function MessageCard() {
  const [index, setIndex] = useState(() => randomMessageIndex());

  return (
    <Card className="flex flex-col overflow-hidden bg-lavender-soft p-4" tape="bg-lavender">
      <Sparkle className="pointer-events-none absolute top-3 right-3 size-5 text-lavender" />
      <Sparkle className="pointer-events-none absolute right-8 bottom-16 size-3 text-butter-deep/50" />
      <p className="eyebrow mb-2 flex items-center gap-1.5 text-lavender-deep">
        <Sparkles className="size-3.5" /> A little note for you
      </p>
      <div className="flex flex-1 items-center">
        <blockquote key={index} className="animate-float-in">
          <Quote className="mb-1 size-6 text-lavender" fill="currentColor" strokeWidth={0} aria-hidden />
          <p className="text-[19px] leading-snug font-bold tracking-tight text-balance">{MESSAGES[index]}</p>
        </blockquote>
      </div>
      <button
        onClick={() => setIndex((i) => randomMessageIndex(i))}
        className="btn mt-3 self-start bg-white/80 text-lavender-deep hover:bg-white"
      >
        <Sparkles className="size-4" /> Another one
      </button>
    </Card>
  );
}
