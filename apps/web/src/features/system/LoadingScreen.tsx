'use client';

import React from 'react';
import { useSystemStore } from '@/stores/system-store';
import { Button } from '@/components/ui/Button';

export function LoadingScreen({ message }: { message?: string }) {
  const { globalLoading, loadingMessage, setGlobalLoading } = useSystemStore();

  const activeMsg = message || loadingMessage;
  if (!globalLoading && !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-surface="terminal"
      className="fixed inset-0 z-50 bg-[var(--terminal-bg,#1B1915)]/90 text-ink flex flex-col items-center justify-center p-6 font-data select-none"
    >
      <div className="w-full max-w-[360px] bg-panel border border-line rounded-md p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
        {/* Animated terminal spinner */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-line border-t-accent animate-spin" />
          <div className="absolute w-6 h-6 rounded-full border border-accent/40 animate-ping" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xs font-data font-bold tracking-[2px] text-accent uppercase">
            {activeMsg}
          </h2>
          <p className="text-[11px] font-data text-ink-muted">
            SYNCHRONIZING WITH LOW MERIDIAN SUB-GRID
          </p>
        </div>

        {/* Pulse segments */}
        <div className="flex gap-1.5 w-full justify-center pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 bg-accent/40 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>

        {/* Allow dismissing in dev */}
        <Button
          type="button"
          variant="ghost"
          compact
          onClick={() => setGlobalLoading(false)}
          className="text-[10px]"
        >
          BYPASS LOADING
        </Button>
      </div>
    </div>
  );
}
