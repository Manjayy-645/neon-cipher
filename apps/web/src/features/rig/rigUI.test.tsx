import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CyberdeckSchematic } from './CyberdeckSchematic';
import { PartDetailDrawer } from './PartDetailDrawer';
import { SafehouseDashboard } from './SafehouseDashboard';
import { WalletHistory } from './WalletHistory';
import { rigService } from './rigService';
import { RigHardwareItem, SafehouseProperty, Transaction } from '@/app/api/mock/db';

describe('Task 9: Rig UI Components', () => {
  const mockHardwareMap: Record<string, RigHardwareItem> = {
    'rig-memory-buffer-1': {
      id: 'rig-memory-buffer-1',
      name: 'Memory Buffer Mk I',
      slot: 'memory-1',
      installed: true,
      burned: false,
      repairCost: 650,
      effect: '+1 maximum guess attempt on Tier 1 and 2 nodes permanently.',
      nixTip: 'Gives you breathing room on street terminals. An extra probe before ICE trips.',
    },
    'rig-memory-buffer-2': {
      id: 'rig-memory-buffer-2',
      name: 'Memory Buffer Mk II',
      slot: 'memory-2',
      installed: false,
      burned: false,
      repairCost: 2200,
      effect: '+1 maximum guess attempt on Tier 3 and 4 nodes permanently.',
      nixTip: 'High-spec memory rail for corporate relays. Protects against tight attempt limits.',
    },
    'rig-heuristic-coprocessor': {
      id: 'rig-heuristic-coprocessor',
      name: 'Heuristic Co-Processor',
      slot: 'coprocessor',
      installed: true,
      burned: true, // burned state for testing
      repairCost: 1500,
      effect: 'Automatically analyzes carrier waves to eliminate two dead digits at hack start.',
      nixTip: 'Instantly burns away two false digits right when you jack in. Cuts guesswork in half.',
    },
  };

  describe('<CyberdeckSchematic />', () => {
    it('renders schematic SVG and all hardware & expansion bays', () => {
      const handleSelect = vi.fn();
      render(
        <CyberdeckSchematic
          hardware={mockHardwareMap}
          equippedTools={['tool-static-injector']}
          onSelectSlot={handleSelect}
          selectedSlotId={null}
        />
      );

      // Check slot titles/labels
      expect(screen.getByText('MEM BUFFER MK I')).toBeDefined();
      expect(screen.getByText('MEM BUFFER MK II')).toBeDefined();
      expect(screen.getByText('HEURISTIC CO-PROCESSOR')).toBeDefined();
      expect(screen.getByText('TOOL BAY 1')).toBeDefined();
      expect(screen.getByText('TOOL BAY 2')).toBeDefined();

      // Click a slot
      fireEvent.click(screen.getByText('MEM BUFFER MK I'));
      expect(handleSelect).toHaveBeenCalledWith('rig-memory-buffer-1');
    });
  });

  describe('<PartDetailDrawer />', () => {
    it('renders plain language briefing and repair button when burned', () => {
      const handleRepair = vi.fn();
      const handleClose = vi.fn();

      render(
        <PartDetailDrawer
          slotId="rig-heuristic-coprocessor"
          hardware={mockHardwareMap}
          credits={5000}
          isRepairing={false}
          onRepair={handleRepair}
          onClose={handleClose}
        />
      );

      expect(screen.getByText('Heuristic Co-Processor')).toBeDefined();
      expect(screen.getByText('OVERVOLT BURN')).toBeDefined();
      expect(screen.getByText(/REPAIR FOR/i)).toBeDefined();

      // Trigger repair
      fireEvent.click(screen.getByText(/REPAIR FOR/i));
      expect(handleRepair).toHaveBeenCalledWith('rig-heuristic-coprocessor');
    });

    it('shows Nix explanation and normal state when not burned', () => {
      const handleRepair = vi.fn();
      const handleClose = vi.fn();

      render(
        <PartDetailDrawer
          slotId="rig-memory-buffer-1"
          hardware={mockHardwareMap}
          credits={5000}
          isRepairing={false}
          onRepair={handleRepair}
          onClose={handleClose}
        />
      );

      expect(screen.getByText('Memory Buffer Mk I')).toBeDefined();
      expect(screen.getByText('OPERATIONAL')).toBeDefined();
      expect(screen.getByText(/Gives you breathing room/i)).toBeDefined();
    });
  });

  describe('<SafehouseDashboard />', () => {
    const mockProperties: SafehouseProperty[] = [
      {
        id: 'safehouse-slums',
        name: 'Slums Underpass Bunker',
        district: 'slums',
        tier: 1,
        cost: 15000,
        upkeep: 120,
        dailyDividend: 450,
        traceReductionPercent: 15,
        owned: true,
        accumulatedDividends: 350,
        lastClaimedAt: Date.now() - 3600000 * 18,
        description: 'Reinforced concrete basement.',
      },
      {
        id: 'safehouse-industrial',
        name: 'Industrial Warehouse Loft',
        district: 'industrial',
        tier: 2,
        cost: 35000,
        upkeep: 280,
        dailyDividend: 1200,
        traceReductionPercent: 30,
        owned: false,
        accumulatedDividends: 0,
        lastClaimedAt: Date.now(),
        description: 'Abandoned optical manufacturing facility.',
      },
    ];

    const mockStats = {
      ownedCount: 1,
      totalUpkeep: 120,
      totalDailyDividend: 450,
      totalTraceReduction: 15,
    };

    it('renders properties, aggregate metrics, and property cards', () => {
      const handleRefresh = vi.fn();

      render(
        <SafehouseDashboard
          properties={mockProperties}
          stats={mockStats}
          onRefresh={handleRefresh}
        />
      );

      expect(screen.getByText('Slums Underpass Bunker')).toBeDefined();
      expect(screen.getByText('Industrial Warehouse Loft')).toBeDefined();
      expect(screen.getByText(/SAFEHOUSE NETWORK/i)).toBeDefined();
    });
  });

  describe('<WalletHistory />', () => {
    const mockTxList: Transaction[] = [
      {
        id: 'tx-1',
        timestamp: Date.now() - 1000,
        source: 'Breach: Slums ATM',
        amount: 850,
        currency: 'credits',
        runningBalance: 12500,
        category: 'payout',
      },
      {
        id: 'tx-2',
        timestamp: Date.now() - 2000,
        source: 'Exploit: Digit Scrub',
        amount: -5,
        currency: 'coins',
        runningBalance: 40,
        category: 'purchase',
      },
    ];

    it('renders transaction entries and filter chips', async () => {
      vi.spyOn(rigService, 'getWalletHistory').mockResolvedValue({
        transactions: mockTxList,
        totalCount: 2,
      });

      render(<WalletHistory />);

      await waitFor(() => {
        expect(screen.getByText('Breach: Slums ATM')).toBeDefined();
      });

      expect(screen.getByText('+$850')).toBeDefined();
      expect(screen.getByText('Exploit: Digit Scrub')).toBeDefined();
      expect(screen.getByText(/-5 coins/i)).toBeDefined();
      expect(screen.getByText('ALL')).toBeDefined();
      expect(screen.getByText('CREDITS')).toBeDefined();
      expect(screen.getByText('COINS')).toBeDefined();
    });
  });
});
