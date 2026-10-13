'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { soundFx } from '@/lib/audio';
import { Button } from '@/components/ui/Button';

export default function MaintenancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = () => {
    setChecking(true);
    soundFx.playKeystroke();
    setTimeout(() => {
      setChecking(false);
      soundFx.playUiBeep();
    }, 1500);
  };

  return (
    <div className="h-full w-full bg-panel flex flex-col justify-between p-6 font-data text-ink">
      <div className="bg-panel-light border border-line p-3.5 rounded-md flex items-center justify-between">
        <span className="type-label text-[10px] text-money-text font-bold">
          SCHEDULED SUB-GRID INTERRUPT
        </span>
        <span className="text-xs font-data text-ink-muted">SECTOR 07 COOLDOWN</span>
      </div>

      <div className="my-auto max-w-[420px] w-full mx-auto space-y-5 text-center">
        {/* Warning Badge */}
        <div className="w-16 h-16 rounded-md bg-panel-light border border-line shadow-card mx-auto flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-money">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div>
          <span className="type-label text-[10px] text-ink-muted tracking-[2px] uppercase block mb-1">
            GRID MAINTENANCE IN PROGRESS
          </span>
          <h1 className="font-heading text-2xl text-ink">SUBSTATION OUTAGE</h1>
          <p className="text-xs text-ink-muted mt-2 leading-relaxed">
            Corporate Enforcers are conducting scheduled ICE scrubs across the Low Meridian canal junction. High-voltage switching will complete shortly.
          </p>
        </div>

        {/* Maintenance countdown ticker */}
        <div className="bg-panel-light border border-line p-4 rounded-sm space-y-2 text-left">
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">ESTIMATED GRID RETURN:</span>
            <span className="font-data font-bold text-ink">04:30 GMT (~14m)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">AFFECTED NODES:</span>
            <span className="font-data font-bold text-danger-text">ALL DISTRICTS</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">TERMINAL TELEMETRY:</span>
            <span className="font-data font-bold text-money-text">STANDBY MODE</span>
          </div>

          <div className="flex gap-1 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-[1px] ${
                  i < 5 ? 'bg-money' : 'bg-heat-track'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleCheckStatus}
            disabled={checking}
            loading={checking}
            className="flex-1"
          >
            REFRESH GRID STATUS
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/map')}
          >
            FORCE MAP VIEW
          </Button>
        </div>
      </div>

      <div className="text-center pt-2 border-t border-line">
        <span className="type-label text-[9.5px] text-ink-muted">
          SYNDICATE ADVISORY • DO NOT TRANSMIT LIVE CIPHER PACKETS DURING OUTAGE
        </span>
      </div>
    </div>
  );
}
