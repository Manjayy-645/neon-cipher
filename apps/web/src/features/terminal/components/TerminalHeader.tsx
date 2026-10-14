'use client';

import React from 'react';
import { AttemptPips } from './AttemptPips';
import { TimerBar } from './TimerBar';
import { IceIndicator } from '../IceIndicator';
import { SessionConfig } from '../terminalService';

interface TerminalHeaderProps {
  nodeName: string;
  config: SessionConfig;
  usedAttempts: number;
  elapsedSeconds: number;
  onOpenLegend: () => void;
}

export function TerminalHeader({
  nodeName,
  config,
  usedAttempts,
  elapsedSeconds,
  onOpenLegend,
}: TerminalHeaderProps) {
  const tierLabel = `TIER ${config.tier} • ${config.allowDuplicates ? 'DUPLICATES' : 'UNIQUE'}`;

  return (
    <header className="h-[72px] min-h-[72px] w-full flex flex-col justify-between bg-terminal-panel/90 border-b border-terminal-line shrink-0 relative">
      <div className="flex-1 px-4 flex items-center justify-between gap-3">
        {/* Left: Node Name & Tier Chip */}
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="font-heading text-[18px] text-terminal-ink truncate font-medium">
            {nodeName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-data text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded-[4px] bg-terminal-bg border border-terminal-line/60 text-terminal-muted">
              {tierLabel}
            </span>
            {/* ICE chip slot (display only) */}
            {config.ice && config.ice !== 'None' && (
              <IceIndicator ice={config.ice} />
            )}
          </div>
        </div>

        {/* Right: Attempt Pips & Help Button */}
        <div className="flex items-center gap-3 shrink-0">
          {config.attempts != null && (
            <AttemptPips total={config.attempts} used={usedAttempts} />
          )}

          {/* "?" Button for Clue Legend */}
          <button
            type="button"
            onClick={onOpenLegend}
            aria-label="Open Clue Legend"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-[6px] border border-terminal-line bg-terminal-bg text-terminal-ink hover:border-terminal-phosphor font-data text-sm font-bold flex items-center justify-center transition-colors"
          >
            ?
          </button>
        </div>
      </div>

      {/* Timer Bar (4px, drains left to right, danger under 10s) */}
      {config.timerSeconds != null && (
        <TimerBar
          totalSeconds={config.timerSeconds}
          elapsedSeconds={elapsedSeconds}
        />
      )}
    </header>
  );
}
