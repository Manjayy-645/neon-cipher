'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PresetPreview } from '@/features/rig/PresetPreview';
import { CATALOG } from '@/features/market/catalog';
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
import { HardwareRailSlot, RigHardwareId, RIG_PRESETS, type RigPreset } from '@neon-cipher/game-rules';

export default function RigPage() {
  const router = useRouter();
  const { credits, coins, inventory, equippedTools, syncWallet } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'cyberdeck' | 'safehouse' | 'ledger'>('cyberdeck');
  const [rigError, setRigError] = useState(false);
  const [rigData, setRigData] = useState<RigStateResponse | null>(null);
  const [safehouseData, setSafehouseData] = useState<SafehouseStateResponse | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [previewPreset, setPreviewPreset] = useState<RigPreset | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load initial rig and safehouse states from mock server
  const loadRigState = useCallback(() => {
    rigService
      .getRig()
      .then((data) => {
        setRigData(data);
        syncWallet({
          inventory: data.inventory,
          equippedTools: data.equippedTools,
        });
      })
      .catch((err) => { console.error('Error fetching rig:', err); setRigError(true); });
  }, [syncWallet]);

  const loadSafehouses = useCallback(() => {
    rigService
      .getSafehouses()
      .then((data) => setSafehouseData(data))
      .catch((err) => console.error('Error fetching safehouses:', err));
  }, []);

  useEffect(() => {
    loadRigState();
    loadSafehouses();
  }, [loadRigState, loadSafehouses]);

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
        equippedTools: res.equippedTools,
      });
      loadRigState();
    }
  };

  return (
    <main className="scene-ground scene-arrive w-full h-full flex flex-col text-ink overflow-hidden min-h-0">
      {/* Top Header */}
      <header className="px-4 py-3 lg:py-5 bg-panel/90 border-b border-line shrink-0 flex items-center justify-between gap-3">
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6 flex flex-col gap-4">
        {activeTab === 'cyberdeck' && !rigData && <div className="font-data text-sm p-4 bg-panel-light border border-line rounded-md" role={rigError ? 'alert' : 'status'}>{rigError ? <><p>Could not load your rig. Check your connection and try again.</p><Button variant="secondary" onClick={() => { setRigError(false); loadRigState(); }}>Retry rig</Button></> : 'Loading installed hardware…'}</div>}
        {activeTab === 'cyberdeck' && rigData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full max-w-6xl mx-auto">
            {/* Alex's Recommended Loadout Presets Header Card */}
            <div
              data-testid="alex-loadout-presets"
              className="order-2 w-full bg-panel-light border border-line rounded-md p-3.5 shadow-card font-data text-xs flex flex-col gap-2.5"
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
                      Preview owned parts before applying
                    </span>
                  </div>
                </div>
              </div>

              {/* Preset Buttons Grid */}
              <div className="grid grid-cols-1 gap-2">
                {RIG_PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <Button
                      key={preset.id}
                      variant={isActive ? 'primary' : 'secondary'}
                      compact
                      onClick={() => setPreviewPreset(preset)}
                      data-testid={`preset-btn-${preset.id}`}
                      className="text-left flex flex-col items-start p-2 h-auto text-[10px]"
                    >
                      <span className="font-bold uppercase tracking-wider block">
                        Preview {preset.name}
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

            <section className="order-1 space-y-3 lg:col-start-1 lg:row-start-1">
            <h2 className="font-heading text-xl">Installed hardware &amp; consumable bays</h2>
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
            </section>
            <section className="order-3 bg-panel-light border border-line rounded-md p-4 lg:col-span-2" aria-label="Owned inventory">
              <h2 className="font-heading text-xl mb-3">Inventory</h2>
              <p className="font-data text-xs text-ink-muted mb-3">Stored items are separate from installed hardware. Consumables are used during breaches.</p>
              <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2 font-data text-xs">{Object.entries(inventory).filter(([, qty]) => qty > 0).map(([id, qty]) => {
                const item = CATALOG.find((entry) => entry.id === id);
                return <li key={id} className="flex justify-between gap-3 border-b border-line py-2"><span>{item?.name ?? rigData.hardware[id]?.name ?? id.replaceAll('_', ' ').replaceAll('-', ' ')}{equippedTools.includes(id) ? ' · Equipped' : ''}</span><strong>×{qty}</strong></li>;
              })}</ul>
              {Object.values(inventory).every((qty) => qty <= 0) && <p className="font-data text-xs">No stored items. Visit Market to browse equipment.</p>}
            </section>
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

      {previewPreset && rigData && <PresetPreview preset={previewPreset} rig={rigData} onApply={handleApplyPreset} onClose={() => setPreviewPreset(null)} />}
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
