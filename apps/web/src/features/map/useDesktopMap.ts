import { useSyncExternalStore } from 'react';

const desktopQuery = '(min-width: 1024px)';
const getSnapshot = () => window.matchMedia?.(desktopQuery).matches ?? false;
const getServerSnapshot = () => false;
function subscribe(listener: () => void) {
  const media = window.matchMedia?.(desktopQuery);
  media?.addEventListener('change', listener);
  return () => media?.removeEventListener('change', listener);
}

/** Layout follows available width; it never changes node eligibility or game state. */
export function useDesktopMap() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
