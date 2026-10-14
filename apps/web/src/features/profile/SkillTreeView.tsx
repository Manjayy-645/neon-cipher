'use client';

import React, { useState } from 'react';
import {
  SkillNode,
  SKILL_BRANCH_GUIDES,
  canUnlockSkill,
  isCapstoneSkill,
} from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

export interface SkillTreeViewProps {
  skills: SkillNode[];
  availablePoints: number;
  onUnlockSkill: (skillId: string) => void;
  unlockingId?: string | null;
  onRespec?: () => void;
  isRespeccing?: boolean;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  skills,
  availablePoints,
  onUnlockSkill,
  unlockingId,
  onRespec,
  isRespeccing = false,
}) => {
  const [selectedPlaystyle, setSelectedPlaystyle] = useState<string | null>(null);
  const [showRecommender, setShowRecommender] = useState<boolean>(false);

  // Check if skills use the canonical 3-branch architecture
  const hasCanonicalBranches = skills.some(
    (s) => s.branch === 'infiltration' || s.branch === 'exploitation'
  );

  const branches: {
    key: SkillNode['branch'];
    label: string;
    subtitle?: string;
    badge: string;
    description: string;
    nixSummary?: string;
  }[] = hasCanonicalBranches
    ? [
        {
          key: 'infiltration',
          label: SKILL_BRANCH_GUIDES.infiltration.title,
          subtitle: SKILL_BRANCH_GUIDES.infiltration.subtitle,
          badge: SKILL_BRANCH_GUIDES.infiltration.badge,
          description: 'Bypass handshakes, damp thermal heat build-up, and freeze security trace clocks.',
          nixSummary: SKILL_BRANCH_GUIDES.infiltration.nixSummary,
        },
        {
          key: 'analysis',
          label: SKILL_BRANCH_GUIDES.analysis.title,
          subtitle: SKILL_BRANCH_GUIDES.analysis.subtitle,
          badge: SKILL_BRANCH_GUIDES.analysis.badge,
          description: 'Entropy collapse, miss-probe time recovery, ICE diagnostics, and guaranteed digit identification.',
          nixSummary: SKILL_BRANCH_GUIDES.analysis.nixSummary,
        },
        {
          key: 'exploitation',
          label: SKILL_BRANCH_GUIDES.exploitation.title,
          subtitle: SKILL_BRANCH_GUIDES.exploitation.subtitle,
          badge: SKILL_BRANCH_GUIDES.exploitation.badge,
          description: 'Ledger skimming, black market vouchers, and 1v1 duel stealth probe spikes.',
          nixSummary: SKILL_BRANCH_GUIDES.exploitation.nixSummary,
        },
      ]
    : [
        {
          key: 'analysis',
          label: 'Matrix Analysis',
          subtitle: 'Deductive algorithms & entropy reduction',
          badge: 'ANL',
          description: 'Deductive algorithms, candidate narrowing, and entropy reduction.',
          nixSummary: 'Deductive algorithms, candidate narrowing, and entropy reduction.',
        },
        {
          key: 'stealth',
          label: 'Ghost Protocol',
          subtitle: 'RF cloaking & trace dilation',
          badge: 'GHO',
          description: 'RF cloaking, trace dilation, and active ICE disruption.',
          nixSummary: 'RF cloaking, trace dilation, and active ICE disruption.',
        },
        {
          key: 'social',
          label: 'Social Engineering',
          subtitle: 'Operator intel & credential forging',
          badge: 'SOC',
          description: 'Operator intel, duplicate flags, and vendor credential forging.',
          nixSummary: 'Operator intel, duplicate flags, and vendor credential forging.',
        },
      ];

  const unlockedSkills = skills.filter((s) => s.unlocked);
  const activeCapstone = unlockedSkills.find((s) => isCapstoneSkill(s));
  const spentPoints = unlockedSkills.reduce((acc, s) => acc + s.pointCost, 0);

  return (
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 text-ink font-data shadow-card space-y-4">
      {/* Header and Available Points */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 gap-3">
        <div>
          <h2 className="font-heading text-title tracking-wide">NEURAL SKILL TREE</h2>
          <p className="type-label text-[10px] text-ink-muted">SERVER-VERIFIED CYBERWARE ROUTINES</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-panel border border-line px-3 py-1.5 rounded-sm flex items-center gap-2">
            <span className="type-label text-[10px]">POINTS:</span>
            <span className="text-sm font-bold text-accent-text">{availablePoints} SP</span>
          </div>
          {onRespec && (
            <Button
              type="button"
              variant="secondary"
              compact
              disabled={isRespeccing || spentPoints === 0}
              loading={isRespeccing}
              onClick={onRespec}
              className="min-h-[44px]"
            >
              [RESPEC POINTS (FREE)]
            </Button>
          )}
        </div>
      </div>

      {/* Capstone Status Banner & Free Respec Notice */}
      <div className="bg-panel border border-line p-3 rounded-sm space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="type-label text-[10px] text-ink-muted">SPECIALIZATION CAPSTONE STATUS:</span>
            <div className="flex items-center gap-2">
              <span
                className={`type-label text-[10px] px-2 py-0.5 rounded-sm font-bold border ${
                  activeCapstone
                    ? 'bg-accent/15 text-accent-text border-accent/40'
                    : 'bg-panel-light text-ink-muted border-line'
                }`}
              >
                {activeCapstone
                  ? `[CAPSTONE ACTIVE: ${activeCapstone.name.toUpperCase()}]`
                  : '[NO CAPSTONE ACTIVE]'}
              </span>
              <span className="text-[11px] text-ink-muted">
                {activeCapstone
                  ? 'Only 1 Capstone can be active at a time. Respec anytime to switch specializations.'
                  : 'Reach Tier 3 in any branch to lock in your Capstone protocol.'}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-ink-muted italic self-start sm:self-center">
            Experiment freely—resetting your skill points is always free.
          </span>
        </div>
      </div>

      {/* Playstyle Quiz / Recommender Accordion */}
      <div className="bg-panel border border-line rounded-sm p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="type-label text-[10px] font-bold text-accent-text border border-accent/40 bg-accent/10 px-1.5 py-0.5 rounded-sm">
              NIX ADVISORY
            </span>
            <span className="font-heading text-xs uppercase tracking-wider text-ink font-bold">
              Playstyle Quiz & Branch Guide
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            compact
            onClick={() => setShowRecommender(!showRecommender)}
            className="text-[11px] min-h-[44px] px-2"
          >
            {showRecommender ? '[HIDE QUIZ ▲]' : '[FIND YOUR PLAYSTYLE ▼]'}
          </Button>
        </div>

        {showRecommender && (
          <div className="pt-2 border-t border-line space-y-3">
            <p className="text-xs text-ink-muted">
              Tell Nix what frustrates you most during breaches to get an automated cyberware recommendation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlaystyle('infiltration')}
                className={`text-left p-2.5 rounded-sm border transition-all text-xs flex flex-col justify-between min-h-[44px] ${
                  selectedPlaystyle === 'infiltration'
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-line bg-panel-light hover:border-ink-muted text-ink'
                }`}
              >
                <div className="font-bold text-accent-text text-[11px]">“Timers stress me out.”</div>
                <div className="text-[10px] text-ink-muted mt-1">
                  Countdown clocks run down too fast or Sector Heat accumulates.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlaystyle('analysis')}
                className={`text-left p-2.5 rounded-sm border transition-all text-xs flex flex-col justify-between min-h-[44px] ${
                  selectedPlaystyle === 'analysis'
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-line bg-panel-light hover:border-ink-muted text-ink'
                }`}
              >
                <div className="font-bold text-accent-text text-[11px]">“Too many numbers.”</div>
                <div className="text-[10px] text-ink-muted mt-1">
                  Stuck tracking candidate numbers, dead digits, or deceptive ICE lies.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlaystyle('exploitation')}
                className={`text-left p-2.5 rounded-sm border transition-all text-xs flex flex-col justify-between min-h-[44px] ${
                  selectedPlaystyle === 'exploitation'
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-line bg-panel-light hover:border-ink-muted text-ink'
                }`}
              >
                <div className="font-bold text-accent-text text-[11px]">“I want profit & power.”</div>
                <div className="text-[10px] text-ink-muted mt-1">
                  Maximize credit bounties, buy cheap market gear, and dominate 1v1 duels.
                </div>
              </button>
            </div>

            {selectedPlaystyle && (
              <div className="bg-panel-light border border-accent/40 p-2.5 rounded-sm text-xs space-y-1">
                <span className="type-label text-[10px] text-accent-text font-bold block">
                  NIX RECOMMENDATION: {selectedPlaystyle.toUpperCase()} TREE
                </span>
                <p className="text-[11px] text-ink leading-relaxed">
                  {selectedPlaystyle === 'infiltration' &&
                    '“Go with Infiltration. Slipstream Boot gives you +5s free padding on every terminal boot, and Phantom Protocol freezes security countdowns entirely on your first guess.”'}
                  {selectedPlaystyle === 'analysis' &&
                    '“Go with Analysis. Dead Channel Sweep refunds wasted seconds whenever you miss, and Quantum Sieve automatically marks a guaranteed digit on your cyberdeck keypad.”'}
                  {selectedPlaystyle === 'exploitation' &&
                    '“Go with Exploitation. Backdoor Skim boosts your cash bounties by 15%, while Zero-Day Payload gives you free Stealth Probes in 1v1 syndicate duels.”'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Branches */}
      <div className="space-y-6">
        {branches.map((b) => {
          const branchSkills = skills.filter((s) => s.branch === b.key).sort((a, b) => a.tier - b.tier);
          const isRecommended = selectedPlaystyle === b.key;

          return (
            <div
              key={b.key}
              className={`space-y-2 p-3 rounded-sm border transition-all ${
                isRecommended
                  ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                  : 'border-line/70 bg-panel/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="type-label text-[10px] font-bold text-accent-text border border-accent/40 bg-accent/10 px-1.5 py-0.5 rounded-sm">
                    {b.badge}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink">{b.label}</h3>
                    {b.subtitle && (
                      <span className="type-label text-[10px] text-ink-muted block leading-none mt-0.5">
                        {b.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                {isRecommended && (
                  <span className="type-label text-[9px] px-1.5 py-0.5 rounded-sm bg-accent/15 text-accent-text border border-accent/40 font-bold">
                    RECOMMENDED
                  </span>
                )}
              </div>

              {b.nixSummary && (
                <div className="bg-panel-light/80 border border-line p-2 rounded-sm text-[11px] text-ink italic leading-tight">
                  <span className="font-semibold text-accent-text not-italic">Nix: </span>
                  “{b.nixSummary}”
                </div>
              )}

              <p className="text-[11px] text-ink-muted leading-tight">{b.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {branchSkills.map((skill) => {
                  const unlockedIds = skills.filter((s) => s.unlocked).map((s) => s.id);
                  const isCap = isCapstoneSkill(skill);
                  const { canUnlock, reason } = canUnlockSkill(skill, unlockedIds, availablePoints, skills);
                  const prereqsMet = skill.prerequisites.every((pid) => unlockedIds.includes(pid));
                  const isCapBlocked = isCap && !skill.unlocked && !!activeCapstone && activeCapstone.id !== skill.id;

                  return (
                    <div
                      key={skill.id}
                      className={`p-3 rounded-sm border transition-all flex flex-col justify-between ${
                        skill.unlocked
                          ? 'bg-panel border-accent/60'
                          : prereqsMet && canUnlock
                          ? 'bg-panel border-line hover:border-ink-muted'
                          : 'bg-panel/50 border-line/40 opacity-70'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-ink block">{skill.name}</span>
                            {isCap && (
                              <span className="type-label text-[8.5px] text-accent-text font-bold uppercase tracking-wider">
                                CAPSTONE (TIER 3)
                              </span>
                            )}
                          </div>
                          <span
                            className={`type-label text-[9px] px-1 py-0.5 rounded-sm border shrink-0 ${
                              skill.unlocked
                                ? 'bg-accent/15 text-accent-text border-accent/30'
                                : 'bg-panel text-ink-muted border-line'
                            }`}
                          >
                            {skill.unlocked ? 'UNLOCKED' : `TIER ${skill.tier} • ${skill.pointCost} SP`}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted leading-relaxed">{skill.description}</p>
                        <div className="bg-panel-light/60 border border-line p-1.5 rounded-sm text-[10px] text-accent-text font-semibold">
                          EFFECT: {skill.effectSummary}
                        </div>
                      </div>

                      {/* Action / Prereq / Capstone notice */}
                      <div className="mt-3 pt-2 border-t border-line/60 flex flex-col gap-1.5">
                        {skill.unlocked ? (
                          <span className="text-[10px] text-accent-text font-bold flex items-center gap-1">
                            ✓ ACTIVE IN INFILTRATION
                          </span>
                        ) : isCapBlocked ? (
                          <div className="text-[10px] text-danger-text leading-tight">
                            Mutually exclusive with active Capstone. Respec to switch.
                          </div>
                        ) : !prereqsMet ? (
                          <span className="text-[10px] text-danger-text">
                            Req: {skill.prerequisites.join(', ')}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            fullWidth
                            disabled={!canUnlock || unlockingId === skill.id}
                            loading={unlockingId === skill.id}
                            onClick={() => onUnlockSkill(skill.id)}
                            className="min-h-[44px]"
                          >
                            UNLOCK ({skill.pointCost} SP)
                          </Button>
                        )}
                        {!skill.unlocked && !isCapBlocked && prereqsMet && !canUnlock && reason && (
                          <span className="text-[9.5px] text-danger-text text-center">{reason}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
