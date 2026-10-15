'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CyberdeckSchematic } from '@/features/rig/CyberdeckSchematic';
import { PartDetailDrawer } from '@/features/rig/PartDetailDrawer';
import { LoadoutSelector } from '@/features/rig/LoadoutSelector';
import { SafehouseDashboard } from '@/features/rig/SafehouseDashboard';
import { WalletHistory } from '@/features/rig/WalletHistory';
import { rigService, RigStateResponse, SafehouseStateResponse } from '@/features/rig/rigService';
import { walletService } from '@/features/market/walletService';
import { usePlayerStore } from '@/stores/player-store';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { triggerToast } from '@/stores/toast-store';
import { HardwareRailSlot, RigHardwareId, RIG_PRESETS } from '@neon-cipher/game-rules';

export default function RigPage() {
  const router = useRouter();
  const { credits, coins, inventory, equippedTools, syncWallet } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'cyberdeck' | 'safehouse' | 'ledger'>('cyberdeck');
  const [rigData, setRigData] = useState<RigStateResponse | null>(null);
  const [safehouseData, setSafehouseData] = useState<SafehouseStateResponse | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load initial rig and safehouse states from mock server
  const loadRigState = () => {
    rigService
      .getRig()
      .then((data) => {
        setRigData(data);
        syncWallet({
          credits,
          coins,
          inventory: data.inventory,
          equippedTools: data.equippedTools,
        });
      })
      .catch((err) => console.error('Error fetching rig:', err));
  };

  const loadSafehouses = () => {
    rigService
      .getSafehouses()
      .then((data) => setSafehouseData(data))
      .catch((err) => console.error('Error fetching safehouses:', err));
  };

  useEffect(() => {
    loadRigState();
    loadSafehouses();
  }, []);

  const handleSelectSlot = (slotId: string) => {
    if (slotId.startsWith('tool-slot')) {
      setIsLoadoutOpen(true);
    } else {
      setSelectedSlotId(slotId);
    }
  };

  const handleRepairHardware = async (hardwareId: string) => {
    setIsRepairing(true);
    const res = await rigService.repairHardware(hardwareId);
    setIsRepairing(false);

    if (res.success && res.balances) {
      syncWallet({
        credits: res.balances.credits,
        coins: res.balances.coins,
      });
      loadRigState();
    }
  };

  const handleEquipRail = async (slot: HardwareRailSlot, hardwareId: RigHardwareId | null) => {
    const res = await rigService.equipRail(slot, hardwareId);
    if (res.success) {
      loadRigState();
      if (res.message) {
        triggerToast(res.message);
      }
    } else if (res.error) {
      triggerToast(res.error);
    }
  };

  const handleApplyPreset = async (presetId: 'safe_learner' | 'cash_farmer' | 'pvp_duelist') => {
    setActivePresetId(presetId);
    const res = await rigService.applyPreset(presetId);
    if (res.success) {
      loadRigState();
      if (res.missingModules && res.missingModules.length > 0) {
        triggerToast(`Equipped owned parts. Missing from market: ${res.missingModules.length} item(s)`);
      } else {
        triggerToast(`Loadout configured: ${res.preset?.name || presetId}`);
      }
    } else if (res.error) {
      triggerToast(res.error);
    }
  };

  const handleToggleEquip = async (toolId: string) => {
    let nextEquipped = [...equippedTools];
    if (nextEquipped.includes(toolId)) {
      nextEquipped = nextEquipped.filter((id) => id !== toolId);
    } else {
      if (nextEquipped.length >= 2) {
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
      loadRigState();
    }
  };

  return (
    <main className="scene-ground scene-arrive w-full h-full flex flex-col text-ink overflow-hidden">
      {/* Top Header */}
      <header className="px-4 py-4 sm:py-5 bg-panel/90 border-b border-line shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span aria-hidden="true" className="hidden xs:flex w-10 h-10 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent-text font-heading text-xl">
            R
          </span>
          <div className="min-w-0">
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block">
            HARDWARE & SAFEHOUSE NETWORK
          </span>
          <h1 className="font-heading text-[28px] leading-[32px] font-normal text-ink">
            The Workbench
          </h1>
          </div>
        </div>

        {/* Balances Display */}
        <div className="flex items-center gap-2 font-data text-xs shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-panel-light border border-line rounded-[6px] font-semibold text-money-text tabular-nums">
            <span>${credits.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-panel-light border border-line rounded-[6px] font-semibold text-ink tabular-nums">
            <span className="w-2 h-2 rounded-full bg-money inline-block shrink-0" />
            <span>{coins.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs (Segmented Control) */}
      <div className="px-4 py-3 bg-panel-light/85 border-b border-line shrink-0">
        <SegmentedControl
          ariaLabel="Rig Workbench Tabs"
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'cyberdeck' | 'safehouse' | 'ledger')}
          options={[
            { id: 'cyberdeck', label: 'CYBERDECK', testId: 'tab-cyberdeck' },
            { id: 'safehouse', label: 'SAFEHOUSE', testId: 'tab-safehouse' },
            { id: 'ledger', label: 'LEDGER', testId: 'tab-ledger' },
          ]}
        />
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-4">
        {activeTab === 'cyberdeck' && rigData && (
          <div className="flex flex-col gap-4 items-center w-full max-w-md mx-auto">
            {/* Alex's Recommended Loadout Presets Header Card */}
            <div
              data-testid="alex-loadout-presets"
              className="w-full bg-panel-light border border-line rounded-md p-3.5 shadow-card font-data text-xs flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between border-b border-line/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-line shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/Character portraits/Alex.png" alt="Alex" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-heading text-xs font-bold text-ink block">
                      ALEX&apos;S RECOMMENDED PRESETS
                    </span>
                    <span className="text-[10px] text-ink-muted">
                      1-Tap Build Helper // Optimized Archetypes
                    </span>
                  </div>
                </div>
              </div>

              {/* Preset Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {RIG_PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <Button
                      key={preset.id}
                      variant={isActive ? 'primary' : 'secondary'}
                      compact
                      onClick={() => handleApplyPreset(preset.id as any)}
                      data-testid={`preset-btn-${preset.id}`}
                      className="text-left flex flex-col items-start p-2 h-auto text-[10px]"
                    >
                      <span className="font-bold uppercase tracking-wider block">
                        [{preset.name}]
                      </span>
                      <span className="text-[9px] opacity-80 line-clamp-1">
                        {preset.tagline}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Alex's Selected Preset Note */}
              {activePresetId && (
                <div className="mt-1 p-2 rounded bg-panel border border-accent/30 text-[11px] leading-snug italic text-ink">
                  &quot;{RIG_PRESETS.find((p) => p.id === activePresetId)?.alexNote}&quot;
                </div>
              )}
            </div>

            {/* Cyberdeck Schematic */}
            <CyberdeckSchematic
              hardware={rigData.hardware}
              equippedRails={rigData.equippedRails}
              equippedTools={equippedTools}
              onSelectSlot={handleSelectSlot}
              selectedSlotId={selectedSlotId}
            />

            {/* Quick Loadout Action Button */}
            <Button
              variant="primary"
              fullWidth
              onClick={() => setIsLoadoutOpen(true)}
              className="max-w-md"
            >
              MANAGE INTRUSION LOADOUT ({equippedTools.length}/2)
            </Button>
          </div>
        )}

        {activeTab === 'safehouse' && safehouseData && (
          <SafehouseDashboard
            properties={safehouseData.properties}
            ownedLeases={safehouseData.ownedLeases}
            stats={safehouseData.stats}
            onRefresh={loadSafehouses}
          />
        )}

        {activeTab === 'ledger' && <WalletHistory />}
      </div>

      {/* Part Detail Inspection / Repair Drawer */}
      {selectedSlotId && rigData && (
        <PartDetailDrawer
          slotId={selectedSlotId}
          hardware={rigData.hardware}
          equippedRails={rigData.equippedRails}
          inventory={inventory}
          credits={credits}
          isRepairing={isRepairing}
          onRepair={handleRepairHardware}
          onEquipRail={handleEquipRail}
          onClose={() => setSelectedSlotId(null)}
          onNavigateToMarket={() => router.push('/market')}
        />
      )}

      {/* Loadout Selector Modal */}
      <LoadoutSelector
        isOpen={isLoadoutOpen}
        equippedTools={equippedTools}
        inventory={inventory}
        onToggleEquip={handleToggleEquip}
        onClose={() => setIsLoadoutOpen(false)}
      />
    </main>
  );
}
