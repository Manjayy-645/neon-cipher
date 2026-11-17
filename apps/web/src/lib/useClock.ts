import { useEffect, useState } from 'react';

/** Time is sampled outside render; display calculations remain pure. */
export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
  return now;
}
