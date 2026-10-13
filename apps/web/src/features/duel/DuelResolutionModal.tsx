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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-sm animate-fade-in"
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
            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 ${
              isPlayerWinner
                ? 'bg-accent/15 border-accent text-accent'
                : isRivalWinner
                ? 'bg-danger/15 border-danger text-danger'
                : 'bg-heat-track/30 border-line text-ink-muted'
            }`}
          >
            {isPlayerWinner ? '🏆' : isRivalWinner ? '💀' : '⚖️'}
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
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-sm font-data text-[10px] text-amber-800 font-bold uppercase tracking-wider">
            ⚠️ NOTICE: EXPLOIT USED IN CASUAL SESSION
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
          >
            ⚡ DOUBLE OR NOTHING
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
