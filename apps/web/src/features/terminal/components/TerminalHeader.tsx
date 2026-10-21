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
  onExit?: () => void;
  exitLabel?: string;
  onTogglePause?: () => void;
  isPaused?: boolean;
}

export function TerminalHeader({
  nodeName,
  nodeId,
  config,
  usedAttempts,
  elapsedSeconds,
  onOpenLegend,
  onExit,
  exitLabel,
  onTogglePause,
  isPaused = false,
}: TerminalHeaderProps) {
  const tierLabel = `TIER ${config.tier} • ${config.allowDuplicates ? 'DUPLICATES' : 'UNIQUE'}`;

  const displayName =
    nodeId && !nodeName.toLowerCase().includes(nodeId.toLowerCase())
      ? `${nodeName} (Node: ${nodeId})`
      : nodeName;

  return (
    <header className="h-[52px] min-h-[52px] sm:h-[56px] sm:min-h-[56px] terminal-compact-strip w-full flex flex-col justify-between bg-terminal-panel/90 border-b border-terminal-line shrink-0 relative">
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

        {/* Right: Attempt Pips, Exit Button, Pause Button & Help Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              data-testid="exit-tutorial-button"
              aria-label="Exit tutorial"
              title="Exit tutorial and return to map"
              className="h-11 min-h-[44px] px-2.5 sm:px-3 rounded-[6px] border border-terminal-line bg-terminal-panel hover:border-terminal-danger hover:text-terminal-danger text-terminal-muted font-data text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-terminal-phosphor"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-terminal-danger" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">{exitLabel || 'EXIT TUTORIAL'}</span>
              <span className="sm:hidden">EXIT</span>
            </button>
          )}

          {onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              data-testid="terminal-pause-button"
              aria-label={isPaused ? 'Resume breach' : 'Pause breach timer'}
              title={isPaused ? 'Resume breach timer' : 'Pause breach timer'}
              className={`h-11 min-h-[44px] px-2.5 sm:px-3 rounded-[6px] border font-data text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-terminal-phosphor ${
                isPaused
                  ? 'border-terminal-phosphor bg-terminal-phosphor/20 text-terminal-phosphor'
                  : 'border-terminal-line bg-terminal-panel hover:border-terminal-phosphor text-terminal-muted hover:text-terminal-ink'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
                {isPaused ? (
                  <polygon points="5 3 19 12 5 21 5 3" />
                ) : (
                  <>
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </>
                )}
              </svg>
              <span className="hidden sm:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
              <span className="sm:hidden">{isPaused ? '▶' : '⏸'}</span>
            </button>
          )}

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
