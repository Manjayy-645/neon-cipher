'use client';

import React from 'react';
import { useDuelStore } from '@/stores/duel-store';
import { Button } from '@/components/ui/Button';

export function DuelResolutionModal() {
  const { activeSession, doubleOrNothing, exitDuel, isLoading } = useDuelStore();

  if (!activeSession || activeSession.status === 'active') {
    return null;
  }

  const isPlayerWinner = activeSession.status === 'player_won';
  const isRivalWinner = activeSession.status === 'rival_won';
  const isDraw = activeSession.status === 'draw';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Duel Resolution"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 animate-fade-in"
    >
      <div className="w-full max-w-sm bg-panel-light border border-line rounded-lg shadow-sheet p-6 flex flex-col gap-5 text-center relative overflow-hidden">
        {/* Glow Header Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isPlayerWinner ? 'bg-accent' : isRivalWinner ? 'bg-danger' : 'bg-heat-track'
          }`}
        />

        {/* Status Icon */}
        <div className="flex justify-center mt-1">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
              isPlayerWinner
                ? 'bg-accent/15 border-accent text-accent'
                : isRivalWinner
                ? 'bg-danger/15 border-danger text-danger'
                : 'bg-heat-track/30 border-line text-ink-muted'
            }`}
          >
            {isPlayerWinner ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
                <path d="M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4Z" />
              </svg>
            ) : isRivalWinner ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="12" r="1" />
                <circle cx="15" cy="12" r="1" />
                <path d="M8 20v2h8v-2" />
                <path d="m12.5 17-.5-1-.5 1h1z" />
                <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="M7 21h10" />
                <path d="M12 3v18" />
                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
              </svg>
            )}
          </div>
        </div>

        {/* Title and Subtitle */}
        <div>
          <div
            className={`font-data text-[10px] uppercase tracking-widest font-bold mb-1 ${
              isPlayerWinner ? 'text-accent-text' : isRivalWinner ? 'text-danger-text' : 'text-ink-muted'
            }`}
          >
            DUEL RESOLVED // 1v1 PROTOCOL
          </div>
          <h2 className="font-heading text-2xl font-bold text-ink">
            {isPlayerWinner
              ? 'BREACH VICTORY'
              : isRivalWinner
              ? 'SYSTEM LOCKOUT'
              : 'MUTUAL STALEMATE'}
          </h2>
          <p className="font-data text-xs text-ink-muted mt-1">
            {isPlayerWinner
              ? `You cracked the encryption before ${activeSession.rival.handle}!`
              : isRivalWinner
              ? `${activeSession.rival.handle} solved the code and seized the pot.`
              : 'Both decks exhausted attempts without finding the master sequence.'}
          </p>
        </div>

        {/* Time and Telemetry Stats */}
        <div className="bg-panel rounded-md border border-line p-3 flex flex-col gap-2 font-data text-xs">
          <div className="flex justify-between items-center text-ink-muted">
            <span>ELAPSED TIME</span>
            <span className="font-bold text-ink font-mono">
              {activeSession.finishTimeDeltaSeconds ?? 0}s
            </span>
          </div>

          <div className="flex justify-between items-center text-ink-muted">
            <span>TOTAL POT</span>
            <span className="font-bold text-money-text font-mono">
              {activeSession.totalPot.toLocaleString()} CR
            </span>
          </div>

          <div className="flex justify-between items-center text-ink-muted">
            <span>SYNDICATE RAKE (10%)</span>
            <span className="font-bold text-danger-text font-mono">
              -{activeSession.rake.toLocaleString()} CR
            </span>
          </div>

          <div className="border-t border-line/60 pt-2 flex justify-between items-center text-ink font-semibold">
            <span>NET EARNINGS</span>
            <span
              className={`font-bold font-mono text-sm ${
                isPlayerWinner ? 'text-accent-text' : 'text-ink-muted'
              }`}
            >
              {isPlayerWinner ? `+${activeSession.netPot.toLocaleString()} CR` : '0 CR'}
            </span>
          </div>
        </div>

        {/* Cheat / Exploit Flag if active */}
        {activeSession.player.cheatUsed && (
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-sm font-data text-[10px] text-amber-800 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>NOTICE: EXPLOIT USED IN CASUAL SESSION</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Double or Nothing (available on victory or draw) */}
          <Button
            variant="primary"
            fullWidth
            onClick={() => doubleOrNothing()}
            disabled={isLoading}
            loading={isLoading}
            data-testid="double-or-nothing-button"
            className="flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>DOUBLE OR NOTHING</span>
          </Button>

          {/* Exit Duel */}
          <Button
            variant="secondary"
            fullWidth
            onClick={() => exitDuel()}
            disabled={isLoading}
            data-testid="exit-duel-button"
          >
            EXIT TO LOBBY
          </Button>
        </div>
      </div>
    </div>
  );
}
