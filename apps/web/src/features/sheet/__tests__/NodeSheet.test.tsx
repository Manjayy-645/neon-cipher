import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeSheet } from '../NodeSheet';
import { useMapStore } from '../../../stores/map-store';
import { usePlayerStore } from '../../../stores/player-store';
import { useCampaignStore } from '../../../stores/campaign-store';
import { walletService } from '../../market/walletService';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

const renderSheet = async () => {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<NodeSheet />);
  });
  return result!;
};

describe('STYLE S7: Node Bottom Sheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useMapStore.setState({
        selectedNodeId: 'n1',
        unlocks: { bridge: false },
        sheetHeight: 250,
      });
      usePlayerStore.setState({
        equippedTools: [],
        inventory: {},
      });
      useCampaignStore.setState({
        activeChapterId: null,
        tutorialActive: false,
        tutorialStepIndex: 0,
      });
    });
  });

  it('renders nothing when no node is selected', async () => {
    act(() => {
      useMapStore.setState({ selectedNodeId: null });
    });
    const { container } = await renderSheet();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders container with surface.panelLight, 1px line on top, radius 24, and sheet shadow', async () => {
    await renderSheet();
    const sheet = screen.getByTestId('node-sheet');
    expect(sheet).toBeInTheDocument();
    expect(sheet).toHaveClass('bg-panel-light', 'border-t', 'border-line', 'shadow-sheet', 'rounded-t-lg');
    expect(sheet).toHaveStyle({ bottom: '0px', height: '500px' });
  });

  it('renders handle with 44x5px pill centered within a 28px tall touch zone', async () => {
    await renderSheet();
    const handleZone = screen.getByTestId('sheet-handle-zone');
    expect(handleZone).toBeInTheDocument();
    expect(handleZone).toHaveClass('h-[28px]', 'flex', 'items-center', 'justify-center');
    expect(handleZone).toHaveAttribute('role', 'button');
    expect(handleZone).toHaveAttribute('aria-label', 'Toggle node sheet size');

    const handlePill = screen.getByTestId('sheet-handle-pill');
    expect(handlePill).toBeInTheDocument();
    expect(handlePill).toHaveClass('w-[44px]', 'h-[5px]', 'bg-ink-muted/70', 'rounded-pill');
  });

  it('renders Half state (default when node selected) with Row 1, Specs row, Microcopy, and JACK IN', async () => {
    await renderSheet();
    // Row 1: Node name in serif 21px / 23px line-height, 52px plate, tier chip
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveTextContent('Rusty Vending');
    expect(title).toHaveClass('font-heading', 'text-[21px]', 'leading-[23px]');

    const tierChip = screen.getByTestId('status-chip-tier');
    expect(tierChip).toBeInTheDocument();
    expect(tierChip).toHaveTextContent('TIER 1');
    expect(tierChip).toHaveClass('bg-accent', 'text-white', 'font-data', 'text-[11px]', 'rounded-[6px]');

    // Specs row: 4 equal columns with 1px dividers
    const specsRow = screen.getByTestId('specs-row');
    expect(specsRow).toBeInTheDocument();
    expect(specsRow).toHaveAttribute('data-tutorial', 'sheet-specs');
    expect(specsRow).toHaveClass('grid', 'grid-cols-4', 'divide-x', 'divide-line');
    expect(screen.getByText('DIGITS')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('TRIES')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('TIMER')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
    expect(screen.getByText('BOUNTY')).toBeInTheDocument();
    const bounty = screen.getByText('$50');
    expect(bounty).toHaveClass('text-money-text');

    // Microcopy: 12px mono muted
    const microcopy = screen.getByTestId('microcopy');
    expect(microcopy).toBeInTheDocument();
    expect(microcopy).toHaveClass('font-data', 'text-[12px]', 'text-ink-muted');
    expect(microcopy).toHaveTextContent('Signal stable. Lock is local.');

    // JACK IN button: min 48px, accent fill, white text, radius 8, mono 15px 600, letter-spacing 3px
    const jackInBtn = screen.getByTestId('jack-in-button');
    expect(jackInBtn).toBeInTheDocument();
    expect(jackInBtn).toHaveTextContent('JACK IN');
    expect(jackInBtn).toHaveClass('min-h-[48px]', 'bg-accent', 'text-white', 'rounded-[8px]', 'font-data', 'text-[15px]', 'tracking-[3px]');
    expect(jackInBtn).toHaveAttribute('data-tutorial', 'jack-in');
    expect(jackInBtn).not.toBeDisabled();
  });

  it('navigates to terminal when JACK IN is pressed for an available node', async () => {
    await renderSheet();
    const jackInBtn = screen.getByTestId('jack-in-button');
    fireEvent.click(jackInBtn);
    expect(mockPush).toHaveBeenCalledWith('/terminal/n1');
  });

  it('advances the matching campaign tutorial step when JACK IN is pressed', async () => {
    act(() => {
      useCampaignStore.setState({
        activeChapterId: 'chapter-1',
        tutorialActive: true,
        tutorialStepIndex: 1,
      });
    });
    await renderSheet();

    fireEvent.click(screen.getByTestId('jack-in-button'));

    expect(useCampaignStore.getState().tutorialStepIndex).toBe(2);
    expect(mockPush).toHaveBeenCalledWith('/terminal/n1');
  });

  it('advances the chapter 2 tutorial from node inspection into its terminal workflow', async () => {
    act(() => {
      useMapStore.setState({ selectedNodeId: 'n4' });
      useCampaignStore.setState({
        activeChapterId: 'chapter-2',
        tutorialActive: true,
        tutorialStepIndex: 1,
      });
    });
    await renderSheet();

    fireEvent.click(screen.getByTestId('jack-in-button'));

    expect(useCampaignStore.getState().tutorialStepIndex).toBe(2);
    expect(mockPush).toHaveBeenCalledWith('/terminal/n4');
  });

  it('does not advance an unrelated campaign tutorial step when JACK IN is pressed', async () => {
    act(() => {
      useCampaignStore.setState({
        activeChapterId: 'chapter-1',
        tutorialActive: true,
        tutorialStepIndex: 0,
      });
    });
    await renderSheet();

    fireEvent.click(screen.getByTestId('jack-in-button'));

    expect(useCampaignStore.getState().tutorialStepIndex).toBe(0);
  });

  it('renders contested warning in danger.text and CONTESTED chip for contested node', async () => {
    act(() => {
      useMapStore.setState({ selectedNodeId: 'n4' }); // Market Register (contested)
    });
    await renderSheet();

    const chip = screen.getByTestId('status-chip-contested');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('CONTESTED');
    expect(chip).toHaveClass('bg-danger', 'text-white');

    const warning = screen.getByTestId('microcopy-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveClass('text-danger-text', 'font-data', 'text-[12px]');
    expect(warning).toHaveTextContent(/Rival runner active/i);
  });

  it('renders disabled JACK IN button with OWNED label for owned node', async () => {
    act(() => {
      useMapStore.setState({ selectedNodeId: 'n2' }); // Alley Relay (owned)
    });
    await renderSheet();

    const chip = screen.getByTestId('status-chip-owned');
    expect(chip).toHaveTextContent('OWNED');
    expect(chip).toHaveClass('bg-accent', 'text-white');

    const jackInBtn = screen.getByTestId('jack-in-button');
    expect(jackInBtn).toBeDisabled();
    expect(jackInBtn).toHaveTextContent('OWNED');
    expect(jackInBtn).toHaveClass('bg-heat-track', 'text-ink-muted');
  });

  it('renders disabled JACK IN button with countdown for cooldown node', async () => {
    act(() => {
      useMapStore.setState({ selectedNodeId: 'n3' }); // Corner ATM (cooldown)
    });
    await renderSheet();

    const chip = screen.getByTestId('status-chip-cooldown');
    expect(chip).toHaveTextContent('COOLDOWN');
    expect(chip).toHaveClass('bg-status-cooldown', 'text-white');

    const jackInBtn = screen.getByTestId('jack-in-button');
    expect(jackInBtn).toBeDisabled();
    expect(jackInBtn).toHaveTextContent(/COOLDOWN/);
    expect(jackInBtn).toHaveClass('bg-heat-track', 'text-ink-muted');
  });

  it('renders disabled JACK IN button with LOCKED ZONE for locked node', async () => {
    act(() => {
      useMapStore.setState({ selectedNodeId: 'n9', unlocks: { bridge: false } }); // Plaza ATM (requiresUnlock)
    });
    await renderSheet();

    const chip = screen.getByTestId('status-chip-locked');
    expect(chip).toHaveTextContent('LOCKED');
    expect(chip).toHaveClass('bg-ink-muted', 'text-white');

    const jackInBtn = screen.getByTestId('jack-in-button');
    expect(jackInBtn).toBeDisabled();
    expect(jackInBtn).toHaveTextContent('LOCKED ZONE');
    expect(jackInBtn).toHaveClass('bg-heat-track', 'text-ink-muted');
  });

  it('renders Peek state (76px) with 36px plate, serif 17px name, tier chip, bounty, and chevron up', async () => {
    await renderSheet();
    const handleZone = screen.getByTestId('sheet-handle-zone');

    // Cycle from half (1) -> expanded (2) -> peek (0)
    await act(async () => {
      fireEvent.click(handleZone);
    });
    await act(async () => {
      fireEvent.click(handleZone);
    });

    const peek = screen.getByTestId('node-sheet-peek');
    expect(peek).toBeInTheDocument();
    expect(peek).toHaveTextContent('Rusty Vending');
    expect(peek).toHaveTextContent('TIER 1');
    expect(peek).toHaveTextContent('$50');

    const expandBtn = screen.getByTestId('peek-expand-button');
    expect(expandBtn).toBeInTheDocument();
    expect(expandBtn).toHaveAttribute('aria-label', 'Expand sheet');

    // Clicking chevron expands back to Half
    await act(async () => {
      fireEvent.click(expandBtn);
    });
    expect(screen.getByTestId('specs-row')).toBeInTheDocument();
  });

  it('renders Expanded state with trace risk, recent attempts, rival activity separated by 1px dividers', async () => {
    await renderSheet();
    const handleZone = screen.getByTestId('sheet-handle-zone');

    // Cycle from half (1) -> expanded (2)
    await act(async () => {
      fireEvent.click(handleZone);
    });

    const expandedSpecs = screen.getByTestId('expanded-specs');
    expect(expandedSpecs).toBeInTheDocument();
    expect(expandedSpecs).toHaveClass('divide-y', 'divide-line', 'border-y', 'border-line');
    expect(screen.getByText('TRACE RISK')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('RECENT ATTEMPTS')).toBeInTheDocument();
    expect(screen.getByText('3 FAILED')).toBeInTheDocument();
    expect(screen.getByText('RIVAL ACTIVITY')).toBeInTheDocument();
    expect(screen.getByText('NONE DETECTED')).toBeInTheDocument();
  });

  it('supports keyboard navigation with ArrowUp and ArrowDown to change sheet size', async () => {
    await renderSheet();
    const handleZone = screen.getByTestId('sheet-handle-zone');

    // Half -> Expanded using ArrowUp
    await act(async () => {
      fireEvent.keyDown(handleZone, { key: 'ArrowUp' });
    });
    expect(screen.getByTestId('expanded-specs')).toBeInTheDocument();

    // Expanded -> Half using ArrowDown
    await act(async () => {
      fireEvent.keyDown(handleZone, { key: 'ArrowDown' });
    });
    expect(screen.queryByTestId('expanded-specs')).not.toBeInTheDocument();
    expect(screen.getByTestId('specs-row')).toBeInTheDocument();

    // Half -> Peek using ArrowDown
    await act(async () => {
      fireEvent.keyDown(handleZone, { key: 'ArrowDown' });
    });
    expect(screen.getByTestId('node-sheet-peek')).toBeInTheDocument();
  });
});
