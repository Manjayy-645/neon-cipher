'use client';

import React from 'react';
import { AttemptPips } from './AttemptPips';
import { TimerBar } from './TimerBar';
import { IceIndicator } from '../IceIndicator';
import { SessionConfig } from '../terminalService';

interface TerminalHeaderProps {
  nodeName: string;
  nodeId?: string;
  config: SessionConfig;
  usedAttempts: number;
  elapsedSeconds: number;
  onOpenLegend: () => void;
}

export function TerminalHeader({
  nodeName,
  nodeId,
  config,
  usedAttempts,
  elapsedSeconds,
  onOpenLegend,
}: TerminalHeaderProps) {
  const tierLabel = `TIER ${config.tier} • ${config.allowDuplicates ? 'DUPLICATES' : 'UNIQUE'}`;

  const displayName =
    nodeId && !nodeName.toLowerCase().includes(nodeId.toLowerCase())
      ? `${nodeName} (Node: ${nodeId})`
      : nodeName;

  return (
    <header className="h-[72px] min-h-[72px] terminal-compact-strip w-full flex flex-col justify-between bg-terminal-panel/90 border-b border-terminal-line shrink-0 relative">
      <div className="flex-1 px-4 flex items-center justify-between gap-3">
        {/* Left: Node Name & Tier Chip */}
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="font-heading text-[18px] text-terminal-ink truncate font-medium">
            {displayName}
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

          {/* Nix Pip Button for Clue Legend */}
          <button
            type="button"
            onClick={onOpenLegend}
            aria-label="Open Clue Legend"
            title="Ask Nix: Clue Legend"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-terminal-line bg-terminal-panel hover:border-terminal-phosphor overflow-hidden flex items-center justify-center p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-terminal-phosphor relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Character portraits/Nix.png"
              alt="Nix"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="sr-only">Open Clue Legend</span>
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
