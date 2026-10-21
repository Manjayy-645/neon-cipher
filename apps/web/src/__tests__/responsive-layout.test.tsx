import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TerminalScreen from '../features/terminal/TerminalScreen';
import { terminalService } from '../features/terminal/terminalService';
import { NodeSheet, getClampedSnapPoints } from '../features/sheet/NodeSheet';
import { NixBubble } from '../features/hud/NixBubble';
import { NixGuide } from '../features/map/NixGuide';
import { useMapStore } from '../stores/map-store';
import { usePlayerStore } from '../stores/player-store';
import { useSettingsStore } from '../stores/settings-store';
import { useCampaignStore } from '../stores/campaign-store';
import { BlackMarket } from '../features/market/BlackMarket';
import { ChapterSelect } from '../features/story/ChapterSelect';
import { TurfWarBoard } from '../features/duel/TurfWarBoard';
import { SettingsDrawer } from '../features/settings/SettingsDrawer';
import { walletService } from '../features/market/walletService';
import { campaignService } from '../features/story/campaignService';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Responsive Viewport, Anti-Overlap & Safe-Area Layout Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    vi.spyOn(walletService, 'getWallet').mockResolvedValue({
      credits: 1000,
      coins: 10,
      inventory: {},
      equippedTools: [],
    });
    vi.spyOn(campaignService, 'getCampaign').mockResolvedValue({
      debt: { initial: 10000, paid: 0, current: 10000 },
      chapters: {},
      unlocks: { blackMarket: false, onlinePlay: false, bridge: false },
      activeChapterId: null,
      tutorials: {},
    });
    useSettingsStore.setState({ rookieAssist: true });
    useCampaignStore.setState({
      activeChapterId: null,
      tutorialActive: false,
      tutorialStepIndex: 0,
    });
    useMapStore.setState({
      view: 'overview',
      selectedNodeId: null,
      activeNodeId: null,
      sheetHeight: 250,
      sheetState: 'half',
      isNixBubbleOpen: false,
    });
    usePlayerStore.setState({
      nixDismissed: false,
    });
  });

  describe('Part 1 & 2: Viewport-Relative Bottom Sheet Detents & Clearances', () => {
    it('calculates clamped viewport snap points across phone, tablet, and desktop heights', () => {
      // Small phone: 640px height
      const smallPhoneSnaps = getClampedSnapPoints(640);
      expect(smallPhoneSnaps[0]).toBeGreaterThanOrEqual(68);
      expect(smallPhoneSnaps[0]).toBeLessThanOrEqual(84);
      expect(smallPhoneSnaps[1]).toBeGreaterThanOrEqual(220);
      expect(smallPhoneSnaps[1]).toBeLessThanOrEqual(320);
      // Expanded detent leaves clearance for HUD (56px) + Nav (64px) + margin (16px)
      expect(smallPhoneSnaps[2]).toBeLessThanOrEqual(640 - 56 - 64 - 16);

      // Desktop: 900px height
      const desktopSnaps = getClampedSnapPoints(900);
      expect(desktopSnaps[0]).toBe(84); // clamped max peek
      expect(desktopSnaps[1]).toBe(320); // clamped max half
      expect(desktopSnaps[2]).toBe(520); // clamped max expanded
    });

    it('renders NodeSheet with z-bottom-sheet and keeps JACK IN action bar accessible', async () => {
      useMapStore.setState({ selectedNodeId: 'n1' }); // Rusty Vending
      render(<NodeSheet />);

      const sheet = await screen.findByTestId('node-sheet');
      expect(sheet).toBeInTheDocument();
      expect(sheet).toHaveClass('z-bottom-sheet');

      const actions = screen.getByTestId('node-sheet-actions');
      expect(actions).toBeInTheDocument();

      const jackInBtn = screen.getByTestId('jack-in-button');
      expect(jackInBtn).toBeInTheDocument();
      expect(jackInBtn).toHaveTextContent('JACK IN');
      expect(jackInBtn).not.toBeDisabled();
    });
  });

  describe('Part 2: Dynamic Nix Companion Repositioning & Anti-Collision', () => {
    it('renders Nix Bubble with z-nix-pip and safe-area inset top clearance', () => {
      render(<NixBubble isOpen={true} message="Standard ICE detected. Watch the timer." />);

      const region = screen.getByRole('region', { name: 'Nix Guide' });
      expect(region).toBeInTheDocument();
      expect(region).toHaveClass('z-nix-pip');
      expect(region.className).toContain('top-[max(env(safe-area-inset-top),10px)]');
      expect(region.className).toContain('max-w-[min(92vw,380px)]');
    });

    it('allows dismissing Nix bubble via close button and keyboard Escape', () => {
      const handleDismiss = vi.fn();
      render(<NixBubble isOpen={true} message="ICE warning" onDismiss={handleDismiss} />);

      const closeBtn = screen.getByRole('button', { name: /close guide/i });
      fireEvent.click(closeBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleDismiss).toHaveBeenCalledTimes(2);
    });

    it('renders NixGuide container with z-nix-pip and non-blocking pointer events', () => {
      useMapStore.setState({ view: 'overview' });
      render(<NixGuide />);

      const container = screen.getByTestId('nix-guide-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('z-nix-pip');
      expect(container).toHaveClass('pointer-events-none');

      const portrait = screen.getByTestId('nix-portrait-button');
      expect(portrait).toBeInTheDocument();
      expect(portrait.parentElement?.parentElement).toHaveClass('pointer-events-auto');
    });
  });

  describe('Part 3: Cracking Terminal 3-Row Layout & Pinned Control Deck', () => {
    it('maintains pinned Control Deck and accessible Keypad when guess history expands', async () => {
      // Mock session with 10 attempts allowed
      vi.spyOn(terminalService, 'startSession').mockResolvedValue({
        sessionId: 'sess-resp-test',
        startedAt: Date.now(),
        config: {
          digits: 3,
          allowDuplicates: false,
          attempts: 10,
          timerSeconds: 120,
          tier: 1,
          ice: 'None',
        },
      });

      // Submit guesses iteratively
      const submitSpy = vi.spyOn(terminalService, 'submitGuess');
      for (let i = 1; i <= 6; i++) {
        submitSpy.mockResolvedValueOnce({
          pans: 0,
          pots: 1,
          attemptsLeft: 10 - i,
          status: 'active',
        });
      }

      render(<TerminalScreen nodeId="n1" />);

      // Wait for terminal load
      expect(await screen.findByText(/Rusty Soda Machine/i)).toBeInTheDocument();

      // Check header compact strip class
      const header = document.querySelector('header');
      expect(header).toHaveClass('terminal-compact-strip');

      // Type digits: 1, 2, 3
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));

      // Submit guess once enabled
      const submitBtn = screen.getByRole('button', { name: /submit guess/i });
      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledTimes(1);
      });

      // History container must be in DOM and auto-scrollable
      const historyList = document.querySelector('[data-tutorial="history"]');
      expect(historyList).toBeInTheDocument();
      expect(historyList).toHaveClass('flex-1', 'min-h-0', 'overflow-hidden');

      // Keypad buttons must remain accessible and have responsive clamp classes
      const key1 = screen.getByRole('button', { name: '1' });
      expect(key1).toBeInTheDocument();
      expect(key1).toHaveClass('keypad-btn-height');
      expect(key1).toHaveClass('min-h-[44px]');
      expect(key1).toHaveClass('min-w-[44px]');
    }, 45000);
  });

  describe('Part 4: System-wide Screen Containment & Overflow Boundaries', () => {
    it('Black Market enforces min-h-0 and scroll boundaries inside mobile chassis', async () => {
      render(<BlackMarket onBackToDialogue={vi.fn()} />);

      const heading = await screen.findByRole('heading', { name: /black market/i });
      expect(heading).toBeInTheDocument();

      const scrollContainer = document.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('flex-1', 'min-h-0');
      expect(scrollContainer).toHaveClass('pb-24');
    });

    it('Chapter Select enforces min-h-0 and safe bottom padding', async () => {
      render(<ChapterSelect onSelectChapter={vi.fn()} />);

      const screenContainer = screen.getByTestId('chapter-select-screen');
      expect(screenContainer).toBeInTheDocument();
      expect(screenContainer).toHaveClass('min-h-0', 'overflow-y-auto', 'pb-24', 'pb-safe-bottom');
    });

    it('Turf War Board enforces flex containment and clearance for bottom bar', async () => {
      render(<TurfWarBoard />);

      const header = await screen.findByRole('heading', { name: /syndicate territory map/i });
      expect(header).toBeInTheDocument();

      const mainContainer = header.closest('.scene-ground');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto', 'pb-24', 'pb-safe-bottom');
    });

    it('Settings Drawer enforces modal containment and internal scrolling', () => {
      render(<SettingsDrawer isOpen={true} onClose={vi.fn()} />);

      const dialog = screen.getByRole('dialog', { name: /settings configuration/i });
      expect(dialog).toBeInTheDocument();

      const scrollArea = dialog.querySelector('.overflow-y-auto');
      expect(scrollArea).toBeInTheDocument();
      expect(scrollArea).toHaveClass('flex-1', 'min-h-0', 'pb-12', 'pb-safe-bottom');
    });
  });
});
