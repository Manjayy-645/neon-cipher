'use client';

import React, { useState } from 'react';
import { DailyBreachData } from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

interface DailyBreachViewProps {
  data: DailyBreachData;
  onSubmitAttempt: (guesses: number, timeSeconds: number) => void;
  submitting?: boolean;
}

export const DailyBreachView: React.FC<DailyBreachViewProps> = ({
  data,
  onSubmitAttempt,
  submitting,
}) => {
  const [simGuesses, setSimGuesses] = useState(4);
  const [simSeconds, setSimSeconds] = useState(42);

  return (
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 sm:p-5 text-ink font-data shadow-card space-y-6">
      {/* Header with seeded date and target info */}
      <div className="border-b border-line pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-wide text-ink">DAILY BREACH</h2>
            <span className="type-label bg-money/15 text-money-text border border-money/30 px-2 py-0.5 rounded-sm text-[10px] font-bold">
              SEEDED: {data.seed}
            </span>
          </div>
          <p className="type-label text-[10px] text-ink-muted mt-0.5">ONE GLOBAL CIPHER PER DAY • COMPETE WORLDWIDE</p>
        </div>
        <div className="text-left sm:text-right shrink-0 bg-panel border border-line px-3 py-1.5 rounded-sm shadow-xs">
          <span className="type-label text-[9px] block text-ink-muted">TODAY'S DATE</span>
          <span className="font-bold text-xs sm:text-sm text-ink tabular-nums">{data.date}</span>
        </div>
      </div>

      {/* Target Node Briefing */}
      <div className="bg-panel border border-line p-4 sm:p-4.5 rounded-sm space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-line/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="type-label text-[10px] bg-accent/10 text-accent-text border border-accent/20 px-1.5 py-0.2 rounded-sm font-bold">
                TARGET APEX
              </span>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-ink">{data.nodeName}</h3>
            </div>
            <span className="text-xs text-ink-muted mt-0.5 block">Tier {data.tier} Corporate Node • {data.digits} Digits</span>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="type-label text-[9px] block text-ink-muted">DAILY BOUNTY</span>
            <span className="font-bold text-money-text text-xl sm:text-2xl tabular-nums">${data.bounty.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center text-xs">
          <div className="bg-panel-light border border-line p-2.5 sm:p-3 rounded-sm shadow-xs">
            <span className="type-label text-[9.5px] block text-ink-muted">MAX ATTEMPTS</span>
            <span className="font-bold text-ink text-sm sm:text-base tabular-nums mt-0.5 block">{data.maxAttempts} Tries</span>
          </div>
          <div className="bg-panel-light border border-line p-2.5 sm:p-3 rounded-sm shadow-xs">
            <span className="type-label text-[9.5px] block text-ink-muted">TIME LIMIT</span>
            <span className="font-bold text-ink text-sm sm:text-base tabular-nums mt-0.5 block">{data.timeLimitSeconds}s</span>
          </div>
          <div className="bg-panel-light border border-line p-2.5 sm:p-3 rounded-sm shadow-xs">
            <span className="type-label text-[9.5px] block text-ink-muted">DUPLICATES</span>
            <span className="font-bold text-ink text-sm sm:text-base mt-0.5 block">{data.allowDuplicates ? 'ALLOWED' : 'NONE'}</span>
          </div>
        </div>

        {/* User Status / Attempt Runner */}
        {data.userCompleted && data.userResult ? (
          <div className="bg-accent/15 border border-accent/40 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="space-y-1">
              <span className="font-bold text-accent-text text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                ✓ DAILY BREACH COMPLETED
              </span>
              <span className="text-ink-muted block text-xs">
                Solved in {data.userResult.guessesCount} guesses • {data.userResult.timeSeconds} seconds
              </span>
            </div>
            <div className="text-left sm:text-right bg-panel border border-line px-3 py-1.5 rounded-sm shrink-0">
              <span className="type-label text-[9px] block text-ink-muted">GLOBAL RANK</span>
              <span className="font-bold text-accent-text text-lg sm:text-xl tabular-nums">#{data.userResult.rank}</span>
            </div>
          </div>
        ) : (
          <div className="bg-panel-light border border-line p-3.5 sm:p-4 rounded-sm space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-xs">
              <span className="font-bold text-ink flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Simulate Daily Jack-In:
              </span>
              <span className="text-[11px] text-ink-muted">Fewest guesses & fastest time rank highest</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <span className="type-label text-[9px] text-ink-muted block">PROBE GUESS COUNT</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={simGuesses}
                  onChange={(e) => setSimGuesses(Number(e.target.value))}
                  aria-label="Simulation guess count"
                  className="w-full p-2.5 bg-panel border border-line rounded-sm text-xs font-bold text-ink min-h-[44px]"
                  placeholder="Guesses"
                />
              </div>
              <div className="space-y-1">
                <span className="type-label text-[9px] text-ink-muted block">CLOCK TIME (SECONDS)</span>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={simSeconds}
                  onChange={(e) => setSimSeconds(Number(e.target.value))}
                  aria-label="Simulation time seconds"
                  className="w-full p-2.5 bg-panel border border-line rounded-sm text-xs font-bold text-ink min-h-[44px]"
                  placeholder="Seconds"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={submitting}
              loading={submitting}
              onClick={() => onSubmitAttempt(simGuesses, simSeconds)}
              className="min-h-[44px] font-bold"
            >
              SUBMIT DAILY ATTEMPT
            </Button>
          </div>
        )}
      </div>

      {/* Global Leaderboard */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="type-label text-[10px] font-bold text-ink">GLOBAL LEADERBOARD (MOCK DATA)</h3>
          <span className="text-[10px] text-ink-muted">Worldwide Decker Standings</span>
        </div>
        <div className="space-y-2">
          {data.leaderboard.map((entry) => {
            const isUser = entry.handle === 'ZERO_COOL';
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.rank}
                className={`p-3 rounded-sm border flex items-center justify-between text-xs transition-colors shadow-xs ${
                  isUser
                    ? 'bg-accent/15 border-accent/60 ring-1 ring-accent/30 font-bold'
                    : 'bg-panel border-line hover:border-ink/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-heading text-sm w-6 text-center font-bold shrink-0 ${
                      entry.rank === 1
                        ? 'text-money-text'
                        : entry.rank === 2
                        ? 'text-ink'
                        : entry.rank === 3
                        ? 'text-amber-700'
                        : 'text-ink-muted'
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <div className="w-7 h-7 rounded-sm border border-line bg-panel-light flex items-center justify-center shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.avatarUrl} alt="" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-ink truncate">{entry.handle}</span>
                      {isUser && (
                        <span className="type-label text-[8.5px] bg-accent/20 text-accent-text border border-accent/40 px-1 py-0.2 rounded-sm font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-ink-muted block mt-0.5">{entry.completedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 text-right shrink-0">
                  <div>
                    <span className="font-bold text-accent-text block tabular-nums">{entry.guessesCount} guesses</span>
                    <span className="text-[10px] text-ink-muted block tabular-nums">{entry.timeSeconds}s</span>
                  </div>
                  <span className="type-label text-[9px] px-2 py-1 rounded-sm bg-panel-light border border-line font-bold">
                    {entry.rewardTier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
