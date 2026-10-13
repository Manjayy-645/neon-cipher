'use client';

import React from 'react';

interface TimerBarProps {
  totalSeconds: number;
  elapsedSeconds: number;
}

export function TimerBar({ totalSeconds, elapsedSeconds }: TimerBarProps) {
  if (totalSeconds <= 0) return null;

  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const percent = Math.min(100, Math.max(0, (remaining / totalSeconds) * 100));
  const isDanger = remaining <= 10;

  return (
    <div
      className="w-full h-1 bg-terminal-line/40 overflow-hidden"
      role="progressbar"
      aria-label="Time remaining"
      aria-valuenow={remaining}
      aria-valuemin={0}
      aria-valuemax={totalSeconds}
    >
      <div
        className={`h-full transition-all duration-300 ease-linear ${
          isDanger ? 'bg-terminal-danger' : 'bg-terminal-phosphor'
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
