import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoopConsole } from '../CoopConsole';
import { coopService, CoopSessionView } from '../coopService';

const mockInitialSession: CoopSessionView = {
  id: 'coop-test-123',
  status: 'active',
  startedAt: Date.now(),
  timeLimitSeconds: 180,
  bounty: 2500,
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
    stages: [
      {
        id: 1,
        name: 'Subroutine 01: Firewall Bypass',
        digits: 3,
        rewardType: 'remove_dead_digit',
        rewardDescription: 'Eliminates 1 dead digit from Alpha keypad',
        completed: false,
      },
      {
        id: 2,
        name: 'Subroutine 02: Buffer Overflow',
        digits: 3,
        rewardType: 'extra_attempt',
        rewardDescription: 'Grants +1 guess attempt to Alpha',
        completed: false,
      },
      {
        id: 3,
        name: 'Subroutine 03: Shroud Override',
        digits: 3,
        rewardType: 'extra_attempt',
        rewardDescription: 'Grants +1 guess attempt to Alpha',
        completed: false,
      },
    ],
  },
};

describe('Task 12: Co-op Heist Console Component', () => {
  let currentSessionState: CoopSessionView;

  beforeEach(() => {
    vi.useFakeTimers();
    currentSessionState = JSON.parse(JSON.stringify(mockInitialSession));

    vi.spyOn(coopService, 'submitGuess').mockImplementation(async ({ role, guess }) => {
      if (role === 'beta' && guess === '381') {
        currentSessionState = {
          ...currentSessionState,
          alpha: {
            ...currentSessionState.alpha,
            eliminatedDigits: ['0'],
          },
          beta: {
            ...currentSessionState.beta,
            currentStageIndex: 1,
            stages: [
              { ...currentSessionState.beta.stages[0], completed: true },
              currentSessionState.beta.stages[1],
              currentSessionState.beta.stages[2],
            ],
          },
        };
        return {
          session: currentSessionState,
          guessRecord: { guess: '381', pots: 3, pans: 0, timestamp: Date.now(), role: 'beta' },
          rewardMessage: '[BETA SUPPORT] Subroutine 01: Firewall Bypass CRACKED! Dead digit 0 eliminated for Alpha.',
        };
      }

      if (role === 'beta' && guess === '519') {
        currentSessionState = {
          ...currentSessionState,
          alpha: {
            ...currentSessionState.alpha,
            attemptsLeft: currentSessionState.alpha.attemptsLeft + 1,
          },
          beta: {
            ...currentSessionState.beta,
            currentStageIndex: 2,
            stages: [
              currentSessionState.beta.stages[0],
              { ...currentSessionState.beta.stages[1], completed: true },
              currentSessionState.beta.stages[2],
            ],
          },
        };
        return {
          session: currentSessionState,
          guessRecord: { guess: '519', pots: 3, pans: 0, timestamp: Date.now(), role: 'beta' },
          rewardMessage: '[BETA SUPPORT] Subroutine 02: Buffer Overflow CRACKED! +1 Attempt granted to Alpha.',
        };
      }

      if (role === 'alpha' && guess === '7294') {
        currentSessionState = {
          ...currentSessionState,
          status: 'won',
          alpha: {
            ...currentSessionState.alpha,
            secret: '7294',
          },
        };
        return {
          session: currentSessionState,
          guessRecord: { guess: '7294', pots: 4, pans: 0, timestamp: Date.now(), role: 'alpha' },
          rewardMessage: 'VAULT CRACKED! Master signal unlocked by Alpha Infiltrator.',
        };
      }

      return {
        session: currentSessionState,
        guessRecord: { guess, pots: 0, pans: 0, timestamp: Date.now(), role },
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders shared countdown timer and both Alpha and Beta consoles in split view', () => {
    render(<CoopConsole initialSession={mockInitialSession} />);

    expect(screen.getByTestId('shared-countdown')).toBeInTheDocument();
    expect(screen.getByTestId('shared-countdown')).toHaveTextContent(/CREW TIME: 03:00/);

    expect(screen.getByTestId('role-alpha-container')).toBeInTheDocument();
    expect(screen.getByTestId('role-beta-container')).toBeInTheDocument();
    expect(screen.getByTestId('coop-comms-feed')).toBeInTheDocument();
  });

  it('switches between split, alpha, and beta role views', () => {
    render(<CoopConsole initialSession={mockInitialSession} />);

    const alphaBtn = screen.getByTestId('view-alpha-button');
    act(() => {
      fireEvent.click(alphaBtn);
    });
    expect(screen.getByTestId('role-alpha-container')).toBeInTheDocument();
    expect(screen.queryByTestId('role-beta-container')).not.toBeInTheDocument();

    const betaBtn = screen.getByTestId('view-beta-button');
    act(() => {
      fireEvent.click(betaBtn);
    });
    expect(screen.queryByTestId('role-alpha-container')).not.toBeInTheDocument();
    expect(screen.getByTestId('role-beta-container')).toBeInTheDocument();
  });

  it('cracking a Beta stage grants Alpha an eliminated dead digit or extra attempt', async () => {
    render(<CoopConsole initialSession={mockInitialSession} />);

    // Stage 1 secret is '381', reward is remove dead digit
    const betaInput = screen.getByTestId('beta-guess-input');
    const betaSubmit = screen.getByTestId('beta-submit-button');

    await act(async () => {
      fireEvent.change(betaInput, { target: { value: '381' } });
      fireEvent.click(betaSubmit);
    });

    // Verify support buff eliminated dead digit banner appears for Alpha
    expect(screen.getByTestId('eliminated-digits-banner')).toBeInTheDocument();
    expect(screen.getByTestId('eliminated-digits-banner')).toHaveTextContent(/SUPPORT BUFF/);
  });

  it('cracking Stage 2 grants Alpha an extra attempt', async () => {
    render(<CoopConsole initialSession={mockInitialSession} />);

    // Crack stage 1 first
    await act(async () => {
      fireEvent.change(screen.getByTestId('beta-guess-input'), { target: { value: '381' } });
      fireEvent.click(screen.getByTestId('beta-submit-button'));
    });

    // Crack stage 2 ('519')
    await act(async () => {
      fireEvent.change(screen.getByTestId('beta-guess-input'), { target: { value: '519' } });
      fireEvent.click(screen.getByTestId('beta-submit-button'));
    });

    expect(screen.getByTestId('alpha-attempts-left')).toHaveTextContent('5 ATTEMPTS LEFT');
  });

  it('Alpha cracking the master code wins the heist', async () => {
    render(<CoopConsole initialSession={mockInitialSession} />);

    // Alpha master code is 7294
    const alphaInput = screen.getByTestId('alpha-guess-input');
    const alphaSubmit = screen.getByTestId('alpha-submit-button');

    await act(async () => {
      fireEvent.change(alphaInput, { target: { value: '7294' } });
      fireEvent.click(alphaSubmit);
    });

    expect(screen.getByTestId('heist-won-banner')).toBeInTheDocument();
    expect(screen.getByTestId('heist-won-banner')).toHaveTextContent(/VAULT BREACH SUCCESSFUL/);
  });
});
