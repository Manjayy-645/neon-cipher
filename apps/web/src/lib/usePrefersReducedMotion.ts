import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settings-store';

export function usePrefersReducedMotion(): boolean {
  const [systemReduced, setSystemReduced] = useState(false);
  const reducedMotionSetting = useSettingsStore((s) => s.reducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReduced(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setSystemReduced(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  if (reducedMotionSetting === 'reduced') return true;
  if (reducedMotionSetting === 'full') return false;
  return systemReduced;
}
