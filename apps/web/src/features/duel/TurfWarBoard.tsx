'use client';

import { useClock } from '@/lib/useClock';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getNodes, GameNode } from '../map/nodeService';
import { defenseService, NodeDefenseData } from '../codemaker/defenseService';
import { MarkerIcon } from '../../components/ui/MarkerIcon';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/Button';
import { triggerToast } from '@/stores/toast-store';
import { calculateNodeDecay, calculateNodeIncome } from '@neon-cipher/game-rules/src/index';

interface DistrictControl {
  id: string;
  name: string;
  ownerName: string;
  ownerBadge: string;
  colorClass: string;
  borderClass: string;
  hourlyYield: number;
  nodeCount: number;
  controlledPercent: number;
}

export function TurfWarBoard() {
  const now = useClock();
  const router = useRouter();
  const [nodes] = useState<GameNode[]>(() => getNodes());
  const [defenses, setDefenses] = useState<Record<string, NodeDefenseData>>({});
  const [selectedDistrict, setSelectedDistrict] = useState<'all' | 'slums' | 'commercial'>('all');
  const [activeAccount, setActiveAccount] = useState<string>('ZERO_COOL');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  useEffect(() => {
    defenseService
      .getAllDefenses()
      .then((res) => {
        if (res.defenses) setDefenses(res.defenses);
        if (res.activeAccount) setActiveAccount(res.activeAccount);
      })
      .catch(() => {});
  }, []);

  const districts: DistrictControl[] = useMemo(() => {
    return [
      {
        id: 'slums',
        name: 'The Low Slums',
        ownerName: activeAccount === 'ZERO_COOL' ? 'ZERO_COOL (You)' : 'Kovacs Syndicate',
        ownerBadge: 'KOVACS SYNDICATE',
        colorClass: 'bg-accent/15 text-accent-text',
        borderClass: 'border-accent',
        hourlyYield: 480,
        nodeCount: 8,
        controlledPercent: 75,
      },
      {
        id: 'commercial',
        name: 'Meridian Commercial',
        ownerName: activeAccount === 'PHREAK' ? 'PHREAK (You)' : 'Phantom Syndicate',
        ownerBadge: 'PHANTOM SYNDICATE',
        colorClass: 'bg-danger/15 text-danger-text',
        borderClass: 'border-danger',
        hourlyYield: 920,
        nodeCount: 7,
        controlledPercent: 60,
      },
    ];
  }, [activeAccount]);

  const filteredNodes = useMemo(() => {
    if (selectedDistrict === 'all') return nodes;
    return nodes.filter((n) => n.district === selectedDistrict);
  }, [nodes, selectedDistrict]);

  const handleClaim = async (nodeId: string) => {
    setIsClaiming(nodeId);
    try {
      const res = await defenseService.claimYield(nodeId);
      if (res.success) {
        setClaimStatus(`CLAIMED: +${res.amount} Credits from node ${nodeId}`);
        const updated = await defenseService.getAllDefenses();
        if (updated.defenses) setDefenses(updated.defenses);
      }
    } catch (e: any) {
      setClaimStatus(`CLAIM ERROR: ${e.message}`);
    } finally {
      setIsClaiming(null);
    }
  };

  const handleContestNode = (node: GameNode) => {
    router.push(`/terminal/${node.id}`);
  };

  const handleManageDefense = (node: GameNode) => {
    router.push(`/codemaker?nodeId=${node.id}`);
  };

  return (
    <div className="scene-ground w-full flex-1 min-h-0 flex flex-col text-ink overflow-y-auto pb-24 pb-safe-bottom select-none">
      {/* Header */}
      <div className="bg-panel/90 border-b border-line px-4 py-4 sm:py-5 flex items-center justify-between shrink-0">
        <div>
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block">
            CITYWIDE TURF WAR // DISTRICT BOARD
          </span>
          <h1 className="font-heading text-[28px] leading-[32px] font-normal text-ink">
            Syndicate Territory Map
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-data text-xs text-ink-muted">
            DECKER: <strong className="text-ink">{activeAccount}</strong>
          </span>
        </div>
      </div>

      {claimStatus && (
        <div
          data-testid="turf-status-banner"
          className="bg-accent/15 border-b border-accent/30 text-accent-text font-data text-xs px-4 py-2 flex items-center justify-between"
        >
          <span>{claimStatus}</span>
          <Button
            variant="ghost"
            compact
            onClick={() => setClaimStatus(null)}
            aria-label="Dismiss banner"
            className="text-accent font-bold ml-4 border-none h-auto min-h-[32px] px-2"
          >
            ✕
          </Button>
        </div>
      )}

      <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {/* District Territory Overview Cards */}
        <div className="grid grid-cols-1 gap-3">
          {districts.map((dist) => (
            <div
              key={dist.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDistrict(dist.id as any)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDistrict(dist.id as any);
                }
              }}
              data-testid={`district-card-${dist.id}`}
              aria-label={`Filter by ${dist.name}`}
              className={`scene-card p-3.5 sm:p-4 rounded-[12px] border border-line shadow-card flex flex-col justify-between gap-3 bg-panel-light cursor-pointer transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none border-l-4 ${
                dist.id === 'slums' ? 'border-l-accent' : 'border-l-danger'
              } ${selectedDistrict === dist.id ? 'ring-2 ring-accent' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-data text-[10px] uppercase tracking-[1.5px] text-ink-muted font-medium">
                    DISTRICT SECTOR
                  </span>
                  <h2 className="font-heading text-lg font-normal text-ink">
                    {dist.name}
                  </h2>
                </div>

                {/* Owner Badge (Requirement: Shape + Color + Text) */}
                <div
                  data-testid={`owner-badge-${dist.id}`}
                  className={`px-2.5 py-1 rounded-pill border font-data text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm ${dist.colorClass} ${dist.borderClass}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{dist.ownerBadge}</span>
                </div>
              </div>

              {/* District Yield & Influence as Label/Value Row */}
              <div className="grid grid-cols-2 divide-x divide-line bg-panel p-2.5 rounded-[8px] border border-line font-data">
                <div className="pr-2">
                  <span className="font-data text-[10px] text-ink-muted uppercase tracking-[1px] font-medium block">
                    HOURLY YIELD
                  </span>
                  <span className="font-data text-[15px] font-semibold text-money-text mt-0.5 block">
                    +{dist.hourlyYield} cr/hr
                  </span>
                </div>
                <div className="pl-3">
                  <span className="font-data text-[10px] text-ink-muted uppercase tracking-[1px] font-medium block">
                    INFLUENCE
                  </span>
                  <span className="font-data text-[15px] font-semibold text-ink mt-0.5 block">
                    {dist.controlledPercent}% Control
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${dist.id === 'slums' ? 'bg-accent' : 'bg-danger'}`}
                  style={{ width: `${dist.controlledPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Filter (Segmented Control) */}
        <div className="pt-1">
          <SegmentedControl
            ariaLabel="District filter"
            value={selectedDistrict}
            onChange={(val) => setSelectedDistrict(val as 'all' | 'slums' | 'commercial')}
            options={[
              { id: 'all', label: `All Districts (${nodes.length})`, testId: 'filter-all' },
              { id: 'slums', label: 'Slums (8)', testId: 'filter-slums' },
              { id: 'commercial', label: 'Commercial (7)', testId: 'filter-commercial' },
            ]}
          />
        </div>

        {/* Node Warfare List */}
        <div className="flex flex-col gap-3">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            SECTOR NODES & DEFENSE MATRICES
          </span>

          <div className="flex flex-col gap-2.5" data-testid="turf-nodes-list">
            {filteredNodes.map((node) => {
              const def = defenses[node.id];
              const isOwnedByPlayer = def?.ownerHandle === activeAccount || node.status === 'owned';
              const ownerHandle = def?.ownerHandle || (node.district === 'slums' ? 'ZERO_COOL' : 'PHANTOM_CORP');

              const hourlyYield = Math.floor(node.bounty / 2);
              const decay = calculateNodeDecay(def?.lastMaintainedAt || now - 3600000 * 5, now, def?.dailyBudget || 150);
              const income = calculateNodeIncome(hourlyYield, def?.lastCollectedAt || now - 3600000 * 5, now, 1000);

              const handleCardClick = () => {
                if (isOwnedByPlayer) {
                  handleManageDefense(node);
                } else {
                  handleContestNode(node);
                }
              };

              return (
                <div
                  key={node.id}
                  data-testid={`turf-node-card-${node.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={handleCardClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick();
                    }
                  }}
                  className="bg-panel-light p-3.5 sm:p-4 rounded-[12px] border border-line shadow-card flex flex-col gap-3 transition-transform duration-[120ms] cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <MarkerIcon size="sm" node={node} isSelected={false} />
                      <div className="min-w-0">
                        <span className="font-heading text-base font-normal text-ink truncate block">
                          {node.name}
                        </span>
                        <span className="font-data text-[11px] text-ink-muted">
                          Tier {node.tier} • {node.district.toUpperCase()} • Yield: +{hourlyYield} cr/hr
                        </span>
                      </div>
                    </div>

                    {/* Owner Badge */}
                    <div
                      data-testid={`node-owner-badge-${node.id}`}
                      className={`px-2.5 py-0.5 rounded-pill border font-data text-[10px] font-bold tracking-wider uppercase shrink-0 flex items-center gap-1 ${
                        isOwnedByPlayer
                          ? 'bg-accent/15 border-accent text-accent-text'
                          : 'bg-danger/15 border-danger text-danger-text'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{isOwnedByPlayer ? `OWNER: ${activeAccount}` : `RIVAL: ${ownerHandle}`}</span>
                    </div>
                  </div>

                  {/* Income Cap & Decay UI as divided Data Row */}
                  <div className="grid grid-cols-2 divide-x divide-line bg-panel p-2.5 rounded-[8px] border border-line text-[11px] font-data">
                    {/* Decay Status */}
                    <div className="pr-2 flex flex-col">
                      <div className="flex justify-between items-center text-ink-muted">
                        <span className="text-[10px] uppercase tracking-[1px] font-medium">INTEGRITY</span>
                        <span className="font-semibold text-ink text-xs">{decay.integrityPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-ink/10 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${decay.integrityPercent > 50 ? 'bg-accent' : 'bg-danger'}`}
                          style={{ width: `${decay.integrityPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-ink-muted mt-0.5">
                        Decay: -{decay.decayRatePerHour}%/hr
                      </span>
                    </div>

                    {/* Income Cap Status */}
                    <div className="pl-3 flex flex-col">
                      <div className="flex justify-between items-center text-ink-muted">
                        <span className="text-[10px] uppercase tracking-[1px] font-medium">INCOME CAP</span>
                        <span className="font-semibold text-money-text text-xs">{income.accumulatedYield} / {income.incomeCap}</span>
                      </div>
                      <div className="w-full h-1.5 bg-ink/10 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${income.isCapped ? 'bg-danger' : 'bg-money'}`}
                          style={{ width: `${income.percentFilled}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-ink-muted mt-0.5">
                        {income.isCapped ? 'CAP REACHED' : `${income.percentFilled}% filled`}
                      </span>
                    </div>
                  </div>

                  {/* Dedicated Card Footer Row for Actions */}
                  <div className="mt-auto pt-2.5 border-t border-line/40 flex items-center justify-end gap-2">
                    {isOwnedByPlayer ? (
                      <>
                        <Button
                          variant="compact"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(node.id);
                          }}
                          disabled={income.accumulatedYield <= 0 || isClaiming === node.id}
                          loading={isClaiming === node.id}
                          data-testid={`claim-yield-button-${node.id}`}
                          className="text-money-text"
                        >
                          {isClaiming === node.id ? 'CLAIMING...' : `CLAIM (+${income.accumulatedYield} CR)`}
                        </Button>
                        <Button
                          variant="secondary"
                          compact
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageDefense(node);
                          }}
                          data-testid={`manage-defense-button-${node.id}`}
                        >
                          MANAGE DEFENSE
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="danger"
                        compact
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContestNode(node);
                        }}
                        data-testid={`contest-node-button-${node.id}`}
                      >
                        CONTEST NODE
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
