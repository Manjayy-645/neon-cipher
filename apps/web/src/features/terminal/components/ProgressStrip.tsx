'use client';

import React from 'react';
import { GuessRecord } from '@neon-cipher/game-rules';

interface ProgressStripProps {
  currentAttempt: number;
  maxAttempts: number;
  best: GuessRecord | null;
  totalSeconds: number;
  elapsedSeconds: number;
}

export function ProgressStrip({
  currentAttempt,
  maxAttempts,
  best,
  totalSeconds,
  elapsedSeconds,
}: ProgressStripProps) {
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const bestSummary = best
    ? best.pots === 0 && best.pans === 0
      ? '0 POT 0 PAN'
      : `${best.pots > 0 ? `${best.pots} POT` : ''}${
          best.pots > 0 && best.pans > 0 ? ' ' : ''
        }${best.pans > 0 ? `${best.pans} PAN` : ''}`
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
          {Math.min(currentAttempt, maxAttempts)}/{maxAttempts}
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
            remainingSeconds <= 10 && totalSeconds > 0
              ? 'text-terminal-danger'
              : 'text-terminal-ink'
          }`}
        >
          {timeFormatted}
        </span>
      </div>
    </div>
  );
}
