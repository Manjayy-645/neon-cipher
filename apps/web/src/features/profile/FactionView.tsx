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
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 sm:p-5 text-ink font-data shadow-card space-y-6">
      {/* Header */}
      <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-wide text-ink">FACTION DIPLOMACY</h2>
            <span className="type-label bg-accent/15 text-accent-text border border-accent/30 px-2 py-0.5 rounded-sm text-[10px] font-bold">
              SYNDICATES
            </span>
          </div>
          <p className="type-label text-[10px] text-ink-muted mt-0.5">STANDING, EXCLUSIVE CONTRACTS & MUTUAL EXCLUSION</p>
        </div>
        <div className="text-xs text-ink-muted flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span>City Syndicate Alignments</span>
        </div>
      </div>

      {/* Faction Cards */}
      <div className="space-y-5">
        {factions.map((faction) => {
          const rival = factions.find((f) => f.id === faction.opposingFactionId);
          const repPercent = Math.min(100, Math.max(0, ((faction.reputation + 100) / 200) * 100));
          const currentMilestone = getFactionMilestone(faction.reputation);

          return (
            <div key={faction.id} className="bg-panel border border-line rounded-sm p-4 sm:p-4.5 space-y-4 shadow-xs">
              {/* Faction Title & Standing badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-line/60 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="type-label text-[10px] bg-panel-light border border-line px-1.5 py-0.5 rounded-sm font-bold">
                      SYNDICATE
                    </span>
                    <h3 className="font-heading text-lg sm:text-xl text-ink font-bold truncate">{faction.name}</h3>
                  </div>
                  <p className="text-xs italic text-ink-muted leading-tight mt-1">&quot;{faction.motto}&quot;</p>
                </div>

                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                  <span
                    className={`type-label px-2.5 py-1 rounded-sm border text-[11px] font-bold shadow-xs ${
                      faction.standingLevel === 'Allied'
                        ? 'bg-accent/15 text-accent-text border-accent/50'
                        : faction.standingLevel === 'Favored'
                        ? 'bg-money/15 text-money-text border-money/50'
                        : faction.standingLevel === 'Hostile'
                        ? 'bg-danger/15 text-danger-text border-danger/50'
                        : 'bg-panel-light text-ink-muted border-line'
                    }`}
                  >
                    {faction.standingLevel} ({faction.reputation > 0 ? `+${faction.reputation}` : faction.reputation})
                  </span>
                  {currentMilestone.rankNumber > 0 && (
                    <span className="type-label text-[9.5px] text-accent-text font-bold bg-accent/10 px-2 py-0.5 rounded-sm border border-accent/20">
                      {currentMilestone.rankName}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-ink leading-relaxed">{faction.description}</p>

              {/* Glitch Commentary / Intercepted Intel Box */}
              {faction.glitchCommentary && (
                <div className="bg-panel-light border border-line p-3 rounded-sm text-xs flex items-start gap-2.5 shadow-xs">
                  <span className="type-label text-[9px] font-bold text-money-text bg-money/10 border border-money/30 px-1.5 py-0.5 rounded-sm shrink-0">
                    GLITCH INTEL
                  </span>
                  <p className="text-xs text-ink leading-relaxed">
                    “{faction.glitchCommentary}”
                  </p>
                </div>
              )}

              {/* Reputation Gauge */}
              <div className="space-y-1.5 bg-panel-light/60 border border-line/60 p-3 rounded-sm">
                <div className="flex justify-between text-[10px] text-ink-muted font-semibold">
                  <span className="text-danger-text">HOSTILE (-100)</span>
                  <span>NEUTRAL (0)</span>
                  <span className="text-accent-text">ALLIED (+100)</span>
                </div>
                <div className="w-full h-2.5 bg-panel border border-line rounded-pill overflow-hidden relative p-0.5">
                  <div
                    className={`h-full rounded-pill transition-all duration-500 ${
                      faction.reputation >= 20 ? 'bg-accent' : faction.reputation <= -20 ? 'bg-danger' : 'bg-line'
                    }`}
                    style={{ width: `${repPercent}%` }}
                  />
                </div>
              </div>

              {/* 3 Reputation Milestones Ranks */}
              {faction.milestones && faction.milestones.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-line/60">
                  <div className="flex justify-between items-center">
                    <span className="type-label text-[10px] font-bold text-ink">
                      REPUTATION TIERS & PASSIVE PERKS
                    </span>
                    <span className="text-[10px] text-ink-muted">Syndicate Standing Ladder</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {faction.milestones.map((m) => {
                      const isUnlocked = faction.reputation >= m.repRequired;
                      return (
                        <div
                          key={m.rank}
                          className={`p-2.5 rounded-sm border text-xs flex flex-col justify-between shadow-xs ${
                            isUnlocked
                              ? 'bg-panel-light border-accent/50 text-ink ring-1 ring-accent/20'
                              : 'bg-panel-light/50 border-line/60 text-ink-muted opacity-80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="font-bold text-[11px] text-ink uppercase">
                                {m.name}
                              </span>
                              <span
                                className={`type-label text-[8.5px] px-1.5 py-0.5 rounded-sm border font-bold ${
                                  isUnlocked
                                    ? 'bg-accent/15 text-accent-text border-accent/40'
                                    : 'bg-panel text-ink-muted border-line'
                                }`}
                              >
                                {isUnlocked ? '✓ REACHED' : `${m.repRequired} REP`}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-ink-muted">{m.perk}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faction Perks */}
              {faction.perks && faction.perks.length > 0 && (
                <div className="bg-panel-light border border-line p-3 rounded-sm space-y-1.5">
                  <span className="type-label text-[10px] font-bold text-ink block">ACTIVE PERKS</span>
                  <ul className="text-xs space-y-1 text-ink">
                    {faction.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-accent-text font-bold">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mutual Exclusion Warning if rival exists */}
              {rival && (
                <div className="bg-danger/10 border border-danger/30 p-3 rounded-sm text-xs text-danger-text flex items-start gap-2.5">
                  <span className="type-label font-bold text-[9px] bg-danger/20 border border-danger/40 px-1.5 py-0.5 rounded-sm shrink-0">
                    WARN
                  </span>
                  <div className="leading-relaxed">
                    <strong>MUTUAL EXCLUSION:</strong> Assisting {faction.name} applies negative reputation penalties
                    against <strong>{rival.name}</strong>. Allied status with both syndicates cannot be held simultaneously.
                  </div>
                </div>
              )}

              {/* Exclusive Contracts */}
              {faction.exclusiveContracts && faction.exclusiveContracts.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-line/60">
                  <div className="flex justify-between items-center">
                    <span className="type-label text-[10px] font-bold text-ink">EXCLUSIVE CONTRACTS</span>
                    <span className="text-[10px] text-ink-muted">Live Darknet Bounties</span>
                  </div>
                  {faction.exclusiveContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="bg-panel-light border border-line hover:border-ink/50 transition-colors p-3.5 rounded-sm flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-ink truncate">{contract.title}</h4>
                          <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{contract.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-money-text text-base block tabular-nums">
                            +${contract.bounty.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-semibold text-accent-text block">
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
                        className="min-h-[44px] font-bold"
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
