import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoopConsole } from '../CoopConsole';
import { coopService, CoopSessionView } from '../coopService';

const mock3StageSession: CoopSessionView = {
  id: 'heist-session-456',
  status: 'active',
  startedAt: Date.now(),
  timeLimitSeconds: 120,
  bounty: 5000,
  mode: '3-stage',
  alpha: {
    digits: 4,
    attemptsLeft: 4,
    maxAttempts: 4,
    guesses: [],
    eliminatedDigits: [],
  },
  beta: {
    currentStageIndex: 0,
    guesses: [],
    stages: [],
  },
  heist: {
    id: 'heist-session-456',
    currentStage: 1,
    status: 'STAGE_1',
    sharedClockMsRemaining: 120000,
    totalClockMs: 120000,
    bounty: 5000,
    playerRole: 'BRAVO',
    partnerCallsign: 'ALPHA // NIX (AI)',
    partnerAction: 'Scanning perimeter carrier frequencies...',
    isBotPartner: true,
    latestTelemetryEvent: {
      type: 'STAGE1_PARTNER_WAITING',
      stage: 1,
      actorRole: 'ALPHA',
      targetRole: 'BRAVO',
      syncWindowMsRemaining: 8000,
    },
    stage1: {
      alpha: { digits: 3, solved: true, guesses: [{ guess: '123', pans: 3, pots: 0, timestamp: Date.now(), role: 'ALPHA' }] },
      bravo: { digits: 3, solved: false, guesses: [] },
      syncWindowMsRemaining: 8000,
      firstCrackedBy: 'ALPHA',
      resetsCount: 0,
    },
    stage2: {
      digits: 4,
      ice: 'Liar',
      reconChargesRemaining: 3,
      maxReconCharges: 3,
      pingedDigits: {},
      iceFlushedGuessesRemaining: 0,
      guesses: [],
      solved: false,
    },
    stage3: {
      digits: 5,
      attemptsRemaining: 8,
      maxAttempts: 8,
      activeTurn: 'BRAVO',
      overdriveUsed: false,
      overdriveFrozenMsRemaining: 0,
      guesses: [],
      solved: false,
    },
  },
};

describe('3-Stage Asymmetric Cooperative Heist Engine & Nix Guidance', () => {
  let sessionState: CoopSessionView;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionState = JSON.parse(JSON.stringify(mock3StageSession));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Role Selection & Pre-Heist Briefing Card renders with Nix duty descriptions', () => {
    render(<CoopConsole />);

    expect(screen.getByText(/Select Your Heist Operative/i)).toBeInTheDocument();
    expect(screen.getByText(/OPERATIVE ALPHA/i)).toBeInTheDocument();
    expect(screen.getByText(/OPERATIVE BRAVO/i)).toBeInTheDocument();

    // Verify Nix's role briefings are present
    expect(screen.getByText(/You're the eyes and ears, Alpha/i)).toBeInTheDocument();
    expect(screen.getAllByText(/You're on heavy cracking duty, Bravo/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('jack-in-heist-button')).toBeInTheDocument();
  });

  it('shows actual probe codes and count-based clues with a safe leave confirmation', () => {
    const exit = vi.fn();
    render(<CoopConsole initialSession={sessionState} onExit={exit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Partner & clues' }));
    expect(screen.getByRole('button', { name: 'Partner & clues' })).toHaveAttribute('aria-pressed', 'true');
    const history = within(screen.getByRole('region', { name: 'Actual probe results' }));
    expect(history.getByText('123')).toBeInTheDocument();
    expect(history.getByText('3 Pan · 0 Pot')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Leave practice' }));
    expect(exit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep playing' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Leave practice' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Leave practice' }));
    expect(exit).toHaveBeenCalledOnce();
  });

  it('keeps preflight recoverable and discloses an unavailable practice connection', async () => {
    vi.spyOn(coopService, 'startSession').mockRejectedValueOnce(new Error('offline'));
    render(<CoopConsole />);
    await act(async () => fireEvent.click(screen.getByTestId('jack-in-heist-button')));
    expect(screen.getByRole('alert')).toHaveTextContent('practice connection failed');
    expect(screen.getByTestId('jack-in-heist-button')).toBeEnabled();
    expect(screen.getByText(/Human co-op is not available/)).toBeInTheDocument();
  });

  it('2. Partner Telemetry Rail & Stage 1 8-Second Dual-Key Sync Window', () => {
    render(<CoopConsole initialSession={sessionState} />);

    // Partner Telemetry Rail
    expect(screen.getByTestId('partner-telemetry-rail')).toBeInTheDocument();
    expect(screen.getByTestId('partner-telemetry-rail')).toHaveTextContent(/ALPHA \/\/ NIX \(AI\)/);
    expect(screen.getByTestId('player-role-badge')).toHaveTextContent(/OPERATIVE BRAVO/);

    // Sync Window countdown badge
    expect(screen.getByTestId('sync-window-timer')).toBeInTheDocument();
    expect(screen.getByTestId('sync-window-timer')).toHaveTextContent(/SYNC: 8.0s/);

    // Contextual Nix guidance callout
    expect(screen.getByTestId('nix-coop-callout')).toBeInTheDocument();
    expect(screen.getByTestId('nix-coop-callout')).toHaveTextContent(/DUAL-KEY SYNC WINDOW!/i);
    expect(screen.getByTestId('nix-coop-callout')).toHaveTextContent(/8 seconds/i);

    // Stage 1 controls
    expect(screen.getByTestId('stage1-guess-input')).toBeInTheDocument();
    expect(screen.getByTestId('stage1-submit-button')).toBeInTheDocument();
  });

  it('3. Stage 2 Asymmetric Relay: Alpha Carrier Scanner with Recon Charges & Flush ICE', () => {
    const alphaStage2Session: CoopSessionView = JSON.parse(JSON.stringify(sessionState));
    alphaStage2Session.heist!.currentStage = 2;
    alphaStage2Session.heist!.status = 'STAGE_2';
    alphaStage2Session.heist!.playerRole = 'ALPHA';
    alphaStage2Session.heist!.latestTelemetryEvent = {
      type: 'STAGE2_ICE_DETECTED',
      stage: 2,
      targetRole: 'ALPHA',
    };

    render(<CoopConsole initialSession={alphaStage2Session} />);

    // Stage 2 Carrier Scanner
    expect(screen.getByTestId('stage-2-container')).toBeInTheDocument();
    expect(screen.getByText(/CARRIER-WAVE FREQUENCY SCANNER/i)).toBeInTheDocument();
    expect(screen.getByText(/RECON CHARGES: 3 \/ 3/i)).toBeInTheDocument();
    expect(screen.getByTestId('ping-digit-0')).toBeInTheDocument();
    expect(screen.getByTestId('flush-ice-button')).toBeInTheDocument();

    // Nix guidance alerting Alpha to flush ICE
    expect(screen.getByTestId('nix-coop-callout')).toHaveTextContent(/ICE DISTORTION ACTIVE/i);
    expect(screen.getByTestId('nix-coop-callout')).toHaveTextContent(/Hit \[FLUSH ICE\]/i);
  });

  it('4. Stage 2 Asymmetric Relay: Bravo Keypad reflects confirmed present & dead telemetry', () => {
    const bravoStage2Session: CoopSessionView = JSON.parse(JSON.stringify(sessionState));
    bravoStage2Session.heist!.currentStage = 2;
    bravoStage2Session.heist!.status = 'STAGE_2';
    bravoStage2Session.heist!.playerRole = 'BRAVO';
    bravoStage2Session.heist!.stage2.pingedDigits = {
      4: 'CONFIRMED_PRESENT',
      7: 'CONFIRMED_DEAD',
    };
    bravoStage2Session.heist!.latestTelemetryEvent = {
      type: 'STAGE2_DIGIT_PINGED',
      stage: 2,
      targetRole: 'BRAVO',
      digit: 4,
    };

    render(<CoopConsole initialSession={bravoStage2Session} />);

    expect(screen.getByTestId('stage2-guess-input')).toBeInTheDocument();
    expect(screen.getByTestId('stage2-submit-button')).toBeInTheDocument();

    // Key 4 has present indicator
    const key4 = screen.getByTestId('bravo-key-4');
    expect(key4).toHaveTextContent(/● 4/);

    // Key 7 is dead/disabled
    const key7 = screen.getByTestId('bravo-key-7');
    expect(key7).toBeDisabled();

    // Nix prompt for Bravo
    expect(screen.getByTestId('nix-coop-callout')).toHaveTextContent(/Alpha just scanned digit \[4\]/i);
  });

  it('5. Stage 3 Core Vault: 5-digit master lock with 8 attempts & Overdrive module', async () => {
    const stage3Session: CoopSessionView = JSON.parse(JSON.stringify(sessionState));
    stage3Session.heist!.currentStage = 3;
    stage3Session.heist!.status = 'STAGE_3';
    stage3Session.heist!.playerRole = 'BRAVO';
    stage3Session.heist!.stage3.attemptsRemaining = 8;
    stage3Session.heist!.latestTelemetryEvent = {
      type: 'STAGE3_LOW_CLOCK',
      stage: 3,
    };

    vi.spyOn(coopService, 'triggerOverdrive').mockResolvedValueOnce({
      session: {
        ...stage3Session,
        heist: {
          ...stage3Session.heist!,
          sharedClockMsRemaining: 130000,
          stage3: {
            ...stage3Session.heist!.stage3,
            overdriveUsed: true,
          },
        },
      },
      message: 'OVERDRIVE ACTIVE! +10s added.',
      event: {
        type: 'STAGE3_OVERDRIVE_ACTIVATED',
        stage: 3,
        actorRole: 'BRAVO',
      },
    });

    render(<CoopConsole initialSession={stage3Session} />);

    expect(screen.getByTestId('stage-3-container')).toBeInTheDocument();
    expect(screen.getByTestId('stage3-attempts-left')).toHaveTextContent(/8 \/ 8 ATTEMPTS/);
    expect(screen.getByTestId('stage3-guess-input')).toBeInTheDocument();
    expect(screen.getByTestId('overdrive-button')).toBeInTheDocument();

    // Pop Overdrive
    await act(async () => {
      fireEvent.click(screen.getByTestId('overdrive-button'));
    });

    expect(coopService.triggerOverdrive).toHaveBeenCalled();
  });
});
