'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { AttemptPips } from '@/features/terminal/components';

interface RivalStatusStripProps {
  handle?: string;
  totalAttempts: number;
  attemptsLeft: number;
  isThinking: boolean;
  lastResultText: string | null;
}

export function RivalStatusStrip({
  handle = 'NULL_BYTE',
  totalAttempts,
  attemptsLeft,
  isThinking,
  lastResultText,
}: RivalStatusStripProps) {
  const shouldReduceMotion = useReducedMotion();
  const usedAttempts = Math.max(0, totalAttempts - attemptsLeft);

  return (
    <div
      role="region"
      aria-label="Rival status bar"
      className="h-10 min-h-[40px] px-4 flex items-center justify-between border-b border-terminal-line bg-terminal-panel/80 text-terminal-ink text-xs font-data select-none shrink-0"
    >
      {/* Left: Rival handle & attempt pips */}
      <div className="flex items-center gap-3">
        <span className="font-bold tracking-wider text-terminal-amber">
          RIVAL: {handle}
        </span>
        <AttemptPips total={totalAttempts} used={usedAttempts} />
      </div>

      {/* Right: Thinking indicator / last result */}
      <div className="flex items-center gap-3">
        {isThinking ? (
          <div className="flex items-center gap-1 text-terminal-muted">
            <span>THINKING</span>
            {shouldReduceMotion ? (
              <span>...</span>
            ) : (
              <span className="animate-pulse tracking-widest font-bold">...</span>
            )}
          </div>
        ) : (
          <div className="text-terminal-muted">
            <span className="text-terminal-muted/70">LAST: </span>
            <span className="text-terminal-ink font-semibold">
              {lastResultText || 'NONE'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
