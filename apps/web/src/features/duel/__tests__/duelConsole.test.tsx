import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuelSession } from '../types';
import { DuelConsole } from '../DuelConsole';
import { MatchmakingLobby } from '../MatchmakingLobby';
import { SabotageBar } from '../SabotageBar';
import { ResolutionModal } from '../ResolutionModal';
import {
  StaticHistoryOverlay,
  ScrambleKeypadBanner,
  ClockDrainAlert,
  ShieldAlert,
} from '../SabotageOverlay';
import { useDuelStore } from '@/stores/duel-store';
import { usePlayerStore } from '@/stores/player-store';
import { duelService } from '../duelService';

const mockBaseSession: DuelSession = {
  id: 'duel-test-123',
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
    avatar: '⚡',
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

describe('TASK 11: Matchmaking Lobby, 1v1 Split Console & Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(duelService, 'getRooms').mockResolvedValue([
      {
        id: 'room-1',
        name: 'The Neon Alley',
        host: 'Cyber_Wolf',
        matchType: 'wager',
        wager: 500,
        ante: 50,
        pingMs: 18,
        status: 'open',
      },
    ]);

    usePlayerStore.setState({
      credits: 2500,
      handle: 'ZERO_COOL',
    });
    useDuelStore.setState({
      rooms: [
        {
          id: 'room-1',
          name: 'The Neon Alley',
          host: 'Cyber_Wolf',
          matchType: 'wager',
          wager: 500,
          ante: 50,
          pingMs: 18,
          status: 'open',
        },
      ],
      activeSession: null,
      selectedMatchType: 'wager',
      wager: 500,
      isLoading: false,
      error: null,
    });
  });

  describe('1. Matchmaking Lobby (4.0)', () => {
    it('renders match type selector, wager slider with ante, and pot minus rake preview', async () => {
      await act(async () => {
        render(<MatchmakingLobby />);
      });

      expect(screen.getByText('MATCHMAKING LOBBY')).toBeInTheDocument();
      expect(screen.getByTestId('match-type-casual')).toBeInTheDocument();
      expect(screen.getByTestId('match-type-wager')).toBeInTheDocument();
      expect(screen.getByTestId('match-type-turf')).toBeInTheDocument();

      // Wager controls and pot preview
      expect(screen.getByText(/WAGER STAKE: 500 CR/)).toBeInTheDocument();
      expect(screen.getByText(/ANTE \(10%\): \+50 CR/)).toBeInTheDocument();
      const potPreview = screen.getByTestId('pot-preview');
      expect(potPreview).toHaveTextContent('GROSS POT (2x Wager)');
      expect(potPreview).toHaveTextContent('SYNDICATE RAKE (10%)');
      expect(potPreview).toHaveTextContent('+900 CR');

      // Room list with ping
      expect(screen.getByText('The Neon Alley')).toBeInTheDocument();
      expect(screen.getByText('18ms')).toBeInTheDocument();
    });

    it('updates pot calculation when switching to casual without wager', async () => {
      await act(async () => {
        render(<MatchmakingLobby />);
      });

      const casualBtn = screen.getByTestId('match-type-casual');
      await act(async () => {
        fireEvent.click(casualBtn);
      });

      // In casual, wager slider is hidden
      expect(screen.queryByLabelText('Wager slider')).not.toBeInTheDocument();
    });

    it('triggers Quick Jack-In against Null_Byte mock AI', async () => {
      const spyStart = vi.spyOn(duelService, 'startDuel').mockResolvedValueOnce({
        ...mockBaseSession,
      });

      await act(async () => {
        render(<MatchmakingLobby />);
      });

      const jackInBtn = screen.getByTestId('quick-jack-in-button');
      await act(async () => {
        fireEvent.click(jackInBtn);
      });

      expect(spyStart).toHaveBeenCalled();
      expect(useDuelStore.getState().activeSession).toBeDefined();
    });
  });

  describe('2. 1v1 Split Console (4.1) & Guess Streams', () => {
    it('renders status bar with opponent handle, shared attempts pool, and turn clock', () => {
      render(<DuelConsole initialSession={mockBaseSession} onExit={vi.fn()} />);

      expect(screen.getByTestId('duel-status-bar')).toBeInTheDocument();
      expect(screen.getByText('Null_Byte')).toBeInTheDocument();
      expect(screen.getByTestId('shared-attempts-pool')).toHaveTextContent('12 LEFT');
      expect(screen.getByTestId('turn-clock')).toHaveTextContent('30s');
    });

    it('switches between You and Rival streams via mobile segmented toggle', () => {
      render(<DuelConsole initialSession={mockBaseSession} onExit={vi.fn()} />);

      const tabYou = screen.getByTestId('tab-you');
      const tabRival = screen.getByTestId('tab-rival');

      expect(tabYou).toBeInTheDocument();
      expect(tabRival).toBeInTheDocument();

      // Click Rival tab
      act(() => {
        fireEvent.click(tabRival);
      });

      const rivalStream = screen.getByTestId('rival-stream');
      expect(rivalStream).toBeInTheDocument();
      expect(rivalStream).toHaveTextContent('5678');
    });

    it('enters digits using keypad and submits guess via ENT button', async () => {
      const updatedSession: DuelSession = {
        ...mockBaseSession,
        sharedAttempts: 10,
        player: {
          ...mockBaseSession.player,
          guesses: [
            ...mockBaseSession.player.guesses,
            { guess: '9087', pots: 2, pans: 1, timestamp: Date.now() },
          ],
        },
        rival: {
          ...mockBaseSession.rival,
          guesses: [
            ...mockBaseSession.rival.guesses,
            { guess: '4321', pots: 1, pans: 0, timestamp: Date.now() },
          ],
        },
      };

      vi.spyOn(duelService, 'submitGuess').mockResolvedValueOnce({
        session: updatedSession,
        playerGuess: { guess: '9087', pots: 2, pans: 1, timestamp: Date.now() },
        rivalGuess: { guess: '4321', pots: 1, pans: 0, timestamp: Date.now() },
      });

      render(<DuelConsole initialSession={mockBaseSession} onExit={vi.fn()} />);

      // Enter digits 9, 0, 8, 7
      act(() => {
        fireEvent.click(screen.getByTestId('keypad-9'));
        fireEvent.click(screen.getByTestId('keypad-0'));
        fireEvent.click(screen.getByTestId('keypad-8'));
        fireEvent.click(screen.getByTestId('keypad-7'));
      });

      expect(screen.getByTestId('input-slot-0')).toHaveTextContent('9');
      expect(screen.getByTestId('input-slot-1')).toHaveTextContent('0');
      expect(screen.getByTestId('input-slot-2')).toHaveTextContent('8');
      expect(screen.getByTestId('input-slot-3')).toHaveTextContent('7');

      // Submit via ENT
      const entBtn = screen.getByTestId('keypad-ent');
      expect(entBtn).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(entBtn);
      });

      expect(duelService.submitGuess).toHaveBeenCalledWith('duel-test-123', '9087', undefined);
      // Verify updated shared attempts
      expect(screen.getByTestId('shared-attempts-pool')).toHaveTextContent('10 LEFT');
    });

    it('strictly forbids exploits in ranked match and displays disabled notice', () => {
      render(<DuelConsole initialSession={mockBaseSession} onExit={vi.fn()} />);

      expect(screen.getByTestId('exploits-disabled-badge')).toBeInTheDocument();
      expect(screen.getByText(/EXPLOITS STRICTLY DISABLED IN RANKED MATCHES/)).toBeInTheDocument();
      expect(screen.queryByTestId('casual-exploit-toggle')).not.toBeInTheDocument();
    });

    it('permits exploit toggle in casual match', () => {
      const casualSession: DuelSession = {
        ...mockBaseSession,
        matchType: 'casual',
        wager: 0,
        ante: 0,
        totalPot: 0,
        netPot: 0,
      };

      render(<DuelConsole initialSession={casualSession} onExit={vi.fn()} />);

      const exploitToggle = screen.getByTestId('casual-exploit-toggle');
      expect(exploitToggle).toBeInTheDocument();

      act(() => {
        fireEvent.click(exploitToggle);
      });

      expect(exploitToggle).toHaveTextContent('CHEAT ARMED');
    });
  });

  describe('3. Sabotage Protocols & Effect Overlays', () => {
    it('renders SabotageBar with 4 tools and verifies credit affordability checks', () => {
      usePlayerStore.setState({ credits: 400 }); // Enough for 300 CR tool, not enough for others

      render(
        <SabotageBar
          duelId="duel-test-123"
          playerCredits={400}
          shieldActive={false}
          onSabotageResult={vi.fn()}
        />
      );

      const staticInjector = screen.getByTestId('sabotage-tool-static-injector');
      const firewall = screen.getByTestId('sabotage-tool-firewall-patch');
      const blackout = screen.getByTestId('sabotage-tool-blackout-ping');
      const accelerator = screen.getByTestId('sabotage-tool-trace-accelerator');

      expect(staticInjector).not.toBeDisabled();
      expect(firewall).toBeDisabled(); // 450 CR > 400 CR
      expect(blackout).toBeDisabled(); // 550 CR > 400 CR
      expect(accelerator).toBeDisabled(); // 800 CR > 400 CR
    });

    it('deploys Static Injector sabotage tool successfully', async () => {
      const spySabotage = vi.spyOn(duelService, 'useSabotage').mockResolvedValueOnce({
        success: true,
        shielded: false,
        effectApplied: 'scramble_keypad',
        remainingCredits: 2200,
        message: 'Static Injector successfully deployed against opponent!',
      });

      const onResult = vi.fn();
      render(
        <SabotageBar
          duelId="duel-test-123"
          playerCredits={2500}
          shieldActive={false}
          onSabotageResult={onResult}
        />
      );

      const staticInjector = screen.getByTestId('sabotage-tool-static-injector');
      await act(async () => {
        fireEvent.click(staticInjector);
      });

      expect(spySabotage).toHaveBeenCalledWith('duel-test-123', 'tool-static-injector');
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({ effectApplied: 'scramble_keypad' })
      );
      expect(screen.getByTestId('sabotage-feedback')).toHaveTextContent(/Static Injector successfully deployed/);
    });

    it('renders ScrambleKeypadBanner when scramble_keypad is active', () => {
      render(<ScrambleKeypadBanner active={true} />);
      expect(screen.getByTestId('scramble-keypad-banner')).toBeInTheDocument();
      expect(screen.getByText(/KEYPAD MATRIX SCRAMBLED/)).toBeInTheDocument();
    });

    it('renders StaticHistoryOverlay with countdown timer when static is active', () => {
      const expiry = Date.now() + 5000;
      render(<StaticHistoryOverlay staticExpiry={expiry} />);

      expect(screen.getByTestId('static-history-overlay')).toBeInTheDocument();
      expect(screen.getByText(/BLACKOUT PING ACTIVE/)).toBeInTheDocument();
      expect(screen.getByTestId('static-timer')).toHaveTextContent(/^[45]s$/);
    });

    it('renders ClockDrainAlert and ShieldAlert indicators correctly', () => {
      const { rerender } = render(<ClockDrainAlert active={true} />);
      expect(screen.getByTestId('clock-drain-alert')).toHaveTextContent('-10s');

      rerender(<ShieldAlert shieldActive={true} />);
      expect(screen.getByTestId('shield-alert-indicator')).toHaveTextContent(/FIREWALL.*ACTIVE/);
    });
  });

  describe('4. Resolution Modal (4.2) & Double or Nothing', () => {
    it('displays Victory screen with net payout and time delta', () => {
      const wonSession: DuelSession = {
        ...mockBaseSession,
        status: 'player_won',
        winner: 'player',
        finishTimeDeltaSeconds: 4.8,
        secret: '9087',
      };

      render(
        <ResolutionModal
          session={wonSession}
          onDoubleOrNothing={vi.fn()}
          onExit={vi.fn()}
        />
      );

      expect(screen.getByText('VICTORY')).toBeInTheDocument();
      expect(screen.getByTestId('time-delta')).toHaveTextContent('+4.8s FASTER THAN NULL_BYTE');
      expect(screen.getByText('9087')).toBeInTheDocument();
      expect(screen.getByTestId('net-payout')).toHaveTextContent('+900 CR');
      expect(screen.getByTestId('double-or-nothing-button')).toBeInTheDocument();
    });

    it('triggers Double or Nothing rematch on victory', async () => {
      const wonSession: DuelSession = {
        ...mockBaseSession,
        status: 'player_won',
        winner: 'player',
        secret: '9087',
      };

      const onDon = vi.fn();
      render(
        <ResolutionModal
          session={wonSession}
          onDoubleOrNothing={onDon}
          onExit={vi.fn()}
        />
      );

      const donBtn = screen.getByTestId('double-or-nothing-button');
      await act(async () => {
        fireEvent.click(donBtn);
      });

      expect(onDon).toHaveBeenCalled();
    });

    it('displays Defeat screen with net loss when rival wins', () => {
      const lostSession: DuelSession = {
        ...mockBaseSession,
        status: 'rival_won',
        winner: 'rival',
        finishTimeDeltaSeconds: 2.1,
        secret: '5678',
      };

      render(
        <ResolutionModal
          session={lostSession}
          onDoubleOrNothing={vi.fn()}
          onExit={vi.fn()}
        />
      );

      expect(screen.getByText('DEFEAT')).toBeInTheDocument();
      expect(screen.getByTestId('time-delta')).toHaveTextContent('-2.1s SLOWER');
      expect(screen.getByTestId('net-loss')).toHaveTextContent('-500 CR');
      expect(screen.queryByTestId('double-or-nothing-button')).not.toBeInTheDocument();
    });
  });

  describe('5. Guess History Visibility & Deduction HUD', () => {
    it('displays persistent last probe banner above keypad with last guess clues', () => {
      render(<DuelConsole initialSession={mockBaseSession} onExit={vi.fn()} />);

      const banner = screen.getByTestId('last-probe-summary');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/LAST PROBE \(#1\):/);
      expect(banner).toHaveTextContent('1 2 3 4');
      expect(banner).toHaveTextContent('1 PAN 1 POT');
    });

    it('shows rival filter banner and switches back to player probes on button click', () => {
      render(<DuelConsole initialSession={mockBaseSession} onExit={vi.fn()} />);

      // Switch to rival tab
      fireEvent.click(screen.getByTestId('tab-rival'));

      const activeBanner = screen.getByTestId('rival-feed-active-banner');
      expect(activeBanner).toBeInTheDocument();
      expect(activeBanner).toHaveTextContent(/FILTER: RIVAL TELEMETRY/);

      // Click "SHOW YOUR PROBES" button
      const switchBtn = screen.getByTestId('switch-to-player-feed-btn');
      fireEvent.click(switchBtn);

      // Now player stream is visible
      expect(screen.getByTestId('player-stream')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('automatically switches from rival tab back to player tab when submitting a new guess', async () => {
      const updatedSession: DuelSession = {
        ...mockBaseSession,
        player: {
          ...mockBaseSession.player,
          guesses: [
            ...mockBaseSession.player.guesses,
            { guess: '9087', pots: 0, pans: 2, timestamp: Date.now() },
          ],
        },
      };

      vi.spyOn(duelService, 'submitGuess').mockResolvedValueOnce({
        session: updatedSession,
        playerGuess: { guess: '9087', pots: 0, pans: 2, timestamp: Date.now() },
      });

      render(<DuelConsole initialSession={mockBaseSession} onExit={vi.fn()} />);

      // User was on rival tab
      fireEvent.click(screen.getByTestId('tab-rival'));
      expect(screen.getByTestId('rival-stream')).toBeInTheDocument();

      // User enters and submits guess
      act(() => {
        fireEvent.click(screen.getByTestId('keypad-9'));
        fireEvent.click(screen.getByTestId('keypad-0'));
        fireEvent.click(screen.getByTestId('keypad-8'));
        fireEvent.click(screen.getByTestId('keypad-7'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('keypad-ent'));
      });

      // View should have auto-switched to player tab so the new guess and history are visible
      expect(screen.getByTestId('player-stream')).toBeInTheDocument();
    });

    it('renders tactical onboarding empty state when no probes exist', () => {
      const emptySession: DuelSession = {
        ...mockBaseSession,
        player: {
          ...mockBaseSession.player,
          guesses: [],
        },
        rival: {
          ...mockBaseSession.rival,
          guesses: [],
        },
      };

      render(<DuelConsole initialSession={emptySession} onExit={vi.fn()} />);

      expect(screen.getByText('NO CIPHER PROBES TRANSMITTED YET')).toBeInTheDocument();
      expect(screen.getByText(/Enter 4 unique digits on the keypad below/)).toBeInTheDocument();
    });
  });
});
