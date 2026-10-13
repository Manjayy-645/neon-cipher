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

export default function RigPage() {
  const router = useRouter();
  const { credits, coins, inventory, equippedTools, syncWallet } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'cyberdeck' | 'safehouse' | 'ledger'>('cyberdeck');
  const [rigData, setRigData] = useState<RigStateResponse | null>(null);
  const [safehouseData, setSafehouseData] = useState<SafehouseStateResponse | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

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
      // Keep drawer open so user sees operational status
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
    <main className="w-full h-full flex flex-col bg-panel-light text-ink overflow-hidden">
      {/* Top Header */}
      <header className="px-4 py-4 sm:py-5 bg-panel border-b border-line shrink-0 flex items-center justify-between">
        <div>
          <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block">
            HARDWARE & SAFEHOUSE NETWORK
          </span>
          <h1 className="font-heading text-[28px] leading-[32px] font-normal text-ink">
            RIG WORKBENCH
          </h1>
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
      <div className="px-4 py-3 bg-panel-light border-b border-line shrink-0">
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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'cyberdeck' && rigData && (
          <div className="flex flex-col gap-4 items-center">
            {/* Cyberdeck Schematic */}
            <CyberdeckSchematic
              hardware={rigData.hardware}
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
          credits={credits}
          isRepairing={isRepairing}
          onRepair={handleRepairHardware}
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
