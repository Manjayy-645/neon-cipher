'use client';

import React from 'react';

interface AttemptPipsProps {
  total: number;
  used: number;
}

export function AttemptPips({ total, used }: AttemptPipsProps) {
  const safeTotal = Math.max(1, total);
  const safeUsed = Math.min(safeTotal, Math.max(0, used));

  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label={`Attempts: ${safeUsed} of ${safeTotal} used`}
    >
      {Array.from({ length: safeTotal }).map((_, i) => {
        const isUsed = i < safeUsed;
        return (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${
              isUsed
                ? 'bg-terminal-danger border border-terminal-danger'
                : 'bg-transparent border border-terminal-line'
            }`}
          />
        );
      })}
    </div>
  );
}
