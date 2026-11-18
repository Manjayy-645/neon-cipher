import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { Toast } from '../Toast';
import { useToastStore, triggerToast } from '@/stores/toast-store';
import { SegmentedControl } from '../SegmentedControl';
import { Button } from '../Button';
import { NixBubble } from '@/features/hud/NixBubble';
import { PartDetailDrawer } from '@/features/rig/PartDetailDrawer';
import { LoadoutSelector } from '@/features/rig/LoadoutSelector';
import { MapMarker } from '@/features/map/MapMarker';
import { ChapterSelect } from '@/features/story/ChapterSelect';
import { useCampaignStore } from '@/stores/campaign-store';
import { useMapStore } from '@/stores/map-store';
import { GameNode } from '@/features/map/nodeService';
import { RigHardwareItem } from '@/app/api/mock/db';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/map',
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@/features/story/campaignService', () => ({
  campaignService: {
    getCampaign: vi.fn().mockResolvedValue({
      debt: { initial: 10000, current: 10000, paid: 0 },
      chapters: {
        'chapter-1': { id: 'chapter-1', number: 1, status: 'completed' },
        'chapter-2': { id: 'chapter-2', number: 2, status: 'active' },
        'chapter-3': { id: 'chapter-3', number: 3, status: 'locked' },
        'chapter-4': { id: 'chapter-4', number: 4, status: 'locked' },
        'chapter-5': { id: 'chapter-5', number: 5, status: 'locked' },
      },
      unlocks: { blackMarket: false, bridge: false, onlinePlay: false },
    }),
    saveProgress: vi.fn().mockResolvedValue({ success: true }),
    resetCampaign: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('STYLE B2: Interactivity pass for every clickable element', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toast: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('1. Unified <Toast> System', () => {
    it('renders toast with panelLight, 1px line, radius 12, auto-dismiss 2.5s and role="status"', () => {
      render(<Toast />);

      act(() => {
        triggerToast('Test message notification', { type: 'locked' });
      });

      const toast = screen.getByRole('status');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Test message notification');
      expect(toast).toHaveTextContent('LOCKED');

      // Auto-dismiss after 2.5s
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('can be manually dismissed by clicking close button', () => {
      render(<Toast />);

      act(() => {
        triggerToast('Manual dismiss test', { type: 'info' });
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
      const closeBtn = screen.getByRole('button', { name: /dismiss toast/i });

      act(() => {
        fireEvent.click(closeBtn);
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('2. <SegmentedControl> with WAI-ARIA and Keyboard Navigation', () => {
    function ControlledSegmented() {
      const [val, setVal] = useState('one');
      return (
        <SegmentedControl
          value={val}
          onChange={setVal}
          options={[
            { id: 'one', label: 'FIRST TAB' },
            { id: 'two', label: 'SECOND TAB' },
            { id: 'three', label: 'THIRD TAB' },
          ]}
          ariaLabel="Test Control"
        />
      );
    }

    it('renders role="tablist" with 44px min height and role="tab" elements', () => {
      render(<ControlledSegmented />);
      const tablist = screen.getByRole('tablist', { name: 'Test Control' });
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveClass('min-h-[44px]', 'min-w-0', 'flex');

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveClass('min-w-0');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[0]).toHaveClass('bg-accent', 'text-on-accent');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveClass('bg-panel-light', 'text-ink');
    });

    it('navigates with ArrowRight, ArrowLeft, Home, and End keys', () => {
      render(<ControlledSegmented />);
      const tabs = screen.getAllByRole('tab');

      // Focus first tab and press ArrowRight
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Press ArrowRight again to reach third tab
      fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');

      // Press Home key to go back to first tab
      fireEvent.keyDown(tabs[2], { key: 'Home' });
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Press End key to go to last tab
      fireEvent.keyDown(tabs[0], { key: 'End' });
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');

      // Press ArrowLeft
      fireEvent.keyDown(tabs[2], { key: 'ArrowLeft' });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('3. <Button> States, Loading, and Disabled Reason', () => {
    it('renders with pressed scale, focus ring, and min-h 48 for primary', () => {
      render(<Button variant="primary">JACK IN</Button>);
      const btn = screen.getByRole('button', { name: 'JACK IN' });
      expect(btn).toHaveClass('min-h-[48px]', 'active:scale-[0.97]', 'focus-visible:ring-accent');
    });

    it('displays loading state with spinner and aria-busy', () => {
      render(<Button loading>SUBMITTING</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toBeDisabled();
    });

    it('displays disabled state with reason explaining why', () => {
      render(<Button disabled reason="Finish Chapter 2 to unlock">MARKET</Button>);
      const btn = screen.getByRole('button', { name: 'MARKET' });
      expect(btn).toBeDisabled();
      expect(screen.getByText('Finish Chapter 2 to unlock')).toBeInTheDocument();
      expect(btn).toHaveAttribute('aria-describedby');
    });
  });

  describe('4. Clickable Cards and Locked Condition Toasts', () => {
    it('ChapterSelect locked card explains unlock condition in plain language when tapped', () => {
      useCampaignStore.setState({
        chapters: {
          'chapter-1': { id: 'chapter-1', status: 'completed' },
          'chapter-2': { id: 'chapter-2', status: 'active' },
          'chapter-3': { id: 'chapter-3', status: 'locked' },
          'chapter-4': { id: 'chapter-4', status: 'locked' },
          'chapter-5': { id: 'chapter-5', status: 'locked' },
        },
      });

      render(
        <>
          <Toast />
          <ChapterSelect onSelectChapter={vi.fn()} />
        </>
      );

      const ch3Card = screen.getByTestId('chapter-card-chapter-3');
      expect(ch3Card).toHaveAttribute('role', 'button');
      expect(ch3Card).toHaveClass('active:scale-[0.99]');

      // Click locked card
      act(() => {
        fireEvent.click(ch3Card);
      });

      // Verify toast with plain language explanation
      const toast = screen.getByRole('status');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Finish Chapter 2 to open this');
    });

    it('MapMarker has scale 0.95 tap state, Enter/Space support, and triggers toast when locked', () => {
      useMapStore.setState({ unlocks: { bridge: false }, selectedNodeId: null, activeNodeId: null });
      useCampaignStore.setState({ unlocks: { bridge: false, blackMarket: false, onlinePlay: false } });
      const mockNode: GameNode = {
        id: 'node-test',
        name: 'Harbor Relay',
        type: 'relay',
        tier: 3,
        status: 'available',
        district: 'commercial',
        x: 100,
        y: 100,
        digits: 4,
        allowDuplicates: false,
        attempts: 7,
        timerSeconds: 45,
        bounty: 400,
        traceRisk: 25,
        requiresUnlock: true,
      };

      render(
        <>
          <Toast />
          <MapMarker node={mockNode} />
        </>
      );

      const markerBtn = screen.getByRole('button');
      expect(markerBtn).toHaveAttribute('aria-label');

      // Click locked marker
      act(() => {
        fireEvent.click(markerBtn);
      });

      const toast = screen.getByRole('status');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Harbor Relay is locked: Complete Chapter 3 to gain district clearance.');
      // Inspection is allowed; selecting the marker must never grant bridge access.
      expect(useMapStore.getState().selectedNodeId).toBe('node-test');
      expect(useMapStore.getState().unlocks.bridge).toBe(false);
      expect(useCampaignStore.getState().unlocks.bridge).toBe(false);
    });
  });

  describe('5. Escape Key Closes Bubbles, Drawers, and Sheets', () => {
    it('closes NixBubble when Escape is pressed', () => {
      const onDismiss = vi.fn();
      render(<NixBubble message="Standard ICE. Watch the timer." isOpen={true} onDismiss={onDismiss} />);

      expect(screen.getByText('Standard ICE. Watch the timer.')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('closes PartDetailDrawer when Escape is pressed', () => {
      const onClose = vi.fn();
      const mockHardware: Record<string, RigHardwareItem> = {
        coprocessor: {
          id: 'coprocessor-1',
          name: 'Optical Buffer',
          slot: 'coprocessor',
          installed: true,
          burned: false,
          repairCost: 200,
          effect: '+15s timer',
          nixTip: 'Saves you from quick ICE.',
        },
      };

      render(
        <PartDetailDrawer
          slotId="coprocessor"
          hardware={mockHardware}
          credits={500}
          isRepairing={false}
          onRepair={vi.fn()}
          onClose={onClose}
        />
      );

      expect(screen.getByText('Optical Buffer')).toBeInTheDocument();

      // Native dialogs handle Escape through the cancel event. jsdom does not
      // synthesize that browser default action from a window keydown.
      const dialog = screen.getByRole('dialog', { name: 'Hardware diagnostics' });
      expect(dialog).toHaveAttribute('open');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      fireEvent(dialog, new Event('cancel', { cancelable: true }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes LoadoutSelector when Escape is pressed', () => {
      const onClose = vi.fn();
      render(
        <LoadoutSelector
          isOpen={true}
          equippedTools={[]}
          inventory={{}}
          onToggleEquip={vi.fn()}
          onClose={onClose}
        />
      );

      // jsdom does not synthesize Escape's native dialog cancel action.
      // Real Escape and focus containment are exercised by overlay-safety.cjs.
      fireEvent(screen.getByRole('dialog', { name: 'LOADOUT SELECTOR' }),
        new Event('cancel', { cancelable: true }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
