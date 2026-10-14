import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuelSession } from '../types';
import { DuelConsole } from '../DuelConsole';
import { SabotageBar } from '../SabotageBar';
import {
  NixDuelOnboardingCard,
  NixTacticalCalloutBanner,
  ParityJammerBanner,
  KeyLatchBanner,
} from '../SabotageOverlay';
import { useDuelStore } from '@/stores/duel-store';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import { duelService } from '../duelService';
import { getNixDuelCallout, NIX_DUEL_BRIEFINGS } from '@neon-cipher/game-rules';

const mockBaseSession: DuelSession = {
  id: 'duel-exp-123',
  matchType: 'wager',
  wager: 500,
  ante: 50,
  totalPot: 1000,
  rake: 100,
  netPot: 900,
  digits: 4,
  sharedAttempts: 12,
  turnClockSeconds: 30,
  overallClockSeconds: 90,
  startedAt: Date.now(),
  status: 'active',
  player: {
    handle: 'ZERO_COOL',
    avatar: 'avatar1',
    guesses: [],
    activeEffects: [],
    shieldActive: false,
    cheatUsed: false,
    stealthChargesRemaining: 1,
  },
  rival: {
    handle: 'Null_Byte',
    avatar: 'avatar2',
    guesses: [],
    activeEffects: [],
    shieldActive: false,
    cheatUsed: false,
    stealthChargesRemaining: 1,
  },
  currentTurn: 'player',
};

describe('Expanded Duel Sabotage Engine & Nix In-Game Feature Guidance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.setState({
      credits: 5000,
      handle: 'ZERO_COOL',
    });
    useSettingsStore.setState({
      seenFeatureGuides: [],
    });
    useDuelStore.setState({
      activeSession: JSON.parse(JSON.stringify(mockBaseSession)),
      isLoading: false,
      error: null,
    });
  });

  describe('1. Interactive Tool Inspector Drawer & Tactical Spec Plate', () => {
    it('renders 44x44px [?] Inspect Mode toggle and toggles inspect state', async () => {
      render(
        <SabotageBar
          duelId="duel-exp-123"
          playerCredits={5000}
          shieldActive={false}
        />
      );

      const inspectToggle = screen.getByTestId('sabotage-inspect-toggle');
      expect(inspectToggle).toBeInTheDocument();
      expect(inspectToggle).toHaveTextContent('[?]');

      // Toggle Inspect Mode ON
      await act(async () => {
        fireEvent.click(inspectToggle);
      });
      expect(inspectToggle).toHaveTextContent('[x]');
    });

    it('clicking a tool in Inspect Mode opens Tactical Spec Plate with Nix intel & counter-play advice', async () => {
      render(
        <SabotageBar
          duelId="duel-exp-123"
          playerCredits={5000}
          shieldActive={false}
        />
      );

      // 1. Toggle Inspect Mode ON
      const inspectToggle = screen.getByTestId('sabotage-inspect-toggle');
      await act(async () => {
        fireEvent.click(inspectToggle);
      });

      // 2. Click Mirror Daemon tool card
      const mirrorTool = screen.getByTestId('sabotage-tool-mirror-daemon');
      await act(async () => {
        fireEvent.click(mirrorTool);
      });

      // 3. Spec Plate dialog should appear
      const specPlate = screen.getByTestId('tactical-spec-plate');
      expect(specPlate).toBeInTheDocument();
      expect(screen.getByText(/Mirror Daemon — 650 CR/i)).toBeInTheDocument();
      expect(screen.getByText(/Bounces half of their own sabotage right back in their face/i)).toBeInTheDocument();
      expect(screen.getByText(/Hold heavy offensive attacks if an opponent shows defensive resonance/i)).toBeInTheDocument();

      // 4. Fire confirmation button is available
      const fireBtn = screen.getByTestId('spec-plate-fire-btn');
      expect(fireBtn).toBeInTheDocument();
      expect(fireBtn).toHaveTextContent(/FIRE TOOL \(650 CR\)/i);
    });

    it('confirming Fire Tool in Spec Plate dispatches sabotage via service', async () => {
      const spy = vi.spyOn(duelService, 'useSabotage').mockResolvedValueOnce({
        success: true,
        shielded: false,
        effectApplied: 'mirror_shield',
        remainingCredits: 4350,
        message: 'Mirror Daemon primed!',
      });

      const onResult = vi.fn();
      render(
        <SabotageBar
          duelId="duel-exp-123"
          playerCredits={5000}
          shieldActive={false}
          onSabotageResult={onResult}
        />
      );

      // Open inspect mode & click Parity Jammer
      await act(async () => {
        fireEvent.click(screen.getByTestId('sabotage-inspect-toggle'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('sabotage-tool-parity-jammer'));
      });

      // Fire tool from spec plate
      const fireBtn = screen.getByTestId('spec-plate-fire-btn');
      await act(async () => {
        fireEvent.click(fireBtn);
      });

      expect(spy).toHaveBeenCalledWith('duel-exp-123', 'parity_jammer');
      expect(screen.queryByTestId('tactical-spec-plate')).not.toBeInTheDocument();
    });
  });

  describe('2. Nix First-Time Feature Briefings & Onboarding Cards', () => {
    it('renders first-time onboarding cards when seenFeatureGuides is empty and dismisses on click', async () => {
      useSettingsStore.setState({ seenFeatureGuides: [] });

      render(<DuelConsole initialSession={mockBaseSession} />);

      // Both cards are visible initially
      const sharedFeedCard = screen.getByTestId('nix-onboarding-guide-shared-feed');
      const sabotageDeckCard = screen.getByTestId('nix-onboarding-guide-sabotage-deck');
      expect(sharedFeedCard).toBeInTheDocument();
      expect(sabotageDeckCard).toBeInTheDocument();
      expect(sharedFeedCard).toHaveTextContent(/both of you are cracking the exact same lock/i);
      expect(sabotageDeckCard).toHaveTextContent(/Tap and hold any tool on your rig bar/i);

      // Dismiss shared feed card
      const dismissBtns = screen.getAllByRole('button', { name: /Dismiss/i });
      await act(async () => {
        fireEvent.click(dismissBtns[0]);
      });

      expect(useSettingsStore.getState().seenFeatureGuides).toContain('guide-shared-feed');
    });

    it('does not render cards if already marked as seen', () => {
      useSettingsStore.setState({
        seenFeatureGuides: ['guide-shared-feed', 'guide-sabotage-deck'],
      });

      render(<DuelConsole initialSession={mockBaseSession} />);
      expect(screen.queryByTestId('nix-onboarding-guide-shared-feed')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nix-onboarding-guide-sabotage-deck')).not.toBeInTheDocument();
    });
  });

  describe('3. Contextual Nix Alert Callouts & Sabotage Feedback', () => {
    it('renders Nix Tactical Callout Banner with plain-language advice for parity jammer', async () => {
      const callout = getNixDuelCallout({ type: 'parity_jammer' });
      const onDismiss = vi.fn();

      render(<NixTacticalCalloutBanner callout={callout} onDismiss={onDismiss} />);

      const banner = screen.getByTestId('nix-tactical-callout');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/PARITY JAMMER/i);
      expect(banner).toHaveTextContent(/'EVEN' means 0, 2, or 4 hits/i);
      expect(banner).toHaveTextContent(/Compare it with your last line/i);

      // Dismiss button
      const dismissBtn = screen.getByRole('button', { name: /Dismiss Nix Callout/i });
      await act(async () => {
        fireEvent.click(dismissBtn);
      });
      expect(onDismiss).toHaveBeenCalled();
    });

    it('renders KeyLatchBanner and disables locked keys on Keypad', () => {
      const sessionWithLatch: DuelSession = {
        ...mockBaseSession,
        player: {
          ...mockBaseSession.player,
          activeEffects: ['key_latch'],
          latchedKeys: ['3', '7'],
        },
      };

      render(<DuelConsole initialSession={sessionWithLatch} />);

      // Banner is rendered
      const latchBanner = screen.getByTestId('key-latch-banner');
      expect(latchBanner).toBeInTheDocument();
      expect(latchBanner).toHaveTextContent(/LOCKED KEYS: \[3, 7\]/i);

      // Keypad buttons for 3 and 7 are mechanically disabled
      const key3 = screen.getByTestId('keypad-3');
      const key7 = screen.getByTestId('keypad-7');
      const key1 = screen.getByTestId('keypad-1');

      expect(key3).toBeDisabled();
      expect(key7).toBeDisabled();
      expect(key1).not.toBeDisabled();
    });

    it('renders ParityJammerBanner and displays [EVEN] clue readout badge', () => {
      const sessionWithParity: DuelSession = {
        ...mockBaseSession,
        player: {
          ...mockBaseSession.player,
          activeEffects: ['parity_jam'],
          guesses: [
            {
              guess: '1256',
              pans: 2,
              pots: 0,
              timestamp: Date.now(),
              parityLabel: 'EVEN',
            },
          ],
        },
      };

      render(<DuelConsole initialSession={sessionWithParity} />);

      // Parity banner is active
      const parityBanner = screen.getByTestId('parity-jammer-banner');
      expect(parityBanner).toBeInTheDocument();
      expect(parityBanner).toHaveTextContent(/PARITY JAMMER ACTIVE/i);

      // Guess row renders [EVEN] badge instead of exact count
      const badge = screen.getByTestId('parity-label-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('[EVEN]');
    });
  });
});
