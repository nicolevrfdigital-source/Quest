import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

interface TimerState {
  duration: number; // ms
  status: TimerStatus;
  /** Wall-clock end time while running — remaining time is always derived from it. */
  endsAt: number | null;
  /** Remaining time while paused / idle. */
  remaining: number;
}

const STORAGE_KEY = 'questhq:timer';
const DEFAULT_MS = 5 * 60_000;

function load(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TimerState;
  } catch {
    // ignore
  }
  return { duration: DEFAULT_MS, status: 'idle', endsAt: null, remaining: DEFAULT_MS };
}

function save(state: TimerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

let audioCtx: AudioContext | null = null;

/** Must run inside a user gesture on iOS so the completion chime can play later. */
function unlockAudio() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
  } catch {
    // no audio, no problem
  }
}

function playChime() {
  if (!audioCtx) return;
  const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6 — soft and bright
  const start = audioCtx.currentTime + 0.05;
  notes.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = start + i * 0.22;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(t);
    osc.stop(t + 1.3);
  });
}

async function notify(minutes: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const title = 'Time’s up ✿';
  const body = `Your ${minutes}-minute timer is done. Nicely done.`;
  try {
    // iOS home-screen apps only support notifications through the service worker.
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: 'icons/icon-192.png', tag: 'quest-hq-timer' });
    else new Notification(title, { body });
  } catch {
    // ignore
  }
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(() => {
    const s = load();
    // Coming back to a timer that already finished long ago: show it as done, quietly.
    if (s.status === 'running' && s.endsAt && s.endsAt <= Date.now()) return { ...s, status: 'done', endsAt: null, remaining: 0 };
    return s;
  });
  const [now, setNow] = useState(Date.now);
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback((next: TimerState) => {
    save(next);
    setState(next);
  }, []);

  useEffect(() => {
    if (state.status !== 'running') return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const s = stateRef.current;
      if (s.status === 'running' && s.endsAt !== null && s.endsAt <= t) {
        const late = t - s.endsAt;
        update({ ...s, status: 'done', endsAt: null, remaining: 0 });
        if (late < 5 * 60_000) {
          playChime();
          navigator.vibrate?.([120, 80, 120]);
          void notify(Math.round(s.duration / 60_000));
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [state.status, update]);

  const remaining =
    state.status === 'running' && state.endsAt !== null ? Math.max(0, state.endsAt - now) : state.remaining;

  // Show the countdown in the tab title while it runs.
  useEffect(() => {
    const base = 'Quest HQ';
    document.title = state.status === 'running' ? `${formatClock(remaining)} · ${base}` : base;
  }, [state.status, remaining]);

  const choose = (minutes: number) => {
    const duration = minutes * 60_000;
    update({ duration, status: 'idle', endsAt: null, remaining: duration });
  };

  const start = () => {
    unlockAudio();
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => {});
    }
    const left = state.status === 'paused' ? state.remaining : state.duration;
    setNow(Date.now());
    update({ ...state, status: 'running', endsAt: Date.now() + left, remaining: left });
  };

  const pause = () => {
    if (state.status !== 'running' || state.endsAt === null) return;
    update({ ...state, status: 'paused', endsAt: null, remaining: Math.max(0, state.endsAt - Date.now()) });
  };

  const reset = () => update({ ...state, status: 'idle', endsAt: null, remaining: state.duration });

  return {
    status: state.status,
    duration: state.duration,
    remaining,
    progress: state.duration ? 1 - remaining / state.duration : 0,
    choose,
    start,
    pause,
    reset,
  };
}
