'use client';

import { useResettableState } from '@/lib/useResettableState';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSystemStore } from '@/stores/system-store';
import { soundFx } from '@/lib/audio';
import { Button } from '@/components/ui/Button';

export function ConnectionBanner() {
  const {
    isOnline,
    simulatedOffline,
    reconnectBannerVisible,
    isReconnecting,
    midDuelDesync,
    midDuelSecondsLeft,
    setOnline,
    setReconnecting,
    setMidDuelDesync,
    decrementDuelTimer,
    dismissReconnectBanner,
  } = useSystemStore();

  const isActuallyOffline = !isOnline || simulatedOffline;
  const [countdown, setCountdown] = useResettableState(5, String(isActuallyOffline) + isReconnecting);

  // Window online / offline listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  // Mid-duel countdown timer
  useEffect(() => {
    if (!midDuelDesync) return;
    const timer = setInterval(() => {
      decrementDuelTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [midDuelDesync, decrementDuelTimer]);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleManualRetry = useCallback(() => {
    setReconnecting(true);
    soundFx.playKeystroke();
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = setTimeout(() => {
      setReconnecting(false);
      // If simulated offline was on, turn it off on explicit reconnect
      useSystemStore.getState().setSimulatedOffline(false);
      useSystemStore.getState().setOnline(true);
      soundFx.playSuccess();
    }, 1200);
  }, [setReconnecting]);

  const handleForfeit = useCallback(() => {
    setMidDuelDesync(false);
    soundFx.playWarning();
  }, [setMidDuelDesync]);

  // Retry timing stays in the timer callback, never an effect-driven state cascade.
  useEffect(() => {
    if (!isActuallyOffline || isReconnecting) return;
    const timer = setTimeout(() => {
      if (countdown <= 2) {
        handleManualRetry();
        setCountdown(5);
      } else {
        setCountdown((previous) => previous - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isActuallyOffline, isReconnecting, countdown, handleManualRetry, setCountdown]);

  // 1. Mid-Duel Desync banner (Highest priority)
  if (midDuelDesync) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full bg-danger text-white px-3 py-2 shrink-0 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md z-40 font-data animate-pulse"
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center font-bold text-[10px] shrink-0">
            !
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              CRITICAL: DUEL CARRIER DESYNC
            </div>
            <div className="text-[11px] opacity-90">
              Turn timer frozen: <span className="font-data font-bold">{midDuelSecondsLeft}s</span> remaining before match forfeit.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            compact
            onClick={handleManualRetry}
            loading={isReconnecting}
          >
            RECONNECT NOW
          </Button>
          <Button
            type="button"
            variant="danger"
            compact
            onClick={handleForfeit}
          >
            FORFEIT
          </Button>
        </div>
      </div>
    );
  }

  // 2. Standard Disconnected / Offline banner
  if (isActuallyOffline) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="w-full bg-danger/95 text-white px-3 py-2 shrink-0 border-b border-line flex items-center justify-between gap-2 shadow-md z-40 font-data"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
          <div className="truncate">
            <span className="text-xs font-bold uppercase tracking-wider">
              OFFLINE // CONNECTION LOST
            </span>
            <span className="text-[11px] opacity-80 ml-2 hidden sm:inline">
              Retrying carrier signal in {countdown}s...
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          compact
          onClick={handleManualRetry}
          disabled={isReconnecting}
          loading={isReconnecting}
          className="shrink-0"
        >
          RETRY LINK
        </Button>
      </div>
    );
  }

  // 3. Reconnected / Signal Restored banner
  if (reconnectBannerVisible) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-accent text-white px-3 py-1.5 shrink-0 border-b border-line flex items-center justify-between gap-2 shadow-md z-40 font-data transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white" />
          <span className="text-xs font-bold tracking-wider uppercase">
            CONNECTION RESTORED // SIGNAL STABLE (18ms)
          </span>
        </div>
        <Button
          type="button"
          variant="icon"
          compact
          onClick={dismissReconnectBanner}
          aria-label="Dismiss banner"
          className="text-white p-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Button>
      </div>
    );
  }

  return null;
}
