'use client';

import React from 'react';
import { FactionStanding, getFactionMilestone } from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

export interface FactionViewProps {
  factions: FactionStanding[];
  onAcceptContract: (contractId: string) => void;
  acceptingContractId?: string | null;
}

export const FactionView: React.FC<FactionViewProps> = ({
  factions,
  onAcceptContract,
  acceptingContractId,
}) => {
  return (
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 text-ink font-data shadow-card space-y-5">
      {/* Header */}
      <div className="border-b border-line pb-3">
        <h2 className="font-heading text-title tracking-wide">FACTION DIPLOMACY</h2>
        <p className="type-label text-[10px] text-ink-muted">STANDING, EXCLUSIVE CONTRACTS & MUTUAL EXCLUSION</p>
      </div>

      {/* Faction Cards */}
      <div className="space-y-4">
        {factions.map((faction) => {
          const rival = factions.find((f) => f.id === faction.opposingFactionId);
          const repPercent = Math.min(100, Math.max(0, ((faction.reputation + 100) / 200) * 100));
          const currentMilestone = getFactionMilestone(faction.reputation);

          return (
            <div key={faction.id} className="bg-panel border border-line rounded-sm p-3.5 space-y-3">
              {/* Faction Title & Standing badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading text-lg text-ink font-bold">{faction.name}</h3>
                  <p className="text-[11px] italic text-ink-muted leading-tight mt-0.5">"{faction.motto}"</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`type-label px-2 py-0.5 rounded-sm border text-[10px] font-bold ${
                      faction.standingLevel === 'Allied'
                        ? 'bg-accent/15 text-accent-text border-accent/40'
                        : faction.standingLevel === 'Favored'
                        ? 'bg-money/15 text-money-text border-money/40'
                        : faction.standingLevel === 'Hostile'
                        ? 'bg-danger/15 text-danger-text border-danger/40'
                        : 'bg-panel-light text-ink-muted border-line'
                    }`}
                  >
                    {faction.standingLevel} ({faction.reputation > 0 ? `+${faction.reputation}` : faction.reputation})
                  </span>
                  {currentMilestone.rankNumber > 0 && (
                    <span className="type-label text-[9px] text-accent-text font-bold">
                      {currentMilestone.rankName}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-ink leading-relaxed">{faction.description}</p>

              {/* Glitch Commentary / Intel Box */}
              {faction.glitchCommentary && (
                <div className="bg-panel-light border border-line p-2.5 rounded-sm text-xs flex items-start gap-2">
                  <span className="type-label text-[9px] font-bold text-money-text bg-money/10 border border-money/30 px-1 py-0.5 rounded-sm shrink-0">
                    GLITCH INTEL
                  </span>
                  <p className="text-[11px] text-ink italic leading-tight">
                    “{faction.glitchCommentary}”
                  </p>
                </div>
              )}

              {/* Reputation Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-ink-muted">
                  <span>HOSTILE (-100)</span>
                  <span>NEUTRAL (0)</span>
                  <span>ALLIED (+100)</span>
                </div>
                <div className="w-full h-2 bg-panel-light border border-line rounded-pill overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 ${
                      faction.reputation >= 20 ? 'bg-accent' : faction.reputation <= -20 ? 'bg-danger' : 'bg-line'
                    }`}
                    style={{ width: `${repPercent}%` }}
                  />
                </div>
              </div>

              {/* 3 Reputation Milestones Ranks */}
              {faction.milestones && faction.milestones.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-line/60">
                  <span className="type-label text-[9.5px] block text-ink-muted">
                    REPUTATION TIERS & PASSIVE PERKS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {faction.milestones.map((m) => {
                      const isUnlocked = faction.reputation >= m.repRequired;
                      return (
                        <div
                          key={m.rank}
                          className={`p-2 rounded-sm border text-[11px] flex flex-col justify-between ${
                            isUnlocked
                              ? 'bg-panel-light border-accent/50 text-ink'
                              : 'bg-panel-light/40 border-line/50 text-ink-muted opacity-75'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-[10px] text-ink uppercase">
                                {m.name}
                              </span>
                              <span
                                className={`type-label text-[8.5px] px-1 py-0.2 rounded-sm border ${
                                  isUnlocked
                                    ? 'bg-accent/15 text-accent-text border-accent/40 font-bold'
                                    : 'bg-panel text-ink-muted border-line'
                                }`}
                              >
                                {isUnlocked ? '✓ REACHED' : `${m.repRequired} REP`}
                              </span>
                            </div>
                            <p className="text-[10px] leading-tight text-ink-muted">{m.perk}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faction Perks */}
              {faction.perks && faction.perks.length > 0 && (
                <div className="bg-panel-light border border-line p-2.5 rounded-sm space-y-1">
                  <span className="type-label text-[9.5px] block">ACTIVE PERKS</span>
                  <ul className="text-xs space-y-0.5 list-disc list-inside text-ink">
                    {faction.perks.map((perk, i) => (
                      <li key={i}>{perk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mutual Exclusion Warning if rival exists */}
              {rival && (
                <div className="bg-danger/10 border border-danger/30 p-2.5 rounded-sm text-xs text-danger-text flex items-start gap-2">
                  <span className="type-label font-bold text-[9px] bg-danger/20 border border-danger/40 px-1 py-0.5 rounded-sm shrink-0">
                    WARN
                  </span>
                  <div className="leading-tight">
                    <strong>MUTUAL EXCLUSION:</strong> Assisting {faction.name} applies negative reputation penalties
                    against <strong>{rival.name}</strong>. Allied status with both syndicates cannot be held simultaneously.
                  </div>
                </div>
              )}

              {/* Exclusive Contracts */}
              {faction.exclusiveContracts && faction.exclusiveContracts.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-line/60">
                  <span className="type-label text-[9.5px] block">EXCLUSIVE CONTRACTS</span>
                  {faction.exclusiveContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="bg-panel-light border border-line p-3 rounded-sm flex flex-col justify-between gap-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-ink">{contract.title}</h4>
                          <p className="text-[11px] text-ink-muted mt-0.5">{contract.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-money-text text-sm block">
                            +${contract.bounty.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-accent-text block">
                            +{contract.reputationReward} REP
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        disabled={acceptingContractId === contract.id}
                        loading={acceptingContractId === contract.id}
                        onClick={() => onAcceptContract(contract.id)}
                        className="min-h-[44px]"
                      >
                        ACCEPT CONTRACT ({contract.title})
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
