'use client';

import React from 'react';
import { useDuelStore } from '@/stores/duel-store';
import { usePlayerStore } from '@/stores/player-store';
import { SABOTAGE_RULES } from '@neon-cipher/game-rules';

import { duelService } from './duelService';
import { Button } from '@/components/ui/Button';

export interface SabotageBarProps {
  duelId?: string;
  playerCredits?: number;
  shieldActive?: boolean;
  disabled?: boolean;
  onSabotageResult?: (result: {
    success: boolean;
    shielded: boolean;
    effectApplied?: string;
    remainingCredits: number;
    message: string;
  }) => void;
}

export function SabotageBar({
  duelId: propDuelId,
  playerCredits: propPlayerCredits,
  shieldActive: _propShieldActive,
  disabled: propDisabled,
  onSabotageResult: propOnSabotageResult,
}: SabotageBarProps = {}) {
  const { activeSession, useSabotage, sabotageFeedback, clearSabotageFeedback, isLoading } =
    useDuelStore();
  const { credits: storeCredits } = usePlayerStore();

  const [localFeedback, setLocalFeedback] = React.useState<string | null>(null);
  const effectiveCredits = propPlayerCredits !== undefined ? propPlayerCredits : storeCredits;
  const effectiveSession = activeSession;

  if (!effectiveSession && !propDuelId) {
    return null;
  }

  const tools = Object.values(SABOTAGE_RULES);

  return (
    <section
      aria-label="Sabotage Deck"
      className="w-full bg-panel/90 backdrop-blur-sm border-t border-line p-3 flex flex-col gap-2.5 transition-all"
    >
      {/* Sabotage Header with credits info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="font-data text-[10px] tracking-widest text-ink uppercase font-bold">
            SABOTAGE PROTOCOLS // OFFENSIVE COUNTERMEASURES
          </span>
        </div>
        <div className="font-data text-xs text-money-text font-bold">
          BALANCE: {effectiveCredits.toLocaleString()} CR
        </div>
      </div>

      {/* Sabotage Feedback Banner */}
      {(sabotageFeedback || localFeedback) && (
        <div
          role="status"
          data-testid="sabotage-feedback"
          className={`px-3 py-1.5 rounded-sm border text-xs font-data flex items-center justify-between ${
            sabotageFeedback?.type === 'shielded'
              ? 'bg-amber-100/90 border-amber-400 text-amber-900'
              : sabotageFeedback?.type === 'error'
              ? 'bg-danger/10 border-danger text-danger-text'
              : 'bg-accent/10 border-accent text-accent-text'
          }`}
        >
          <span className="font-semibold">{localFeedback || sabotageFeedback?.message}</span>
          <Button
            variant="icon"
            compact
            onClick={() => {
              setLocalFeedback(null);
              clearSabotageFeedback();
            }}
            aria-label="Dismiss sabotage notice"
            className="ml-2 text-ink-muted text-sm"
          >
            ✕
          </Button>
        </div>
      )}

      {/* 4 Sabotage Tool Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tools.map((tool) => {
          const canAfford = effectiveCredits >= tool.creditCost;
          const shortfall = tool.creditCost - effectiveCredits;

          const handleActivate = async () => {
            if (propDuelId && propOnSabotageResult) {
              try {
                const res = await duelService.useSabotage(propDuelId, tool.id);
                setLocalFeedback(res.message);
                propOnSabotageResult(res);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Sabotage failed';
                setLocalFeedback(msg);
                propOnSabotageResult({
                  success: false,
                  shielded: false,
                  remainingCredits: effectiveCredits,
                  message: msg,
                });
              }
            } else {
              useSabotage(tool.id);
            }
          };

          return (
            <Button
              key={tool.id}
              variant="secondary"
              onClick={handleActivate}
              disabled={!canAfford || isLoading || propDisabled}
              aria-label={`Activate ${tool.name} for ${tool.creditCost} credits`}
              data-testid={`sabotage-${tool.id}`}
              className={`min-h-[52px] p-2.5 text-left flex flex-col justify-between normal-case tracking-normal items-start ${
                canAfford
                  ? 'hover:border-accent hover:shadow-card'
                  : 'bg-panel/40 border-line/40 opacity-55'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-data text-[11px] font-bold text-ink truncate">
                  {tool.name}
                </span>
                <span
                  className={`font-data text-[11px] font-bold ${
                    canAfford ? 'text-money-text' : 'text-danger-text'
                  }`}
                >
                  {tool.creditCost} CR
                </span>
              </div>

              <div className="mt-1 text-[10px] font-data text-ink-muted leading-tight line-clamp-1">
                {tool.description}
              </div>

              {!canAfford && (
                <div className="mt-0.5 text-[9px] font-data text-danger-text font-bold">
                  NEED +{shortfall} CR
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
