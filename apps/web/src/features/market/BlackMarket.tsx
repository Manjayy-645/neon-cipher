'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATALOG, CatalogItem, ItemCategory } from './catalog';
import { walletService } from './walletService';
import { usePlayerStore } from '@/stores/player-store';
import { useCampaignStore } from '@/stores/campaign-store';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { emit } from '@/features/onboarding/events';
import { normalizeHardwareId, getHardwareStatPreview } from '@neon-cipher/game-rules';

interface BlackMarketProps {
  onBackToDialogue: () => void;
}

export const BlackMarket: React.FC<BlackMarketProps> = ({ onBackToDialogue }) => {
  const { credits, coins, inventory, equippedTools, syncWallet } = usePlayerStore();
  const chapters = useCampaignStore((s) => s.chapters);

  const [activeTab, setActiveTab] = useState<ItemCategory>('tools');
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<CatalogItem | null>(null);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEquipDrawerOpen, setIsEquipDrawerOpen] = useState(false);
  const [isCoinStoreModalOpen, setIsCoinStoreModalOpen] = useState(false);

  // Sync balances and inventory on mount from mock server
  useEffect(() => {
    walletService
      .getWallet()
      .then((data) => {
        syncWallet(data);
      })
      .catch((err) => {
        console.error('Wallet fetch error:', err);
      });
  }, [syncWallet]);

  // Filter items by active tab (excluding legacy aliases from market shelf)
  const itemsInTab = useMemo(() => {
    return CATALOG.filter(
      (it) =>
        it.category === activeTab &&
        it.id !== 'rig-memory-buffer-1' &&
        it.id !== 'rig-memory-buffer-2' &&
        it.id !== 'rig-heuristic-coprocessor'
    );
  }, [activeTab]);

  // Consumable tools & exploits owned for equip flow
  const ownedTools = useMemo(() => {
    return CATALOG.filter(
      (it) => (it.category === 'tools' || it.category === 'exploits') && (inventory[it.id] || 0) > 0
    );
  }, [inventory]);

  const handleOpenConfirm = (item: CatalogItem) => {
    if (item.tierRequired && chapters[`chapter-${item.tierRequired}`]?.status !== 'completed') {
      return;
    }
    setPurchaseFeedback(null);
    setSelectedItemForPurchase(item);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItemForPurchase) return;
    setIsPurchasing(true);
    setPurchaseFeedback(null);

    const result = await walletService.purchaseItem(selectedItemForPurchase.id);
    setIsPurchasing(false);

    if (result.success && result.balances && result.inventory) {
      syncWallet({
        credits: result.balances.credits,
        coins: result.balances.coins,
        inventory: result.inventory,
      });
      emit({ type: 'market:bought', itemId: selectedItemForPurchase.id });
      if (selectedItemForPurchase.id === 'tool-firewall-patch') {
        emit({ type: 'market:bought', itemId: 'firewall-patch' });
      }
      setPurchaseFeedback({
        type: 'success',
        message: result.message || `Acquired ${selectedItemForPurchase.name}!`,
      });
      // Close sheet after brief confirmation
      setTimeout(() => {
        setSelectedItemForPurchase(null);
      }, 1100);
    } else {
      setPurchaseFeedback({
        type: 'error',
        message: result.error || 'Transaction rejected by vendor.',
      });
    }
  };

  const handleToggleEquipTool = async (toolId: string) => {
    let nextEquipped = [...equippedTools];
    if (nextEquipped.includes(toolId)) {
      nextEquipped = nextEquipped.filter((id) => id !== toolId);
    } else {
      if (nextEquipped.length >= 2) {
        // Replace second tool or notify
        nextEquipped = [nextEquipped[0], toolId];
      } else {
        nextEquipped.push(toolId);
      }
    }

    const res = await walletService.equipTools(nextEquipped);
    if (res.success && res.equippedTools) {
      syncWallet({
        credits,
        coins,
        equippedTools: res.equippedTools,
      });
      emit({ type: 'market:equipped', itemId: toolId });
      if (toolId === 'tool-firewall-patch') {
        emit({ type: 'market:equipped', itemId: 'firewall-patch' });
      }
    }
  };

  return (
    <div className="scene-ground w-full h-full flex flex-col text-ink overflow-hidden min-h-0">
      {/* Market Header */}
      <header className="px-4 py-4 sm:py-5 border-b border-line bg-panel-light/90 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="icon"
              onClick={onBackToDialogue}
              aria-label="Back to vendor dialogue"
              className="shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block">
                Broker Glitch // Underground
              </span>
              <h1 className="font-heading text-[28px] leading-[32px] font-normal text-ink">
                Black Market
              </h1>
            </div>
          </div>

          {/* Currency & Equip Quick Actions */}
          <div className="flex items-center gap-2 pt-1 font-data text-xs shrink-0">
            {/* Credits display */}
            <div className="hidden xs:flex items-center px-2.5 py-1.5 bg-panel border border-line rounded-[8px] text-xs font-bold text-money-text">
              ${credits.toLocaleString()}
            </div>

            {/* Equip drawer trigger */}
            <Button
              variant="secondary"
              compact
              onClick={() => setIsEquipDrawerOpen(true)}
              className="px-2.5 py-1.5 min-h-[44px] text-[11px] font-bold gap-1.5"
              aria-label="Manage equipped breach tools"
            >
              <span className="text-ink-muted uppercase">Rig:</span>
              <span className="text-accent-text font-bold">{equippedTools.length}/2</span>
            </Button>

            {/* Coin Store trigger */}
            <Button
              variant="secondary"
              compact
              onClick={() => setIsCoinStoreModalOpen(true)}
              className="px-2.5 py-1.5 min-h-[44px] bg-money/10 border-money/30 text-[11px] font-bold text-money-text gap-1.5"
              title="Buy Coins (Stub)"
              aria-label="Open coin exchange"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-money inline-block" />
              <span>{coins}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 4 Category Tabs */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <SegmentedControl<ItemCategory>
          layout="grid"
          options={[
            { id: 'tools', label: 'TOOLS' },
            { id: 'exploits', label: 'EXPLOITS' },
            { id: 'rig', label: 'RIG HARDWARE' },
            { id: 'leases', label: 'DISTRICT LEASES' },
          ]}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          ariaLabel="Market categories"
        />
      </div>

      {/* Tab Notice Banner */}
      <div className="px-4 py-2 bg-panel/40 border-b border-line text-xs font-data text-ink-muted shrink-0">
        {activeTab === 'tools' && (
          <span>Consumable sabotage tools for solo and duel hacks. Max 2 equipped.</span>
        )}
        {activeTab === 'exploits' && (
          <span className="text-danger-text font-medium">
            Solo hacks only. Coins required. Reduces breach bounty by ~15%.
          </span>
        )}
        {activeTab === 'rig' && (
          <span>Permanent hardware upgrades wired into your terminal deck.</span>
        )}
        {activeTab === 'leases' && (
          <span>Syndicate territorial leases yielding passive revenue.</span>
        )}
      </div>

      {/* Item Catalog List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-24 grid grid-cols-1 gap-3 auto-rows-max">
        {itemsInTab.map((item) => {
          const owned = inventory[item.id] || 0;
          const isMaxed = item.maxOwned !== undefined && owned >= item.maxOwned;
          const isLocked = item.tierRequired
            ? chapters[`chapter-${item.tierRequired}`]?.status !== 'completed'
            : false;

          return (
            <ItemCard
              key={item.id}
              item={item}
              ownedCount={owned}
              isMaxed={isMaxed}
              isLocked={isLocked}
              isEquipped={equippedTools.includes(item.id)}
              onBuyClick={() => handleOpenConfirm(item)}
              onEquipClick={() => handleToggleEquipTool(item.id)}
            />
          );
        })}
      </div>

      {/* Confirm Purchase Bottom Sheet */}
      <AnimatePresence>
        {selectedItemForPurchase && (
          <ConfirmPurchaseSheet
            item={selectedItemForPurchase}
            playerCredits={credits}
            playerCoins={coins}
            isPurchasing={isPurchasing}
            feedback={purchaseFeedback}
            onConfirm={handleConfirmPurchase}
            onCancel={() => setSelectedItemForPurchase(null)}
          />
        )}
      </AnimatePresence>

      {/* Equip Flow Drawer */}
      <AnimatePresence>
        {isEquipDrawerOpen && (
          <EquipDrawer
            ownedTools={ownedTools}
            equippedTools={equippedTools}
            inventory={inventory}
            onToggleEquip={handleToggleEquipTool}
            onClose={() => setIsEquipDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Coin Store Offline Stub Modal */}
      <AnimatePresence>
        {isCoinStoreModalOpen && (
          <CoinStoreStubModal onClose={() => setIsCoinStoreModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================================
   COMPONENTS
   ========================================================================= */

function ItemCard({
  item,
  ownedCount,
  isMaxed,
  isLocked = false,
  isEquipped = false,
  onBuyClick,
  onEquipClick,
}: {
  item: CatalogItem;
  ownedCount: number;
  isMaxed: boolean;
  isLocked?: boolean;
  isEquipped?: boolean;
  onBuyClick: () => void;
  onEquipClick?: () => void;
}) {
  const isCoinCurrency = item.currency === 'coins';

  return (
    <div className="scene-card bg-panel-light border border-line rounded-[12px] p-3.5 sm:p-4 shadow-card flex flex-col gap-3">
      {/* Title & description */}
      <div className="flex items-start gap-3 min-w-0">
        {item.icon && (
          <div className="w-12 h-12 rounded-[8px] bg-panel border border-line p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-base font-bold text-ink leading-tight">
              {item.name}
            </h3>
            {ownedCount > 0 && (
              <span className="bg-panel border border-line text-ink text-[10px] font-data px-2 py-0.5 rounded-[4px] font-bold">
                x{ownedCount}
              </span>
            )}
            {isLocked && (
              <span
                data-testid={`locked-badge-${item.id}`}
                className="bg-amber-950/60 border border-amber-500/50 text-amber-300 text-[10px] font-data px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider"
              >
                REQ: CH.{item.tierRequired}
              </span>
            )}
          </div>
          <p className="font-data text-xs text-ink-muted mt-1 leading-relaxed">
            {item.effect}
          </p>
        </div>
      </div>

      {/* Data Rows: Label above value, 1px line divider between columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2.5 px-3 bg-panel rounded-[8px] border border-line/60">
        <div className="flex flex-col">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            Cost
          </span>
          <span className="font-data text-[15px] font-bold text-money-text flex items-center gap-1">
            {isCoinCurrency ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-money inline-block shrink-0" />
                <span>{item.price} Coins</span>
              </>
            ) : (
              <span>${item.price.toLocaleString()}</span>
            )}
          </span>
        </div>

        <div className="flex flex-col border-l border-line/60 pl-3">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            Inventory
          </span>
          <span className="font-data text-[15px] font-bold text-ink">
            {item.maxOwned !== undefined ? `${ownedCount} / ${item.maxOwned}` : `${ownedCount} owned`}
          </span>
        </div>

        <div className="flex flex-col col-span-2 sm:col-span-1 pt-1.5 sm:pt-0 border-t sm:border-t-0 sm:border-l border-line/60 sm:pl-3">
          {item.bountyPenaltyPercent ? (
            <>
              <span className="font-data text-[11px] uppercase tracking-[1.5px] text-danger-text font-medium">
                Penalty
              </span>
              <span className="font-data text-[15px] font-bold text-danger-text">
                -{item.bountyPenaltyPercent}% Bounty
              </span>
            </>
          ) : (
            <>
              <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
                Category
              </span>
              <span className="font-data text-[15px] font-bold text-ink uppercase">
                {item.category}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Card footer: compact action button, never overlaps text */}
      <div className="border-t border-line/40 pt-2.5 mt-auto flex items-center justify-between gap-2">
        <span className="font-data text-[11px] text-ink-muted truncate">
          {isLocked
            ? `Unlocks after clearing Chapter ${item.tierRequired}`
            : isMaxed
            ? 'Capacity reached'
            : item.maxOwned
            ? `Permanent (max ${item.maxOwned})`
            : 'Consumable tool'}
        </span>

        <div className="flex items-center gap-2">
          {(item.category === 'tools' || item.category === 'exploits') && ownedCount > 0 && onEquipClick && (
            <Button
              variant={isEquipped ? 'secondary' : 'primary'}
              compact
              onClick={onEquipClick}
              data-tour={
                item.id === 'tool-firewall-patch' || item.id === 'firewall-patch'
                  ? 'equip-firewall-patch'
                  : undefined
              }
            >
              {isEquipped ? 'EQUIPPED' : 'EQUIP'}
            </Button>
          )}

          <Button
            variant={isLocked || isMaxed ? 'secondary' : 'compact'}
            compact
            onClick={onBuyClick}
            disabled={isMaxed || isLocked}
            data-tour={
              item.id === 'tool-firewall-patch' || item.id === 'firewall-patch'
                ? 'buy-firewall-patch'
                : undefined
            }
          >
            {isLocked ? 'LOCKED' : isMaxed ? 'OWNED' : 'BUY'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmPurchaseSheet({
  item,
  playerCredits,
  playerCoins,
  isPurchasing,
  feedback,
  onConfirm,
  onCancel,
}: {
  item: CatalogItem;
  playerCredits: number;
  playerCoins: number;
  isPurchasing: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const currentBalance = item.currency === 'credits' ? playerCredits : playerCoins;
  const isShort = currentBalance < item.price;
  const shortfall = item.price - currentBalance;
  const shortfallFormatted =
    item.currency === 'credits' ? `$${shortfall.toLocaleString()} credits` : `${shortfall} coins`;

  return (
    <Modal label="Confirm Transaction" onClose={onCancel}
      className="bg-panel-light border-t border-line rounded-t-lg p-4 sm:p-5 shadow-sheet"
      header={(
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            Confirm Transaction
          </span>
          <Button
            variant="icon"
            onClick={onCancel}
            aria-label="Close"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full text-xs p-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}
      dismissible={!isPurchasing}
      footer={(
        <div className="flex gap-2.5 mt-1">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            CANCEL
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isShort || isPurchasing}
            loading={isPurchasing}
            className="flex-1"
            data-tour={
              item.id === 'tool-firewall-patch' || item.id === 'firewall-patch'
                ? 'buy-firewall-patch'
                : undefined
            }
          >
            {isPurchasing ? 'PROCESSING...' : isShort ? 'CANNOT AFFORD' : 'CONFIRM PURCHASE'}
          </Button>
        </div>
      )}>
      <div className="flex flex-col gap-4">

        <div className="flex items-center gap-3">
          {item.icon && (
            <div className="w-14 h-14 rounded-[10px] bg-panel border border-line p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-[24px] leading-[28px] font-normal text-ink">{item.name}</h2>
            <p className="font-data text-xs text-ink-muted mt-1 leading-relaxed">{item.effect}</p>
          </div>
        </div>

        {/* Pricing & Balance Verification Card */}
        <div className="bg-panel p-3.5 rounded-[10px] border border-line flex flex-col gap-2.5 font-data text-xs">
          <div className="flex justify-between items-center">
            <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
              Item Cost
            </span>
            <span className="font-bold text-money-text text-sm">
              {item.currency === 'coins' ? `${item.price} Coins` : `$${item.price.toLocaleString()}`}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-line/60 pt-2">
            <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
              Your Balance
            </span>
            <span className="font-bold text-ink">
              {item.currency === 'coins'
                ? `${playerCoins} Coins`
                : `$${playerCredits.toLocaleString()}`}
            </span>
          </div>

          {/* Exploit specific reduced bounty warning */}
          {item.category === 'exploits' && item.bountyPenaltyPercent && (
            <div className="mt-1 p-2.5 bg-danger/10 border border-danger/30 rounded-[8px] text-danger-text text-xs leading-snug">
              <span className="font-bold">EXPLOIT PENALTY:</span> Using this reduces the target
              node’s bounty payout by {item.bountyPenaltyPercent}% (e.g. a $6,500 node payout becomes $
              {Math.round(6500 * (1 - item.bountyPenaltyPercent / 100)).toLocaleString()}).
            </div>
          )}

          {/* Insufficient funds warning with exact shortfall */}
          {isShort && (
            <div className="mt-1 p-2.5 bg-danger/10 border border-danger/30 rounded-[8px] text-danger-text text-xs font-medium">
              INSUFFICIENT FUNDS: You are short by {shortfallFormatted}. Complete more node
              infiltrations to earn credits!
            </div>
          )}
        </div>

        {/* Mentor Build Guidance */}
        {(item.glitchPitch || item.nixTip || item.alexExplanation) && (
          <div className="bg-panel p-3.5 rounded-[10px] border border-line flex flex-col gap-2 font-data text-xs">
            {item.glitchPitch && (
              <div className="flex items-start gap-2">
                <span className="font-bold text-accent text-[10px] uppercase shrink-0">GLITCH:</span>
                <p className="italic text-ink-muted leading-tight">&quot;{item.glitchPitch}&quot;</p>
              </div>
            )}
            {item.alexExplanation && (
              <div className="flex items-start gap-2 pt-1.5 border-t border-line/60">
                <span className="font-bold text-ink text-[10px] uppercase shrink-0">ALEX:</span>
                <p className="italic text-ink leading-tight">&quot;{item.alexExplanation}&quot;</p>
              </div>
            )}
            {item.nixTip && (
              <div className="flex items-start gap-2 pt-1.5 border-t border-line/60">
                <span className="font-bold text-accent text-[10px] uppercase shrink-0">NIX:</span>
                <p className="italic text-ink leading-tight">&quot;{item.nixTip}&quot;</p>
              </div>
            )}
            {item.recommendedWhen && (
              <div className="mt-0.5 text-[10px] text-accent font-bold uppercase tracking-wide">
                RECOMMENDED: {item.recommendedWhen}
              </div>
            )}
          </div>
        )}

        {/* Live Impact Preview Card for Rig Hardware */}
        {item.category === 'rig' && (() => {
          const norm = normalizeHardwareId(item.id);
          const preview = norm ? getHardwareStatPreview(norm, {}) : null;
          if (!preview) return null;
          return (
            <div
              data-testid="market-stat-preview"
              className="bg-panel p-3.5 rounded-[10px] border border-accent/40 flex flex-col gap-1.5 font-data text-xs"
            >
              <div className="flex justify-between items-center border-b border-line/60 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  LIVE IMPACT PREVIEW // 4-DIGIT NODE
                </span>
                <span className="text-[9px] text-ink-muted uppercase">HARDWARE UPGRADE</span>
              </div>
              {preview.changes.map((ch, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-ink-muted">{ch.label}:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-ink-muted">{ch.before} &rarr;</span>
                    <span className={ch.tone === 'positive' ? 'text-money-text' : ch.tone === 'warning' ? 'text-danger-text' : 'text-ink'}>
                      {ch.after} ({ch.delta})
                    </span>
                  </div>
                </div>
              ))}
              {item.tradeOff && (
                <div className="mt-1 p-2 rounded bg-danger/10 border border-danger/30 text-[11px] text-danger-text leading-snug">
                  <span className="font-bold uppercase tracking-wider">Trade-off: </span>
                  <span>{item.tradeOff}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 rounded-[8px] text-xs font-data ${
              feedback.type === 'success'
                ? 'bg-accent/15 text-accent-text border border-accent/40 font-bold'
                : 'bg-danger/15 text-danger-text border border-danger/40'
            }`}
          >
            {feedback.message}
          </div>
        )}

      </div>
    </Modal>
  );
}

function EquipDrawer({
  ownedTools,
  equippedTools,
  inventory,
  onToggleEquip,
  onClose,
}: {
  ownedTools: CatalogItem[];
  equippedTools: string[];
  inventory: Record<string, number>;
  onToggleEquip: (toolId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal label="Equip Breach Tools" onClose={onClose}
      className="bg-panel-light border-t border-line rounded-t-lg p-4 sm:p-5 shadow-sheet"
      header={(
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div>
            <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block">
              Loadout Config
            </span>
            <h2 className="font-heading text-[24px] leading-[28px] font-normal text-ink">
              Equip Breach Tools
            </h2>
            <p className="font-data text-xs text-ink-muted mt-0.5">
              Choose up to two consumable tools to arm your intrusion rig.
            </p>
          </div>
          <Button
            variant="icon"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 bg-transparent border-transparent hover:border-transparent text-ink text-xs p-1"
          >
            <span className="w-7 h-7 rounded-full bg-panel border border-line flex items-center justify-center hover:bg-panel-dark/5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </span>
          </Button>
        </div>
      )}
      footer={(
        <Button
          variant="primary"
          fullWidth
          onClick={onClose}
          className="mt-1"
        >
          DONE
        </Button>
      )}>
      <div className="flex flex-col gap-4">

        {/* Active Tool Slots */}
        <div className="grid grid-cols-2 gap-2.5 bg-panel p-3 rounded-[10px] border border-line">
          {[0, 1].map((slotIdx) => {
            const equippedId = equippedTools[slotIdx];
            const tool = CATALOG.find((it) => it.id === equippedId);

            return (
              <div
                key={slotIdx}
                className="bg-panel-light border border-line p-2.5 rounded-[8px] flex flex-col justify-between min-h-[64px]"
              >
                <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
                  Slot {slotIdx + 1}
                </span>
                {tool ? (
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {tool.icon && (
                        <div className="w-6 h-6 rounded bg-panel border border-line p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <span className="font-heading text-xs font-bold text-ink truncate">
                        {tool.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      compact
                      onClick={() => onToggleEquip(tool.id)}
                      className="text-xs text-danger-text hover:underline ml-1 h-auto min-h-[28px] border-none px-1"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <span className="font-data text-xs text-ink-muted italic mt-1">
                    [Empty Slot]
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Available Owned Tools List */}
        <div className="flex flex-col gap-2">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            Owned Inventory
          </span>
          {ownedTools.length === 0 ? (
            <p className="font-data text-xs text-ink-muted italic py-3 text-center">
              No consumable tools in inventory. Purchase tools from the market first!
            </p>
          ) : (
            ownedTools.map((tool) => {
              const isEquipped = equippedTools.includes(tool.id);
              const count = inventory[tool.id] || 0;

              return (
                <div
                  key={tool.id}
                  className={`p-3 rounded-[10px] border flex items-center justify-between gap-2 transition-all ${
                    isEquipped
                      ? 'bg-accent/10 border-accent'
                      : 'bg-panel-light border-line'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {tool.icon && (
                      <div className="w-10 h-10 rounded-[6px] bg-panel border border-line p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm font-bold text-ink truncate">
                          {tool.name}
                        </span>
                        <span className="font-data text-[10px] bg-panel border border-line px-1.5 py-0.5 rounded-[4px] font-bold text-ink">
                          x{count}
                        </span>
                      </div>
                      <p className="font-data text-xs text-ink-muted truncate mt-0.5">
                        {tool.effect}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={isEquipped ? 'danger' : 'primary'}
                    compact
                    onClick={() => onToggleEquip(tool.id)}
                    data-tour={
                      tool.id === 'tool-firewall-patch' || tool.id === 'firewall-patch'
                        ? 'equip-firewall-patch'
                        : undefined
                    }
                  >
                    {isEquipped ? 'UNEQUIP' : 'EQUIP'}
                  </Button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </Modal>
  );
}

function CoinStoreStubModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal label="Coin Exchange Offline" onClose={onClose}
      className="bg-panel-light border border-line rounded-lg p-6 text-center shadow-card"
      footer={(
        <Button
          variant="primary"
          fullWidth
          onClick={onClose}
        >
          RETURN TO MARKET
        </Button>
      )}>
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-money/15 border border-money/40 flex items-center justify-center text-money-text mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-7 0c0 2 1.5 3 3.5 3s3.5 1 3.5 3a3.5 3.5 0 0 1-7 0" />
          </svg>
        </div>

        <div>
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block">
            Testnet Protocol
          </span>
          <h2 className="font-heading text-[28px] leading-[32px] font-normal text-ink mt-1">
            COIN EXCHANGE OFFLINE
          </h2>
          <p className="font-data text-xs sm:text-sm text-ink-muted leading-relaxed mt-2">
            Payments are not enabled in this build. Coins are testnet simulation tokens earned
            through daily breach streaks and high-tier node incursions. Real payment gateways
            will activate in public launch.
          </p>
        </div>

        <div className="bg-panel p-3 rounded-[8px] border border-line font-data text-xs text-ink flex items-center justify-between">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            Balance
          </span>
          <span className="font-bold text-money-text">45 Coins Available</span>
        </div>

      </div>
    </Modal>
  );
}
