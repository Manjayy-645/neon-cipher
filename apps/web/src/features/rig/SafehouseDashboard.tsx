'use client';

import React, { useState } from 'react';
import { SafehouseProperty } from '@/app/api/mock/db';
import { rigService } from './rigService';
import { usePlayerStore } from '@/stores/player-store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface SafehouseDashboardProps {
  properties: SafehouseProperty[];
  ownedLeases?: Array<{
    id: string;
    name: string;
    district: string;
    dailyDividend: number;
    effect: string;
  }>;
  stats: {
    ownedCount: number;
    ownedLeasesCount?: number;
    totalUpkeep: number;
    totalDailyDividend: number;
    totalTraceReduction: number;
  };
  onRefresh: () => void;
}

export const SafehouseDashboard: React.FC<SafehouseDashboardProps> = ({
  properties,
  ownedLeases = [],
  stats,
  onRefresh,
}) => {
  const { credits, syncWallet } = usePlayerStore();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [purchasePreview, setPurchasePreview] = useState<SafehouseProperty | null>(null);
  const handleClaimDividends = async (prop: SafehouseProperty) => {
    setClaimingId(prop.id);
    setFeedback(null);

    const res = await rigService.claimDividends(prop.id);
    setClaimingId(null);

    if (res.success && res.balances) {
      syncWallet({
        credits: res.balances.credits,
        coins: res.balances.coins,
      });
      setFeedback({
        type: 'success',
        message: res.message || `Claimed $${res.claimedAmount?.toLocaleString()} in dividends!`,
      });
      onRefresh();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to claim dividends.',
      });
    }
  };

  const handlePurchaseSafehouse = async (prop: SafehouseProperty) => {
    setPurchasingId(prop.id);
    setFeedback(null);

    const res = await rigService.purchaseSafehouse(prop.id);
    setPurchasingId(null);

    if (res.success && res.balances) {
      syncWallet({
        credits: res.balances.credits,
        coins: res.balances.coins,
      });
      setFeedback({
        type: 'success',
        message: res.message || `Acquired ${prop.name}!`,
      });
      onRefresh();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to acquire safehouse.',
      });
    }
  };

  const handleClaimLeaseDividends = async (leaseId: string) => {
    setClaimingId(leaseId);
    setFeedback(null);

    const res = await rigService.claimDividends(leaseId);
    setClaimingId(null);

    if (res.success && res.balances) {
      syncWallet({
        credits: res.balances.credits,
        coins: res.balances.coins,
      });
      setFeedback({
        type: 'success',
        message: res.message || `Claimed $${res.claimedAmount?.toLocaleString()} in dividends!`,
      });
      onRefresh();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to claim dividends.',
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Safehouse Syndicate Stats Card */}
      <div className="scene-card bg-panel-light border border-line rounded-[12px] p-3 sm:p-4 shadow-card font-data flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <h3 className="font-heading text-base font-normal text-ink">
              SAFEHOUSE NETWORK
            </h3>
          </div>
          <span className="font-data text-[11px] text-ink-muted uppercase tracking-[1px]">
            {stats.ownedCount} / {properties.length} PROPERTIES ONLINE
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 divide-x divide-line bg-panel p-2.5 rounded-[8px] border border-line text-center">
          <div className="px-2">
            <span className="font-data text-[10px] text-ink-muted uppercase tracking-[1px] block">
              DAILY DIVIDEND
            </span>
            <span className="font-data text-[15px] font-semibold text-money-text mt-0.5 block">
              +${stats.totalDailyDividend.toLocaleString()}
            </span>
          </div>

          <div className="px-2">
            <span className="font-data text-[10px] text-ink-muted uppercase tracking-[1px] block">
              UPKEEP DEDUCTION
            </span>
            <span className="font-data text-[15px] font-semibold text-danger-text mt-0.5 block">
              -${stats.totalUpkeep.toLocaleString()}
            </span>
          </div>

          <div className="px-2">
            <span className="font-data text-[10px] text-ink-muted uppercase tracking-[1px] block">
              TRACE SHIELD
            </span>
            <span className="font-data text-[15px] font-semibold text-accent-text mt-0.5 block">
              -{stats.totalTraceReduction}%
            </span>
          </div>
        </div>

        <div className="border border-line rounded-md bg-panel p-3 font-data text-xs flex flex-wrap justify-between gap-2"><span>NET DAILY YIELD <span className="text-ink-muted">(dividend − upkeep)</span></span><strong className="text-money-text" data-testid="safehouse-net-yield">${(stats.totalDailyDividend - stats.totalUpkeep).toLocaleString()}/day</strong></div>
        {/* Recorded claimable dividends */}
        <div className="bg-panel border border-line rounded-[8px] p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-money shrink-0" />
            <span className="font-data text-[10px] text-ink-muted uppercase tracking-[1.5px] font-medium truncate">
              RECORDED DIVIDENDS:
            </span>
          </div>
          <span className="font-data text-[13px] font-semibold text-money-text shrink-0">
            ${properties.filter((property) => property.owned).reduce((sum, property) => sum + property.accumulatedDividends, 0).toLocaleString()} CLAIMABLE
          </span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-[8px] text-xs font-data border ${
            feedback.type === 'success'
              ? 'bg-accent/15 border-accent text-accent-text font-bold'
              : 'bg-danger/15 border-danger text-danger-text font-bold'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Properties List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="flex items-center justify-between lg:col-span-2">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            SYNDICATE REAL ESTATE
          </span>
        </div>

        {properties.map((prop) => {
          const isOwned = prop.owned;
          const canAfford = credits >= prop.cost;

          return (
            <div
              key={prop.id}
              className={`scene-card p-3.5 sm:p-4 rounded-[12px] border bg-panel-light shadow-card flex flex-col gap-3  ${
                isOwned ? 'border-accent/50' : 'border-line'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-[8px] bg-panel border border-line p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/icon-safehouse.svg" alt={prop.name} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-heading text-lg font-normal text-ink">{prop.name}</h5>
                    <span
                      className={`text-[10px] font-data px-2 py-0.5 rounded-pill font-bold uppercase tracking-wider ${
                        isOwned
                          ? 'bg-accent/15 text-accent-text border border-accent/40'
                          : 'bg-panel text-ink-muted border border-line'
                      }`}
                    >
                      {isOwned ? 'ESTABLISHED' : 'AVAILABLE'}
                    </span>
                  </div>
                  <p className="font-data text-xs text-ink-muted mt-1 leading-relaxed">
                    {prop.description}
                  </p>
                </div>

                {!isOwned && (
                  <span className="font-data text-[15px] font-semibold text-money-text shrink-0">
                    ${prop.cost.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Property Metrics Data Row */}
              <div className="grid grid-cols-3 divide-x divide-line bg-panel p-2.5 rounded-[8px] border border-line font-data text-center">
                <div className="px-1.5">
                  <span className="block text-[10px] uppercase tracking-[1px] text-ink-muted font-medium">
                    DIVIDEND
                  </span>
                  <span className="text-money-text font-semibold text-[14px] sm:text-[15px] mt-0.5 block">
                    +${prop.dailyDividend}/day
                  </span>
                </div>
                <div className="px-1.5">
                  <span className="block text-[10px] uppercase tracking-[1px] text-ink-muted font-medium">
                    UPKEEP
                  </span>
                  <span className="text-danger-text font-semibold text-[14px] sm:text-[15px] mt-0.5 block">
                    -${prop.upkeep}/day
                  </span>
                </div>
                <div className="px-1.5">
                  <span className="block text-[10px] uppercase tracking-[1px] text-ink-muted font-medium">
                    TRACE SHIELD
                  </span>
                  <span className="text-accent-text font-semibold text-[14px] sm:text-[15px] mt-0.5 block">
                    -{prop.traceReductionPercent}%
                  </span>
                </div>
              </div>

              <p className="font-data text-xs text-money-text">Net daily yield: ${(prop.dailyDividend - prop.upkeep).toLocaleString()} after upkeep</p>
              {/* Dedicated Card Footer Row for Actions */}
              <div className="mt-auto pt-2.5 border-t border-line/40 flex items-center justify-end">
                {isOwned ? (
                  <Button
                    variant="compact"
                    loading={claimingId === prop.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaimDividends(prop);
                    }}
                    className="text-money-text"
                  >
                    CLAIM DIVIDENDS
                  </Button>
                ) : (
                  <Button
                    variant="compact"
                    disabled={purchasingId === prop.id || !canAfford}
                    loading={purchasingId === prop.id}
                    reason={!canAfford ? `SHORT BY $${(prop.cost - credits).toLocaleString()}` : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPurchasePreview(prop);
                    }}
                    className={canAfford ? 'bg-accent text-white border-transparent' : ''}
                  >
                    {canAfford ? `ACQUIRE FOR $${prop.cost.toLocaleString()}` : 'INSUFFICIENT FUNDS'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {purchasePreview && <Modal label="Confirm safehouse purchase" onClose={() => setPurchasePreview(null)} dismissible={!purchasingId} className="bg-panel-light border border-line rounded-t-lg p-4 shadow-sheet"
        header={<h2 className="font-heading text-2xl">Acquire {purchasePreview.name}?</h2>}
        footer={<div className="flex gap-2"><Button variant="secondary" onClick={() => setPurchasePreview(null)} disabled={Boolean(purchasingId)} className="flex-1">Cancel</Button><Button variant="primary" loading={Boolean(purchasingId)} disabled={Boolean(purchasingId) || credits < purchasePreview.cost} onClick={async () => { await handlePurchaseSafehouse(purchasePreview); setPurchasePreview(null); }} className="flex-1">Confirm purchase</Button></div>}>
        <dl className="font-data text-sm grid grid-cols-2 gap-3 py-4"><dt>Game-credit cost</dt><dd>${purchasePreview.cost.toLocaleString()}</dd><dt>Balance after purchase</dt><dd>${(credits - purchasePreview.cost).toLocaleString()}</dd><dt>Net daily yield</dt><dd>${(purchasePreview.dailyDividend - purchasePreview.upkeep).toLocaleString()}</dd></dl>
      </Modal>}
      {/* District Leases & Syndicate Holdings Section */}
      {ownedLeases.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
              DISTRICT HOLDINGS & LEASES ({ownedLeases.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ownedLeases.map((lease) => (
              <div
                key={lease.id}
                className="scene-card p-3 rounded-[12px] border border-line bg-panel-light shadow-card flex flex-col justify-between gap-2.5 font-data"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h6 className="font-heading text-base font-bold text-ink leading-tight">
                      {lease.name}
                    </h6>
                    <span className="text-[10px] text-ink-muted uppercase tracking-wider block mt-0.5">
                      {lease.district} District • Active Holding
                    </span>
                  </div>
                  {lease.dailyDividend > 0 && (
                    <span className="text-money-text font-semibold text-sm shrink-0">
                      +${lease.dailyDividend}/day
                    </span>
                  )}
                </div>

                <p className="text-xs text-ink-muted leading-relaxed">
                  {lease.effect}
                </p>

                <div className="pt-2 border-t border-line/40 flex items-center justify-between">
                  <span className="text-[10px] text-accent-text font-bold uppercase tracking-wider">
                    ONLINE
                  </span>
                  {lease.dailyDividend > 0 && (
                    <Button
                      variant="compact"
                      loading={claimingId === lease.id}
                      onClick={() => handleClaimLeaseDividends(lease.id)}
                      className="text-money-text text-[11px] py-1 px-2.5"
                    >
                      CLAIM YIELD
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
