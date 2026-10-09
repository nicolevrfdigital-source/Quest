import { useEffect, useState } from 'react';
import { msUntilNextDay, todayString } from '../lib/dates';

/** Today's local date, refreshed at midnight and whenever the app becomes visible again. */
export function useToday(): string {
  const [today, setToday] = useState(todayString);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setToday(todayString());
      clearTimeout(timer);
      timer = setTimeout(tick, msUntilNextDay() + 500);
    };
    tick();
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return today;
}
