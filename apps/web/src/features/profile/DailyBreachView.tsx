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
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 text-ink font-data shadow-card space-y-4">
      {/* Header with seeded date and target info */}
      <div className="border-b border-line pb-3 flex justify-between items-start gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-title tracking-wide">DAILY BREACH</h2>
            <span className="type-label bg-money/15 text-money-text border border-money/30 px-1.5 py-0.5 rounded-sm text-[10px]">
              SEEDED: {data.seed}
            </span>
          </div>
          <p className="type-label text-[10px] text-ink-muted">ONE GLOBAL CIPHER PER DAY • COMPETE WORLDWIDE</p>
        </div>
        <div className="text-right shrink-0">
          <span className="type-label text-[9px] block">TODAY'S DATE</span>
          <span className="font-bold text-xs text-ink">{data.date}</span>
        </div>
      </div>

      {/* Target Node Briefing */}
      <div className="bg-panel border border-line p-3.5 rounded-sm space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-heading text-base font-bold text-ink">{data.nodeName}</h3>
            <span className="text-xs text-ink-muted">Tier {data.tier} Corporate Node • {data.digits} Digits</span>
          </div>
          <div className="text-right">
            <span className="type-label text-[9px] block">DAILY BOUNTY</span>
            <span className="font-bold text-money-text text-base">${data.bounty.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-panel-light border border-line p-2 rounded-sm">
            <span className="type-label text-[9px] block">MAX ATTEMPTS</span>
            <span className="font-bold text-ink">{data.maxAttempts} Tries</span>
          </div>
          <div className="bg-panel-light border border-line p-2 rounded-sm">
            <span className="type-label text-[9px] block">TIME LIMIT</span>
            <span className="font-bold text-ink">{data.timeLimitSeconds}s</span>
          </div>
          <div className="bg-panel-light border border-line p-2 rounded-sm">
            <span className="type-label text-[9px] block">DUPLICATES</span>
            <span className="font-bold text-ink">{data.allowDuplicates ? 'ALLOWED' : 'NONE'}</span>
          </div>
        </div>

        {/* User Status / Attempt Runner */}
        {data.userCompleted && data.userResult ? (
          <div className="bg-accent/10 border border-accent/30 p-3 rounded-sm flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-accent-text block">✓ DAILY BREACH COMPLETED</span>
              <span className="text-ink-muted">
                Solved in {data.userResult.guessesCount} guesses • {data.userResult.timeSeconds} seconds
              </span>
            </div>
            <div className="text-right">
              <span className="type-label text-[9px] block">GLOBAL RANK</span>
              <span className="font-bold text-accent-text text-base">#{data.userResult.rank}</span>
            </div>
          </div>
        ) : (
          <div className="bg-panel-light border border-line p-3 rounded-sm space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-ink">Simulate Daily Jack-In:</span>
              <span className="text-[11px] text-ink-muted">Fewest guesses & fastest time rank highest</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={simGuesses}
                onChange={(e) => setSimGuesses(Number(e.target.value))}
                aria-label="Simulation guess count"
                className="w-1/2 p-2 bg-panel border border-line rounded-sm text-xs text-ink"
                placeholder="Guesses"
              />
              <input
                type="number"
                min="5"
                max="120"
                value={simSeconds}
                onChange={(e) => setSimSeconds(Number(e.target.value))}
                aria-label="Simulation time seconds"
                className="w-1/2 p-2 bg-panel border border-line rounded-sm text-xs text-ink"
                placeholder="Seconds"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              fullWidth
              disabled={submitting}
              loading={submitting}
              onClick={() => onSubmitAttempt(simGuesses, simSeconds)}
            >
              SUBMIT DAILY ATTEMPT
            </Button>
          </div>
        )}
      </div>

      {/* Global Leaderboard */}
      <div className="space-y-2">
        <h3 className="type-label text-[10px] text-ink-muted">GLOBAL LEADERBOARD (MOCK DATA)</h3>
        <div className="space-y-1.5">
          {data.leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`p-2.5 rounded-sm border flex items-center justify-between text-xs ${
                entry.handle === 'ZERO_COOL'
                  ? 'bg-accent/10 border-accent/40 font-bold'
                  : 'bg-panel border-line'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-heading text-sm text-ink-muted w-5 text-center">
                  #{entry.rank}
                </span>
                <div className="w-6 h-6 rounded-sm border border-line bg-panel-light flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.avatarUrl} alt="" className="w-4 h-4 object-contain" />
                </div>
                <div>
                  <span className="font-bold text-ink">{entry.handle}</span>
                  <span className="text-[10px] text-ink-muted ml-2">{entry.completedAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="font-semibold text-accent-text">{entry.guessesCount} guesses</span>
                  <span className="text-[10px] text-ink-muted block">{entry.timeSeconds}s</span>
                </div>
                <span className="type-label text-[9px] px-1 py-0.5 rounded-sm bg-panel-light border border-line">
                  {entry.rewardTier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
