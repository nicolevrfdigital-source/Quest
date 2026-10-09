import { useEffect, useRef, useState } from 'react';
import { useData } from '../data/context';

const SAVE_DELAY = 600;

export function StickyNote() {
  const { stickyNote, setNote, notePending, sync } = useData();
  const [text, setText] = useState(stickyNote);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const focused = useRef(false);
  const latest = useRef(text);
  latest.current = text;

  // Adopt changes from other devices — but never while you're mid-sentence.
  useEffect(() => {
    if (!focused.current && !timer.current) setText(stickyNote);
  }, [stickyNote]);

  const commit = () => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    setNote(latest.current);
  };

  // Don't lose the last keystrokes when the app is closed or hidden.
  useEffect(() => {
    const onHide = () => commit();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
      commit();
    };
  }, []);

  const onChange = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(commit, SAVE_DELAY);
  };

  const status = timer.current || notePending ? (sync.state === 'error' ? 'Not saved yet' : 'Saving…') : 'Saved';

  return (
    <section className="relative flex min-h-56 flex-col lg:min-h-0" aria-label="Sticky note">
      <div
        className="relative flex flex-1 flex-col rounded-[6px] rounded-br-[28px] bg-butter p-4 pt-5 shadow-[var(--shadow-lift)] lg:-rotate-1"
        style={{ backgroundImage: 'linear-gradient(160deg, #fdf0b8 0%, #fbe7a1 55%, #f6dc8a 100%)' }}
      >
        <span aria-hidden className="tape bg-peach !top-[-10px]" />
        <div className="mb-1 flex items-center justify-between">
          <span className="eyebrow text-butter-deep">Note to self</span>
          <span className="text-[11px] font-bold text-butter-deep/80" aria-live="polite">
            {status}
          </span>
        </div>
        <textarea
          value={text}
          maxLength={5000}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => (focused.current = true)}
          onBlur={() => {
            focused.current = false;
            commit();
          }}
          placeholder="Write yourself a little note…"
          aria-label="Sticky note"
          className="w-full flex-1 resize-none bg-transparent text-[16px] leading-[28px] font-semibold text-ink outline-none placeholder:text-butter-deep/60"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent 0 27px, rgb(168 133 32 / 0.18) 27px 28px)',
            backgroundAttachment: 'local',
          }}
        />
        {/* Folded corner */}
        <span aria-hidden className="absolute right-0 bottom-0 size-7 rounded-tl-[10px] rounded-br-[28px] bg-[#efd27a] shadow-[-2px_-2px_4px_rgb(0_0_0/0.06)]" />
      </div>
    </section>
  );
}
