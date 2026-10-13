'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="h-full w-full bg-panel flex flex-col justify-between p-6 font-data text-ink">
      <div className="bg-panel-light border border-line p-3.5 rounded-md flex items-center justify-between">
        <span className="type-label text-[10px] text-danger-text font-bold">
          FAULT DETECTED // 0xDEADBEEF
        </span>
        <span className="text-xs font-data text-ink-muted">REASON: RUNTIME_FAULT</span>
      </div>

      <div className="my-auto max-w-[420px] w-full mx-auto space-y-4 text-center">
        <div className="w-14 h-14 rounded-full bg-danger/10 border-2 border-danger text-danger mx-auto flex items-center justify-center font-bold text-2xl">
          ✕
        </div>

        <div>
          <h1 className="font-heading text-2xl text-ink">KERNEL PANIC</h1>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Deck memory bus experienced an unexpected parity fault. Fail-safes have isolated the executing thread.
          </p>
        </div>

        <div className="bg-panel-light border border-line p-3 rounded-sm text-left font-data text-xs text-danger-text break-all max-h-[120px] overflow-y-auto">
          {error?.message || 'Unknown sub-routine crash.'}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => reset()}
            className="flex-1"
          >
            REBOOT RIG
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/map')}
          >
            RETURN TO MAP
          </Button>
        </div>
      </div>

      <div className="text-center pt-2 border-t border-line">
        <span className="type-label text-[9.5px] text-ink-muted">
          HARDWARE PARITY CHECK FAILED • DECK TELEMETRY REPORT FILED
        </span>
      </div>
    </div>
  );
}
