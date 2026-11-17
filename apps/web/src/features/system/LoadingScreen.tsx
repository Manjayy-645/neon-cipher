'use client';

import { useResettableState } from '@/lib/useResettableState';
import { useEffect, useState } from 'react';
import { useSystemStore } from '@/stores/system-store';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export function LoadingScreen({ message }: { message?: string }) {
  const { globalLoading, loadingMessage } = useSystemStore();
  const activeMsg = message || loadingMessage;
  const isVisible = globalLoading || Boolean(message);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [showLongWait, setShowLongWait] = useResettableState(false, String(activeMsg) + isVisible);

  useEffect(() => {
    if (!isVisible) return;

    const timer = window.setTimeout(() => setShowLongWait(true), 5000);
    return () => window.clearTimeout(timer);
  }, [activeMsg, isVisible, setShowLongWait]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 scene-ground text-ink flex flex-col items-center justify-center p-6 font-data select-none"
    >
      <div className="w-full max-w-[360px] bg-panel-light border border-line rounded-md p-6 shadow-card flex flex-col text-center gap-5">
        <div className="space-y-2">
          <h1 className="font-heading text-title tracking-wide text-ink">
            NEON CIPHER
          </h1>
          <h2 className="type-label text-accent-text">
            {activeMsg}
          </h2>
        </div>

        <div
          role="progressbar"
          aria-label="Loading game"
          className="h-1.5 w-full overflow-hidden rounded-full bg-heat-track"
        >
          <div
            className={`loading-indeterminate h-full w-2/5 bg-accent ${
              prefersReducedMotion ? '' : 'loading-indeterminate-motion'
            }`}
          />
        </div>

        <p className="text-xs text-ink-muted" aria-live="polite">
          {showLongWait
            ? 'This is taking longer than usual. Your saved progress is safe.'
            : 'Synchronizing with the city grid.'}
        </p>
      </div>
    </div>
  );
}
