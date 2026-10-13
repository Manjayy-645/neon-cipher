'use client';

import React from 'react';
import { SkillNode } from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

interface SkillTreeViewProps {
  skills: SkillNode[];
  availablePoints: number;
  onUnlockSkill: (skillId: string) => void;
  unlockingId?: string | null;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  skills,
  availablePoints,
  onUnlockSkill,
  unlockingId,
}) => {
  const branches: { key: SkillNode['branch']; label: string; badge: string; description: string }[] = [
    {
      key: 'analysis',
      label: 'Matrix Analysis',
      badge: 'ANL',
      description: 'Deductive algorithms, candidate narrowing, and entropy reduction.',
    },
    {
      key: 'stealth',
      label: 'Ghost Protocol',
      badge: 'GHO',
      description: 'RF cloaking, trace dilation, and active ICE disruption.',
    },
    {
      key: 'social',
      label: 'Social Engineering',
      badge: 'SOC',
      description: 'Operator intel, duplicate flags, and vendor credential forging.',
    },
  ];

  return (
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 text-ink font-data shadow-card space-y-4">
      {/* Header and Available Points */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h2 className="font-heading text-title tracking-wide">NEURAL SKILL TREE</h2>
          <p className="type-label text-[10px] text-ink-muted">SERVER-VERIFIED CYBERWARE ROUTINES</p>
        </div>
        <div className="bg-panel border border-line px-3 py-1.5 rounded-sm flex items-center gap-2">
          <span className="type-label text-[10px]">POINTS:</span>
          <span className="text-sm font-bold text-accent-text">{availablePoints} SP</span>
        </div>
      </div>

      {/* Branches */}
      <div className="space-y-6">
        {branches.map((b) => {
          const branchSkills = skills.filter((s) => s.branch === b.key).sort((a, b) => a.tier - b.tier);

          return (
            <div key={b.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="type-label text-[10px] font-bold text-accent-text border border-accent/40 bg-accent/10 px-1.5 py-0.5 rounded-sm">
                  {b.badge}
                </span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-ink">{b.label}</h3>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">{b.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {branchSkills.map((skill) => {
                  const unlockedIds = skills.filter((s) => s.unlocked).map((s) => s.id);
                  const prereqsMet = skill.prerequisites.every((pid) => unlockedIds.includes(pid));
                  const canAfford = availablePoints >= skill.pointCost;
                  const isEligible = !skill.unlocked && prereqsMet && canAfford;

                  return (
                    <div
                      key={skill.id}
                      className={`p-3 rounded-sm border transition-all flex flex-col justify-between ${
                        skill.unlocked
                          ? 'bg-panel border-accent/60'
                          : prereqsMet
                          ? 'bg-panel border-line hover:border-ink-muted'
                          : 'bg-panel/50 border-line/40 opacity-70'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-ink">{skill.name}</span>
                          <span
                            className={`type-label text-[9px] px-1 py-0.5 rounded-sm border ${
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

                      {/* Action / Prereq notice */}
                      <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between">
                        {skill.unlocked ? (
                          <span className="text-[10px] text-accent-text font-bold flex items-center gap-1">
                            ✓ ACTIVE IN INFILTRATION
                          </span>
                        ) : !prereqsMet ? (
                          <span className="text-[10px] text-danger-text">
                            Req: {skill.prerequisites.join(', ')}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            fullWidth
                            disabled={!canAfford || unlockingId === skill.id}
                            loading={unlockingId === skill.id}
                            onClick={() => onUnlockSkill(skill.id)}
                          >
                            UNLOCK ({skill.pointCost} SP)
                          </Button>
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
