import { useEffect, useId } from 'react';
import { create } from 'zustand';

interface OverlayState {
  modals: string[];
  focusedFlows: string[];
}

/** Ephemeral UI ownership only; never persisted with player/game state. */
export const useOverlayStore = create<OverlayState>(() => ({ modals: [], focusedFlows: [] }));

export function useFocusedFlow() {
  const id = useId();
  useEffect(() => {
    useOverlayStore.setState((state) => ({ focusedFlows: [...state.focusedFlows, id] }));
    return () => {
      useOverlayStore.setState((state) => ({
        focusedFlows: state.focusedFlows.filter((flow) => flow !== id),
      }));
    };
  }, [id]);
}

export function isFocusedRoute(pathname: string) {
  return /^\/(terminal|coop|duel\/match)(\/|$)/.test(pathname);
}
