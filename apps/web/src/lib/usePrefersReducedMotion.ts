import { useSyncExternalStore } from 'react';
import { useSettingsStore } from '../stores/settings-store';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(listener: () => void) {
  if (!window.matchMedia) return () => {};
  const media = window.matchMedia(query);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const getSnapshot = () => Boolean(window.matchMedia?.(query).matches);
const getServerSnapshot = () => false;

export function usePrefersReducedMotion(): boolean {
  const systemReduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setting = useSettingsStore((s) => s.reducedMotion);
  if (setting === 'reduced') return true;
  if (setting === 'full') return false;
  return systemReduced;
}
