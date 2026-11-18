'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { RigHardwareItem } from '@/app/api/mock/db';
import { getItemIcon } from '../market/catalog';
import { Button } from '@/components/ui/Button';
import {
  HardwareRailSlot,
  RigHardwareId,
  normalizeHardwareId,
  getHardwareStatPreview,
  RIG_HARDWARE_MODULES,
} from '@neon-cipher/game-rules';

interface PartDetailDrawerProps {
  slotId: string;
  hardware: Record<string, RigHardwareItem>;
  equippedRails?: Partial<Record<HardwareRailSlot, RigHardwareId | null>>;
  inventory?: Record<string, number>;
  credits: number;
  isRepairing: boolean;
  onRepair: (hardwareId: string) => void;
  onEquipRail?: (slot: HardwareRailSlot, hardwareId: RigHardwareId | null) => void;
  onClose: () => void;
  onNavigateToMarket?: () => void;
}

export const PartDetailDrawer: React.FC<PartDetailDrawerProps> = ({
  slotId,
  hardware,
  equippedRails,
  inventory = {},
  credits,
  isRepairing,
  onRepair,
  onEquipRail,
  onClose,
  onNavigateToMarket,
}) => {
  const item = hardware[slotId];
  if (!item) return null;

  const canAffordRepair = credits >= item.repairCost;
  const normalizedId = normalizeHardwareId(item.id);
  const catalogModule = normalizedId ? RIG_HARDWARE_MODULES[normalizedId] : null;

  const alexText = item.alexExplanation || catalogModule?.alexExplanation;
  const nixText = item.nixTip || catalogModule?.nixTip;
  const tradeOffText = item.tradeOff || catalogModule?.tradeOff;
  const archetype = item.buildArchetype || catalogModule?.buildArchetype;
  const railSlot = (item.railSlot || catalogModule?.railSlot) as HardwareRailSlot | undefined;

  const currentRails = equippedRails || {
    memory_1: null,
    memory_2: null,
    coprocessor: null,
    bus_interconnect: null,
  };

  const isEquipped = railSlot ? currentRails[railSlot] === normalizedId || item.installed : item.installed;
  const isOwned = (inventory[item.id] || 0) > 0 || (normalizedId && (inventory[normalizedId] || 0) > 0) || item.installed;

  // Stat preview diff
  const statPreview = normalizedId ? getHardwareStatPreview(normalizedId, currentRails) : null;



  return (
    <Modal label="Hardware diagnostics" onClose={onClose} className="bg-panel-light border border-line rounded-t-lg p-5 shadow-sheet" footer={<Button variant="secondary" fullWidth onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-muted/30 pb-2">
          <span className="font-data text-[10px] uppercase tracking-wider text-ink-muted">
            HARDWARE DIAGNOSTICS // {(railSlot || item.slot).toUpperCase()}
          </span>
          <Button
            variant="icon"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 bg-transparent border-transparent hover:border-transparent text-ink text-xs p-1"
          >
            <span className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center hover:bg-ink/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </span>
          </Button>
        </div>

        {/* Part Title and Status */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-[8px] bg-panel-dark/10 border border-line p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getItemIcon(item.id)} alt={item.name} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-ink">{item.name}</h2>
              {item.burned ? (
                <span className="bg-danger/20 text-danger-text border border-danger/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  OVERVOLT BURN
                </span>
              ) : isEquipped ? (
                <span className="bg-accent/20 text-accent-text border border-accent/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  OPERATIONAL
                </span>
              ) : (
                <span className="bg-ink/10 text-ink-muted border border-ink-muted/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  NOT INSTALLED
                </span>
              )}
            </div>
            {archetype && (
              <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-widest text-accent font-data">
                ARCHETYPE: [{archetype}]
              </span>
            )}
            <p className="font-data text-xs text-ink-muted mt-1 leading-relaxed">{item.effect}</p>
          </div>
        </div>

        {/* Live Impact Preview Card */}
        {statPreview && (
          <div
            data-testid="live-impact-preview-card"
            className="bg-panel-light p-3.5 rounded-md border border-accent/40 flex flex-col gap-2 font-data text-xs"
          >
            <div className="flex justify-between items-center border-b border-line/60 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                LIVE IMPACT PREVIEW // 4-DIGIT BASELINE
              </span>
              <span className="text-[9px] text-ink-muted uppercase">HOT-SWAP PREVIEW</span>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              {statPreview.changes.map((ch, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-ink-muted">{ch.label}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">{ch.before} &rarr;</span>
                    <span
                      className={`font-bold ${
                        ch.tone === 'positive'
                          ? 'text-money-text'
                          : ch.tone === 'warning'
                          ? 'text-danger-text'
                          : 'text-ink'
                      }`}
                    >
                      {ch.after} ({ch.delta})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trade-Off Notice */}
            {(tradeOffText || statPreview.tradeOffNote) && (
              <div className="mt-1 p-2 rounded bg-danger/10 border border-danger/30 text-[11px] text-danger-text leading-snug">
                <span className="font-bold uppercase tracking-wider">Trade-off: </span>
                <span>{tradeOffText || statPreview.tradeOffNote}</span>
              </div>
            )}

            {/* Slot Swap Notice */}
            {statPreview.slotSwapNotice && (
              <div className="mt-1 p-2 rounded bg-accent/10 border border-accent/30 text-[11px] text-accent-text leading-snug">
                <span className="font-bold uppercase tracking-wider">Slot Notice: </span>
                <span>{statPreview.slotSwapNotice}</span>
              </div>
            )}
          </div>
        )}

        {/* Alex Hardware Tech Guidance */}
        {alexText && (
          <div className="bg-panel-dark/10 p-3 rounded-md border border-line flex items-start gap-3">
            <div className="w-8 h-8 rounded-full border border-line overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Character portraits/Alex.png" alt="Alex" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-xs font-data">
              <span className="font-bold text-ink uppercase tracking-wider text-[10px] block mb-0.5">
                Alex&apos;s Tech Bench Guidance
              </span>
              <p className="italic text-ink leading-snug">&quot;{alexText}&quot;</p>
            </div>
          </div>
        )}

        {/* Nix Plain-Language Explanation */}
        {nixText && (
          <div className="bg-panel-dark/10 p-3.5 rounded-md border border-ink-muted/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full border border-accent overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Character portraits/Nix.png" alt="Nix" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-xs font-data">
              <span className="font-bold text-accent uppercase tracking-wider text-[10px] block mb-0.5">
                Nix Field Briefing
              </span>
              <p className="italic text-ink leading-snug">&quot;{nixText}&quot;</p>
            </div>
          </div>
        )}

        {/* Hot-Swap / Equip Controls */}
        {railSlot && onEquipRail && isOwned && !item.burned && (
          <div className="flex gap-2">
            {isEquipped ? (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => onEquipRail(railSlot, null)}
              >
                UNEQUIP MODULE
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                onClick={() => onEquipRail(railSlot, normalizedId)}
              >
                EQUIP TO {(railSlot || '').toUpperCase()}
              </Button>
            )}
          </div>
        )}

        {/* State-specific actions */}
        {item.burned ? (
          <div className="bg-danger/10 border border-danger/30 rounded-md p-4 flex flex-col gap-3 font-data text-xs">
            <div className="flex justify-between items-center">
              <span className="text-danger-text font-bold">REPAIR DIAGNOSTIC:</span>
              <span className="text-danger-text">Bus traces severed from Tier 5 counter-hack</span>
            </div>
            <div className="flex items-center gap-2.5 pt-1 border-t border-danger/20">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-line shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Character portraits/Alex.png" alt="Alex" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] text-ink-muted leading-tight">
                Alex&apos;s Tech Bench: Certified soldering & overvolt circuit recovery
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-danger/20 pt-2">
              <span className="text-ink-muted">Repair Fee:</span>
              <span className="font-bold text-money-text text-sm">
                ${item.repairCost.toLocaleString()} Credits
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-muted">Available Balance:</span>
              <span className="font-bold text-ink">${credits.toLocaleString()} Credits</span>
            </div>

            <Button
              variant="danger"
              fullWidth
              onClick={() => onRepair(item.id)}
              disabled={!canAffordRepair || isRepairing}
              loading={isRepairing}
              className="mt-1"
            >
              {isRepairing
                ? 'REPAIRING CIRCS...'
                : canAffordRepair
                ? `REPAIR FOR $${item.repairCost.toLocaleString()}`
                : `CANNOT AFFORD REPAIR (SHORT BY $${(item.repairCost - credits).toLocaleString()})`}
            </Button>
          </div>
        ) : !isOwned ? (
          <div className="bg-panel-dark/5 border border-ink-muted/30 rounded-md p-4 flex flex-col gap-2 font-data text-xs text-center">
            <p className="text-ink-muted">
              This module is not currently owned in your storage inventory. Acquire permanent modules
              from Glitch&apos;s Black Market.
            </p>
            {onNavigateToMarket && (
              <Button
                variant="primary"
                fullWidth
                arrow
                onClick={onNavigateToMarket}
                className="mt-2 text-xs"
              >
                BROWSE HARDWARE AT BLACK MARKET
              </Button>
            )}
          </div>
        ) : isEquipped ? (
          <div className="bg-accent/10 border border-accent/30 rounded-md p-3 font-data text-xs text-accent-text flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Bus online. This upgrade automatically applies to eligible terminal infiltrations.</span>
          </div>
        ) : null}

      </div>
    </Modal>
  );
};
