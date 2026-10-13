'use client';

import React from 'react';
import { DuelSession } from './types';
import { calculateDoubleOrNothing } from '@neon-cipher/game-rules/src/index';
import { Button } from '@/components/ui/Button';

export interface ResolutionModalProps {
  session: DuelSession;
  onDoubleOrNothing: () => void;
  onExit: () => void;
  isRematching?: boolean;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  session,
  onDoubleOrNothing,
  onExit,
  isRematching = false,
}) => {
  const isWinner = session.winner === 'player';
  const isLoser = session.winner === 'rival';
  const isDraw = session.winner === 'draw' || session.status === 'draw';

  const doubleCalc = isWinner ? calculateDoubleOrNothing(session.netPot) : null;
  const timeDelta = session.finishTimeDeltaSeconds ?? 3.4;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="duel-resolution-title"
      data-testid="duel-resolution-modal"
      className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-md bg-panel rounded-lg border border-line shadow-card overflow-hidden flex flex-col animate-scaleUp">
        {/* Header Banner */}
        <div
          className={`p-6 text-center border-b flex flex-col items-center gap-2 ${
            isWinner
              ? 'bg-accent/10 border-accent/40 text-accent-text'
              : isLoser
              ? 'bg-danger/10 border-danger/40 text-danger-text'
              : 'bg-panel-light border-line text-ink'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
              isWinner
                ? 'bg-accent/20 border-accent text-accent'
                : isLoser
                ? 'bg-danger/20 border-danger text-danger'
                : 'bg-panel-dark border-line text-ink-muted'
            }`}
          >
            {isWinner ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
                <path d="M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4Z" />
              </svg>
            ) : isLoser ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="12" r="1" />
                <circle cx="15" cy="12" r="1" />
                <path d="M8 20v2h8v-2" />
                <path d="m12.5 17-.5-1-.5 1h1z" />
                <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="M7 21h10" />
                <path d="M12 3v18" />
                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
              </svg>
            )}
          </div>

          <div>
            <div className="font-data text-[10px] tracking-widest uppercase font-bold opacity-80">
              {isWinner
                ? 'BREACH SECURED // SYSTEM OVERRIDE'
                : isLoser
                ? 'CONNECTION SEVERED // BREACH FAILED'
                : 'STALEMATE // SHARED CYCLES DEPLETED'}
            </div>
            <h2 id="duel-resolution-title" className="font-heading text-2xl font-bold mt-1 text-ink">
              {isWinner ? 'VICTORY' : isLoser ? 'DEFEAT' : 'DRAW'}
            </h2>
          </div>

          {session.secret && (
            <div className="mt-2 px-3 py-1 bg-panel-dark text-panel-light rounded border border-line font-data text-xs flex items-center gap-2">
              <span className="text-ink-muted uppercase">Target Code:</span>
              <span className="font-black text-sm tracking-widest text-accent">
                {session.secret}
              </span>
            </div>
          )}
        </div>

        {/* Breakdown Body */}
        <div className="p-6 flex flex-col gap-4 bg-panel-light">
          {/* Performance & Time Delta */}
          <div className="p-3 bg-panel rounded border border-line flex items-center justify-between font-data text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-danger/40 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Character portraits/Null_Byte.png" alt="Null_Byte" className="w-full h-full object-cover" />
              </div>
              <span className="text-ink-muted uppercase">Execution Delta</span>
            </div>
            <span
              data-testid="time-delta"
              className={`font-bold ${isWinner ? 'text-accent-text' : isLoser ? 'text-danger-text' : 'text-ink'}`}
            >
              {isWinner
                ? `+${timeDelta.toFixed(1)}s FASTER THAN NULL_BYTE`
                : isLoser
                ? `-${timeDelta.toFixed(1)}s SLOWER`
                : 'EQUAL PACE'}
            </span>
          </div>

          {/* Cheat Used Flag */}
          {session.player.cheatUsed && (
            <div
              data-testid="cheat-used-badge"
              className="p-2.5 bg-danger/10 border border-danger/30 rounded flex items-center gap-2 text-danger-text font-data text-xs font-bold uppercase tracking-wider"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-danger" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>CHEAT USED IN CASUAL MATCH</span>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="bg-panel rounded border border-line p-4 flex flex-col gap-2 font-data text-xs">
            <div className="flex justify-between items-center text-ink-muted">
              <span>Match Type</span>
              <span className="font-bold text-ink uppercase">{session.matchType}</span>
            </div>
            <div className="flex justify-between items-center text-ink-muted">
              <span>Your Wager</span>
              <span className="font-bold text-ink">{session.wager.toLocaleString()} CR</span>
            </div>
            {isWinner && (
              <>
                <div className="flex justify-between items-center text-ink-muted">
                  <span>Gross Pot (2x)</span>
                  <span className="font-bold text-ink">{session.totalPot.toLocaleString()} CR</span>
                </div>
                <div className="flex justify-between items-center text-danger-text">
                  <span>Syndicate Rake (10%)</span>
                  <span className="font-bold">-{session.rake.toLocaleString()} CR</span>
                </div>
                <div className="h-px bg-line my-1" />
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-ink">Net Payout</span>
                  <span data-testid="net-payout" className="text-money text-base">
                    +{session.netPot.toLocaleString()} CR
                  </span>
                </div>
              </>
            )}
            {isLoser && (
              <>
                <div className="h-px bg-line my-1" />
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-ink">Net Change</span>
                  <span data-testid="net-loss" className="text-danger text-base">
                    -{session.wager.toLocaleString()} CR
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-2">
            {isWinner && doubleCalc && (
              <Button
                type="button"
                variant="primary"
                fullWidth
                data-testid="double-or-nothing-button"
                disabled={isRematching}
                loading={isRematching}
                onClick={onDoubleOrNothing}
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>DOUBLE OR NOTHING ({doubleCalc.netPot.toLocaleString()} CR NET)</span>
                </span>
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              fullWidth
              data-testid="exit-duel-button"
              onClick={onExit}
            >
              EXIT TO LOBBY
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
