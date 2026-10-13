'use client';

import React from 'react';

interface HiddenGuessRowProps {
  length: number;
  timeOffsetMs: number;
  isNew?: boolean;
}

export function HiddenGuessRow({
  length,
  timeOffsetMs,
  isNew = false,
}: HiddenGuessRowProps) {
  const totalSeconds = Math.floor(timeOffsetMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `+${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      role="listitem"
      aria-label="Rival made a hidden guess."
      className={`h-[56px] min-h-[56px] px-3 rounded-[6px] border flex items-center justify-between gap-3 bg-terminal-panel/50 relative overflow-hidden transition-all ${
        isNew
          ? 'border-terminal-amber/80 shadow-[0_0_12px_rgba(224,174,92,0.25)]'
          : 'border-terminal-line/60'
      }`}
    >
      {/* Hatched left band for rival */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--terminal-amber), var(--terminal-amber) 2px, transparent 2px, transparent 4px)',
        }}
      />

      {/* Left: Tag & Time offset */}
      <div className="flex items-center gap-2 pl-2 shrink-0">
        <span className="font-data text-[10px] font-bold text-terminal-amber px-1 rounded-[3px] bg-terminal-amber/15 border border-terminal-amber/30 uppercase">
          RIVAL
        </span>
        <span className="font-data text-xs text-terminal-muted">{timeFormatted}</span>
      </div>

      {/* Masked tiles + Lock icon */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-5 h-5 rounded flex items-center justify-center text-terminal-muted/80">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        {Array.from({ length: length }).map((_, i) => (
          <div
            key={i}
            className="w-[36px] h-[44px] rounded-[6px] border border-terminal-line/40 bg-terminal-panel/80 flex items-center justify-center font-data text-base font-bold text-terminal-muted/60 select-none"
          >
            ?
          </div>
        ))}
      </div>

      {/* Replaced Clue marks with "??" and "HIDDEN" badge */}
      <div className="flex items-center gap-2 shrink-0 pr-1">
        <span className="font-data text-sm font-bold tracking-widest text-terminal-muted">
          ??
        </span>
        <span className="font-data text-[10px] font-semibold tracking-wider uppercase text-terminal-muted px-1.5 py-0.5 rounded-[4px] bg-terminal-bg border border-terminal-line/40">
          HIDDEN
        </span>
        {isNew && (
          <span className="font-data text-[9px] font-bold tracking-wider px-1 py-0.2 rounded bg-terminal-amber text-terminal-bg">
            NEW
          </span>
        )}
      </div>
    </div>
  );
}
