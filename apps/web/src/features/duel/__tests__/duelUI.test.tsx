import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchmakingLobby } from '../MatchmakingLobby';
import { DuelConsole } from '../DuelConsole';
import { SabotageBar } from '../SabotageBar';
import { DuelResolutionModal } from '../DuelResolutionModal';
import { useDuelStore } from '@/stores/duel-store';
import { usePlayerStore } from '@/stores/player-store';
import { DuelSession } from '../types';

describe('Task 11: Duel UI Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    usePlayerStore.setState({
      credits: 10000,
      coins: 50,
      handle: 'TEST_DECKER',
    });
  });

  describe('MatchmakingLobby Component (4.0)', () => {
    it('renders match type selector tabs and switches between them', async () => {
      // Mock fetch rooms
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/mock/duel/rooms')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              rooms: [
                {
                  id: 'room-1',
                  name: 'Neon Grid 01',
                  host: 'Null_Byte',
                  matchType: 'casual',
                  wager: 0,
                  ante: 0,
                  pingMs: 22,
                  status: 'open',
                },
              ],
            }),
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      render(<MatchmakingLobby />);

      expect(screen.getByText('MATCHMAKING LOBBY')).toBeDefined();
      expect(screen.getByTestId('match-type-casual')).toBeDefined();
      expect(screen.getByTestId('match-type-wager')).toBeDefined();
      expect(screen.getByTestId('match-type-turf')).toBeDefined();

      // Switch to wager
      fireEvent.click(screen.getByTestId('match-type-wager'));
      expect(useDuelStore.getState().selectedMatchType).toBe('wager');

      // Pot preview should now be visible
      expect(screen.getByTestId('pot-preview')).toBeDefined();
    });

    it('calculates gross pot, syndicate rake, and net payout before joining', async () => {
      useDuelStore.setState({ selectedMatchType: 'wager', wager: 500 });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, rooms: [] }),
      });

      render(<MatchmakingLobby />);

      const potPreview = screen.getByTestId('pot-preview');
      expect(potPreview).toBeDefined();
      // Gross pot = 500 * 2 = 1,000 CR
      expect(potPreview.textContent).toContain('1,000 CR');
      // Syndicate rake = 100 CR
      expect(potPreview.textContent).toContain('-100 CR');
      // Net payout = 900 CR
      expect(potPreview.textContent).toContain('+900 CR');
    });

    it('renders room list with ping telemetry indicators', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          rooms: [
            {
              id: 'room-test-42',
              name: 'Sub-Grid Circuit',
              host: 'GHOST_DEV',
              matchType: 'casual',
              wager: 0,
              ante: 0,
              pingMs: 18,
              status: 'open',
            },
          ],
        }),
      });

      render(<MatchmakingLobby />);

      await waitFor(() => {
        expect(screen.getByTestId('room-item-room-test-42')).toBeDefined();
      });

      expect(screen.getByText('Sub-Grid Circuit')).toBeDefined();
      expect(screen.getByText('18ms')).toBeDefined();
      expect(screen.getByTestId('join-room-room-test-42')).toBeDefined();
    });
  });

  describe('DuelConsole Component (4.1)', () => {
    const mockActiveSession: DuelSession = {
      id: 'duel-101',
      matchType: 'casual',
      wager: 0,
      ante: 0,
      totalPot: 0,
      rake: 0,
      netPot: 0,
      digits: 4,
      sharedAttempts: 10,
      turnClockSeconds: 30,
      overallClockSeconds: 90,
      startedAt: Date.now(),
      status: 'active',
      player: {
        handle: 'TEST_DECKER',
        avatar: '/icons/glyph-camera.svg',
        guesses: [
          { guess: '1234', pots: 1, pans: 1, timestamp: Date.now() - 5000 },
        ],
        activeEffects: [],
        shieldActive: false,
        cheatUsed: false,
      },
      rival: {
        handle: 'Null_Byte',
        avatar: '🤖',
        guesses: [
          { guess: '5678', pots: 0, pans: 2, timestamp: Date.now() - 4000 },
        ],
        activeEffects: [],
        shieldActive: false,
        cheatUsed: false,
      },
      currentTurn: 'player',
    };

    it('renders duel console with terminal styling, rival handle, and shared attempts', () => {
      useDuelStore.setState({ activeSession: mockActiveSession });

      render(<DuelConsole />);

      const consoleEl = screen.getByTestId('duel-console');
      expect(consoleEl.getAttribute('data-surface')).toBe('terminal');
      expect(screen.getByText('Null_Byte')).toBeDefined();

      const sharedAttempts = screen.getByTestId('shared-attempts-pool');
      expect(sharedAttempts.textContent).toContain('10 LEFT');
    });

    it('supports mobile segmented toggle switching between You and Rival feeds', () => {
      useDuelStore.setState({ activeSession: mockActiveSession, activeMobileTab: 'player' });

      render(<DuelConsole />);

      // Player stream is visible
      expect(screen.getByTestId('player-stream')).toBeDefined();
      expect(screen.getByText('1234')).toBeDefined();

      // Toggle to rival
      fireEvent.click(screen.getByTestId('tab-rival'));
      expect(screen.getByTestId('rival-stream')).toBeDefined();
      expect(screen.getByText('5678')).toBeDefined();
    });

    it('scrambles keypad digits when scramble_keypad effect is active', () => {
      const scrambledSession: DuelSession = {
        ...mockActiveSession,
        player: {
          ...mockActiveSession.player,
          activeEffects: ['scramble_keypad'],
        },
      };

      useDuelStore.setState({ activeSession: scrambledSession });

      render(<DuelConsole initialSession={scrambledSession} />);

      // Alert banner shown
      expect(screen.getByTestId('scramble-keypad-banner')).toBeDefined();
      expect(screen.getByText(/KEYPAD.*SCRAMBLED/i)).toBeDefined();

      // The first button in keypad should be scrambled ('7' instead of normal '1')
      const keys = screen.getAllByRole('button', { name: /^[0-9]$/ });
      expect(keys[0].textContent).toBe('7');
    });

    it('renders 6-second static history overlay when static_history is active', () => {
      const staticSession: DuelSession = {
        ...mockActiveSession,
        player: {
          ...mockActiveSession.player,
          activeEffects: ['static_history'],
          staticExpiry: Date.now() + 6000,
        },
      };

      useDuelStore.setState({ activeSession: staticSession });

      render(<DuelConsole initialSession={staticSession} />);

      const staticOverlay = screen.getByTestId('static-history-overlay');
      expect(staticOverlay).toBeDefined();
      expect(staticOverlay.textContent).toContain('STATIC BLACKOUT');
    });

    it('renders shield indicator when firewall_shield is active', () => {
      const shieldedSession: DuelSession = {
        ...mockActiveSession,
        player: {
          ...mockActiveSession.player,
          shieldActive: true,
        },
      };

      useDuelStore.setState({ activeSession: shieldedSession });

      render(<DuelConsole initialSession={shieldedSession} />);

      expect(screen.getByTestId('shield-alert-indicator')).toBeDefined();
      expect(screen.getByText(/FIREWALL SHIELD ACTIVE/)).toBeDefined();
    });
  });

  describe('SabotageBar Component (4.1)', () => {
    it('renders 4 sabotage tools with prices and enforces credit checks', () => {
      useDuelStore.setState({
        activeSession: {
          id: 'duel-101',
          matchType: 'casual',
          wager: 0,
          ante: 0,
          totalPot: 0,
          rake: 0,
          netPot: 0,
          digits: 4,
          sharedAttempts: 10,
          turnClockSeconds: 30,
          overallClockSeconds: 90,
          startedAt: Date.now(),
          status: 'active',
          player: {
            handle: 'TEST',
            avatar: '',
            guesses: [],
            activeEffects: [],
            shieldActive: false,
            cheatUsed: false,
          },
          rival: {
            handle: 'Null_Byte',
            avatar: '',
            guesses: [],
            activeEffects: [],
            shieldActive: false,
            cheatUsed: false,
          },
          currentTurn: 'player',
        },
      });

      // Player has 500 credits: can afford Static Injector (300) and Firewall Patch (450), but NOT Blackout (550) or Trace (800)
      usePlayerStore.setState({ credits: 500 });

      render(<SabotageBar />);

      const staticBtn = screen.getByTestId('sabotage-tool-static-injector') as HTMLButtonElement;
      const firewallBtn = screen.getByTestId('sabotage-tool-firewall-patch') as HTMLButtonElement;
      const blackoutBtn = screen.getByTestId('sabotage-tool-blackout-ping') as HTMLButtonElement;
      const traceBtn = screen.getByTestId('sabotage-tool-trace-accelerator') as HTMLButtonElement;

      expect(staticBtn.disabled).toBe(false);
      expect(firewallBtn.disabled).toBe(false);
      expect(blackoutBtn.disabled).toBe(true);
      expect(traceBtn.disabled).toBe(true);
      expect(blackoutBtn.textContent).toContain('NEED +50 CR');
    });
  });

  describe('DuelResolutionModal Component (4.2)', () => {
    it('renders victory breakdown, net pot, double or nothing button, and exit button', () => {
      useDuelStore.setState({
        activeSession: {
          id: 'duel-101',
          matchType: 'wager',
          wager: 500,
          ante: 50,
          totalPot: 1000,
          rake: 100,
          netPot: 900,
          digits: 4,
          sharedAttempts: 8,
          turnClockSeconds: 20,
          overallClockSeconds: 65,
          startedAt: Date.now() - 32000,
          finishTimeDeltaSeconds: 32,
          status: 'player_won',
          winner: 'player',
          player: {
            handle: 'TEST_WINNER',
            avatar: '',
            guesses: [],
            activeEffects: [],
            shieldActive: false,
            cheatUsed: false,
          },
          rival: {
            handle: 'Null_Byte',
            avatar: '',
            guesses: [],
            activeEffects: [],
            shieldActive: false,
            cheatUsed: false,
          },
          currentTurn: 'player',
        },
      });

      render(<DuelResolutionModal />);

      expect(screen.getByText('BREACH VICTORY')).toBeDefined();
      expect(screen.getByText('32s')).toBeDefined();
      expect(screen.getByText('+900 CR')).toBeDefined();
      expect(screen.getByTestId('double-or-nothing-button')).toBeDefined();
      expect(screen.getByTestId('exit-duel-button')).toBeDefined();
    });

    it('displays cheat used notice in casual mode when exploit flag was recorded', () => {
      useDuelStore.setState({
        activeSession: {
          id: 'duel-102',
          matchType: 'casual',
          wager: 0,
          ante: 0,
          totalPot: 0,
          rake: 0,
          netPot: 0,
          digits: 4,
          sharedAttempts: 6,
          turnClockSeconds: 15,
          overallClockSeconds: 45,
          startedAt: Date.now() - 25000,
          finishTimeDeltaSeconds: 25,
          status: 'player_won',
          winner: 'player',
          player: {
            handle: 'TEST_EXPLOITER',
            avatar: '',
            guesses: [],
            activeEffects: [],
            shieldActive: false,
            cheatUsed: true,
          },
          rival: {
            handle: 'Null_Byte',
            avatar: '',
            guesses: [],
            activeEffects: [],
            shieldActive: false,
            cheatUsed: false,
          },
          currentTurn: 'player',
        },
      });

      render(<DuelResolutionModal />);

      expect(screen.getByText(/EXPLOIT USED IN CASUAL SESSION/)).toBeDefined();
    });
  });
});
