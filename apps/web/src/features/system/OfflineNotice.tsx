'use client';

import React from 'react';
import { useSystemStore } from '@/stores/system-store';
import { soundFx } from '@/lib/audio';
import { Button } from '@/components/ui/Button';

export function OfflineNotice() {
  const { offlineNoticeVisible, setOfflineNoticeVisible, setSimulatedOffline, setOnline } = useSystemStore();

  if (!offlineNoticeVisible) return null;

  const handleTestConnection = () => {
    soundFx.playKeystroke();
    setTimeout(() => {
      setSimulatedOffline(false);
      setOnline(true);
      setOfflineNoticeVisible(false);
      soundFx.playSuccess();
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-data text-ink"
    >
      <div className="w-full max-w-[420px] bg-panel-light border border-line rounded-lg p-6 shadow-sheet space-y-4">
        <div className="flex items-center gap-2.5 text-danger-text">
          <svg
            className="w-5 h-5 text-danger shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 id="offline-title" className="font-heading text-xl text-ink font-bold tracking-wide">
            OFFLINE PROTOCOL
          </h2>
        </div>

        <p className="text-xs text-ink leading-relaxed">
          OFFLINE PROTOCOL ENGAGED: Cyberdeck is disconnected from the Low Meridian network backbone. Remote node telemetry and live duels are paused until carrier link is re-acquired.
        </p>

        <div className="bg-panel p-3 rounded-sm border border-line space-y-1 text-xs">
          <div className="flex justify-between text-ink-muted">
            <span>SUBNET STATUS:</span>
            <span className="text-danger-text font-bold">UNREACHABLE</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>LOCAL CACHE:</span>
            <span className="text-accent-text font-bold">ACTIVE (READ-ONLY)</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            compact
            onClick={handleTestConnection}
            className="flex-1"
          >
            TEST CONNECTION
          </Button>
          <Button
            type="button"
            variant="secondary"
            compact
            onClick={() => setOfflineNoticeVisible(false)}
          >
            DISMISS
          </Button>
        </div>
      </div>
    </div>
  );
}
