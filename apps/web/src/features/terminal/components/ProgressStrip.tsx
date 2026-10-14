'use client';

import React from 'react';
import { GuessRecord } from '@neon-cipher/game-rules';

interface ProgressStripProps {
  currentAttempt: number;
  maxAttempts: number | null;
  best: GuessRecord | null;
  totalSeconds: number | null;
  elapsedSeconds: number;
}

export function ProgressStrip({
  currentAttempt,
  maxAttempts,
  best,
  totalSeconds,
  elapsedSeconds,
}: ProgressStripProps) {
  const safeTotalSeconds = totalSeconds ?? 0;
  const remainingSeconds = Math.max(0, safeTotalSeconds - elapsedSeconds);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const bestSummary = best
    ? best.pans === 0 && best.pots === 0
      ? '0 PAN 0 POT'
      : `${best.pans > 0 ? `${best.pans} PAN` : ''}${
          best.pans > 0 && best.pots > 0 ? ' ' : ''
        }${best.pots > 0 ? `${best.pots} POT` : ''}`
    : 'NONE';

  return (
    <div
      role="region"
      aria-label="Progress summary"
      className="h-[32px] min-h-[32px] px-4 flex items-center justify-between border-y border-terminal-line/40 bg-terminal-panel/30 text-terminal-muted font-data text-xs tracking-wider"
    >
      <div>
        <span className="text-terminal-muted">ATTEMPT </span>
        <span className="text-terminal-ink font-semibold">
          {maxAttempts != null ? `${Math.min(currentAttempt, maxAttempts)}/${maxAttempts}` : currentAttempt}
        </span>
      </div>

      <div>
        <span className="text-terminal-muted">BEST: </span>
        <span className="text-terminal-ink font-semibold">{bestSummary}</span>
      </div>

      <div>
        <span className="text-terminal-muted">TIME </span>
        <span
          className={`font-semibold ${
            totalSeconds != null && remainingSeconds <= 10 && totalSeconds > 0
              ? 'text-terminal-danger'
              : 'text-terminal-ink'
          }`}
        >
          {totalSeconds != null ? timeFormatted : '--:--'}
        </span>
      </div>
    </div>
  );
}
