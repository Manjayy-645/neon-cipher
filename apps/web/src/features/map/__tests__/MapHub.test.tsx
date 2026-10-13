import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapMarker } from '../MapMarker';
import { NodeSheet } from '../../sheet/NodeSheet';
import { Navigation } from '../../../app/Navigation';
import { useMapStore } from '../../../stores/map-store';
import { usePlayerStore } from '../../../stores/player-store';
import { getNodes, GameNode } from '../nodeService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/map',
}));

vi.mock('../../../lib/flags', () => ({
  isFeatureEnabled: (flag: string) => ['map', 'rig', 'market'].includes(flag),
}));

vi.mock('../../market/walletService', () => ({
  walletService: {
    getWallet: vi.fn().mockResolvedValue({
      balance: 100,
      inventory: [],
      equippedTools: [],
    }),
    equipTools: vi.fn().mockResolvedValue({
      success: true,
      equippedTools: [],
    }),
  },
}));

describe('Map Hub Interactivity & Central State', () => {
  const nodes = getNodes();
  const sampleNode1 = nodes.find((n) => n.id === 'n1')!; // Rusty Vending
  const sampleNode4 = nodes.find((n) => n.id === 'n4')!; // Market Register (contested)

  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useMapStore.getState().resetMapState();
      usePlayerStore.setState({
        credits: 12500,
        sectorHeat: 62,
        equippedTools: [],
        inventory: {},
      });
    });
  });

  describe('1. Central State & Selection', () => {
    it('initializes with default central state: null activeNodeId, peek sheetState, and playerStats', () => {
      const state = useMapStore.getState();
      expect(state.activeNodeId).toBeNull();
      expect(state.selectedNodeId).toBeNull();
      expect(state.sheetState).toBe('peek');
      expect(state.sheetHeight).toBe(76);
      expect(state.playerStats).toEqual({ credits: 12500, heat: 62 });
      expect(state.activeTab).toBe('map');
      expect(state.activeView).toBe('map');
    });

    it('updates activeNodeId and opens sheetState to half mode when setActiveNodeId is called', () => {
      act(() => {
        useMapStore.getState().setActiveNodeId('n1');
      });

      const state = useMapStore.getState();
      expect(state.activeNodeId).toBe('n1');
      expect(state.selectedNodeId).toBe('n1');
      expect(state.sheetState).toBe('half');
      expect(state.sheetHeight).toBe(250);
    });

    it('updates playerStats and synchronizes with usePlayerStore', () => {
      act(() => {
        useMapStore.getState().setPlayerStats({ credits: 18000, heat: 75 });
      });

      expect(useMapStore.getState().playerStats).toEqual({ credits: 18000, heat: 75 });
      expect(usePlayerStore.getState().credits).toBe(18000);
      expect(usePlayerStore.getState().sectorHeat).toBe(75);
    });

    it('clicking a map node marker updates activeNodeId and opens bottom sheet to half mode', () => {
      render(<MapMarker node={sampleNode1} />);
      const markerButton = screen.getByRole('button', { name: new RegExp(sampleNode1.name, 'i') });

      expect(useMapStore.getState().activeNodeId).toBeNull();

      act(() => {
        fireEvent.click(markerButton);
      });

      const updated = useMapStore.getState();
      expect(updated.activeNodeId).toBe('n1');
      expect(updated.selectedNodeId).toBe('n1');
      expect(updated.sheetState).toBe('half');
      expect(updated.sheetHeight).toBe(250);
    });
  });

  describe('2. Bottom Sheet Data Binding & Hydration', () => {
    it('hydrates dynamically with the selected node title, tier, digits, try count, timer, and bounty', async () => {
      act(() => {
        useMapStore.getState().setActiveNodeId('n1');
      });

      await act(async () => {
        render(<NodeSheet />);
      });

      // Title & Tier
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(sampleNode1.name);
      expect(screen.getByTestId('status-chip-tier')).toHaveTextContent(`TIER ${sampleNode1.tier}`);

      // Specs row: Digits, Tries, Timer, Bounty
      const specs = screen.getByTestId('specs-row');
      expect(specs).toBeInTheDocument();
      expect(screen.getByText('DIGITS')).toBeInTheDocument();
      expect(screen.getByText(String(sampleNode1.digits))).toBeInTheDocument();
      expect(screen.getByText('TRIES')).toBeInTheDocument();
      expect(screen.getByText(String(sampleNode1.attempts))).toBeInTheDocument();
      expect(screen.getByText('TIMER')).toBeInTheDocument();
      expect(screen.getByText(`${sampleNode1.timerSeconds}s`)).toBeInTheDocument();
      expect(screen.getByText('BOUNTY')).toBeInTheDocument();
      expect(screen.getByText(`$${sampleNode1.bounty}`)).toBeInTheDocument();
    });

    it('re-hydrates dynamically when activeNodeId switches to another node', async () => {
      act(() => {
        useMapStore.getState().setActiveNodeId('n1');
      });

      const { unmount } = render(<NodeSheet />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(sampleNode1.name);
      unmount();

      // Select node n4 (Market Register)
      act(() => {
        useMapStore.getState().setActiveNodeId('n4');
      });

      render(<NodeSheet />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(sampleNode4.name);
      expect(screen.getByText(String(sampleNode4.digits))).toBeInTheDocument();
      expect(screen.getByText(String(sampleNode4.attempts))).toBeInTheDocument();
      expect(screen.getByText(`${sampleNode4.timerSeconds}s`)).toBeInTheDocument();
      expect(screen.getByText(`$${sampleNode4.bounty}`)).toBeInTheDocument();
    });

    it('wires the JACK IN button to trigger event dispatch and route to terminal', async () => {
      const jackInSpy = vi.fn();
      const eventListenerSpy = vi.fn();
      window.addEventListener('cipher:jack-in', eventListenerSpy);

      act(() => {
        useMapStore.getState().setActiveNodeId('n1');
      });

      await act(async () => {
        render(<NodeSheet onJackIn={jackInSpy} />);
      });

      const jackInBtn = screen.getByTestId('jack-in-button');
      expect(jackInBtn).toHaveTextContent('JACK IN');

      act(() => {
        fireEvent.click(jackInBtn);
      });

      expect(jackInSpy).toHaveBeenCalledWith('n1');
      expect(eventListenerSpy).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/terminal/n1');

      window.removeEventListener('cipher:jack-in', eventListenerSpy);
    });
  });

  describe('3. Bottom Navigation Interactivity', () => {
    it('highlights the active tab with accent fill, white text, and aria-current="page"', () => {
      render(<Navigation />);
      const mapItem = screen.getByTestId('nav-item-map');
      expect(mapItem).toHaveAttribute('aria-current', 'page');
      expect(mapItem).toHaveStyle({
        backgroundColor: 'var(--accent)',
        color: 'var(--on-accent)',
      });

      const rigItem = screen.getByTestId('nav-item-rig');
      expect(rigItem).not.toHaveAttribute('aria-current');
      expect(rigItem).toHaveStyle({
        color: 'var(--ink-muted)',
      });
    });

    it('updates active view and tab state when a tab is clicked', () => {
      const onTabChangeSpy = vi.fn();
      render(<Navigation onTabChange={onTabChangeSpy} />);

      const rigItem = screen.getByTestId('nav-item-rig');
      act(() => {
        fireEvent.click(rigItem);
      });

      expect(onTabChangeSpy).toHaveBeenCalledWith('rig');
      expect(useMapStore.getState().activeTab).toBe('rig');
      expect(useMapStore.getState().activeView).toBe('rig');
    });

    it('highlights controlled activeTab prop across tab bar items', () => {
      const { rerender } = render(<Navigation activeTab="market" />);

      const marketItem = screen.getByTestId('nav-item-market');
      expect(marketItem).toHaveAttribute('aria-current', 'page');
      expect(marketItem).toHaveStyle({
        backgroundColor: 'var(--accent)',
        color: 'var(--on-accent)',
      });

      const mapItem = screen.getByTestId('nav-item-map');
      expect(mapItem).not.toHaveAttribute('aria-current');
      expect(mapItem).toHaveStyle({
        color: 'var(--ink-muted)',
      });

      // Switch to Rig
      rerender(<Navigation activeTab="rig" />);
      const rigItem = screen.getByTestId('nav-item-rig');
      expect(rigItem).toHaveAttribute('aria-current', 'page');
      expect(rigItem).toHaveStyle({
        backgroundColor: 'var(--accent)',
        color: 'var(--on-accent)',
      });
    });
  });
});
