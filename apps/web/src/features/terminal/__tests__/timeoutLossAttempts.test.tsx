import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TerminalScreen from '../TerminalScreen';
import { FailureScreen } from '../TerminalScreens';
import { terminalService } from '../terminalService';
import { useSettingsStore } from '@/stores/settings-store';
import { useCampaignStore } from '@/stores/campaign-store';

describe('Timeout Loss Attempts & Failure Reason Accuracy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSettingsStore.setState({ rookieAssist: false });
    useCampaignStore.setState({
      activeChapterId: null,
      tutorialActive: false,
      tutorialStepIndex: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves exact attemptsUsed count (3 of 8 used) and labels reason as TRACE TIMEOUT when timer expires on Market Register', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const startTime = 1000000;
    vi.setSystemTime(startTime);

    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-market-reg',
      startedAt: startTime,
      config: {
        nodeName: 'Market Register',
        digits: 4,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 120,
        tier: 1,
        ice: 'None',
      },
    });

    const submitSpy = vi.spyOn(terminalService, 'submitGuess')
      // Guess 1
      .mockResolvedValueOnce({
        pans: 1,
        pots: 0,
        attemptsLeft: 7,
        status: 'active',
      })
      // Guess 2
      .mockResolvedValueOnce({
        pans: 0,
        pots: 2,
        attemptsLeft: 6,
        status: 'active',
      })
      // Guess 3
      .mockResolvedValueOnce({
        pans: 1,
        pots: 1,
        attemptsLeft: 5,
        status: 'active',
      })
      // Timeout submission
      .mockResolvedValueOnce({
        status: 'lost',
        secret: '9876',
        fine: 37,
        error: 'Time expired',
      });

    render(<TerminalScreen nodeId="n4" />);
    await waitFor(() => {
      expect(screen.getByText(/Market Register/i)).toBeInTheDocument();
    });

    // Helper to enter 4 digits and click Submit
    const enterAndSubmit = (digits: string[]) => {
      digits.forEach((d) => {
        fireEvent.click(screen.getByRole('button', { name: d }));
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));
    };

    // Guess 1: 1 2 3 4
    enterAndSubmit(['1', '2', '3', '4']);
    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1);
    });

    // Guess 2: 5 6 7 8
    enterAndSubmit(['5', '6', '7', '8']);
    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(2);
    });

    // Guess 3: 0 1 2 5
    enterAndSubmit(['0', '1', '2', '5']);
    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(3);
    });

    // Check playing state attempts before timeout: 3 guesses made, next is 4th
    expect(screen.getByLabelText(/Attempts: 3 of 8 used/i)).toBeInTheDocument();
    expect(screen.getByText('4/8')).toBeInTheDocument();

    // Now let the 120s timer expire (advance time by 125 seconds)
    await act(async () => {
      vi.advanceTimersByTime(125 * 1000);
    });
    vi.useRealTimers();

    // Severed / Failure Modal must appear
    await waitFor(() => {
      expect(screen.getByText('CONNECTION SEVERED')).toBeInTheDocument();
    });

    // 1. Verify terminal header preserves exact 3 of 8 used count (NOT 8 of 8 used)
    expect(screen.getByLabelText(/Attempts: 3 of 8 used/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Attempts: 8 of 8 used/i)).not.toBeInTheDocument();

    // 2. Verify Progress Strip shows 3/8 (NOT 8/8)
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(screen.queryByText('8/8')).not.toBeInTheDocument();

    // 3. Verify Failure Modal explicitly labels failure reason as "TRACE TIMEOUT"
    expect(screen.getByText('TRACE TIMEOUT')).toBeInTheDocument();
    expect(screen.queryByText('ATTEMPTS EXHAUSTED')).not.toBeInTheDocument();

    // 4. Verify Failure Modal displays exact attempts used (3 of 8 used)
    const failureAttemptsEl = screen.getByTestId('failure-attempts');
    expect(failureAttemptsEl).toHaveTextContent(/3 of 8 used/i);
  });

  it('explicitly labels failure reason as ATTEMPTS EXHAUSTED and shows full attempts used when guesses run out', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-exhaust',
      startedAt: Date.now(),
      config: {
        nodeName: 'Test Node',
        digits: 3,
        allowDuplicates: false,
        attempts: 2,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });

    vi.spyOn(terminalService, 'submitGuess')
      // Guess 1
      .mockResolvedValueOnce({
        pans: 0,
        pots: 0,
        attemptsLeft: 1,
        status: 'active',
      })
      // Guess 2 (exhausted)
      .mockResolvedValueOnce({
        pans: 0,
        pots: 1,
        attemptsLeft: 0,
        status: 'lost',
        secret: '789',
        fine: 20,
      });

    render(<TerminalScreen nodeId="n1" />);
    await waitFor(() => {
      expect(screen.getByText(/Test Node/i)).toBeInTheDocument();
    });

    const enterAndSubmit = (digits: string[]) => {
      digits.forEach((d) => {
        fireEvent.click(screen.getByRole('button', { name: d }));
      });
      fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));
    };

    // Guess 1: 1 2 3
    enterAndSubmit(['1', '2', '3']);
    await waitFor(() => {
      expect(screen.getByText('2/2')).toBeInTheDocument();
    });

    // Guess 2: 4 5 6 (final attempt exhausted)
    enterAndSubmit(['4', '5', '6']);

    await waitFor(() => {
      expect(screen.getByText('CONNECTION SEVERED')).toBeInTheDocument();
    });

    // Header & progress strip show 2 of 2 used
    expect(screen.getByLabelText(/Attempts: 2 of 2 used/i)).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();

    // Failure modal explicitly labels ATTEMPTS EXHAUSTED
    expect(screen.getByText('ATTEMPTS EXHAUSTED')).toBeInTheDocument();
    expect(screen.queryByText('TRACE TIMEOUT')).not.toBeInTheDocument();

    // Failure modal displays 2 of 2 used
    const failureAttemptsEl = screen.getByTestId('failure-attempts');
    expect(failureAttemptsEl).toHaveTextContent(/2 of 2 used/i);
  });

  it('preserves 0 of 8 used when timer expires before any guesses are made', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const startTime = 3000000;
    vi.setSystemTime(startTime);

    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-zero-guess',
      startedAt: startTime,
      config: {
        nodeName: 'Market Register',
        digits: 4,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 120,
        tier: 1,
        ice: 'None',
      },
    });

    vi.spyOn(terminalService, 'submitGuess').mockResolvedValueOnce({
      status: 'lost',
      secret: '9876',
      fine: 37,
      error: 'Time expired',
    });

    render(<TerminalScreen nodeId="n4" />);
    await waitFor(() => {
      expect(screen.getByText(/Market Register/i)).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(125 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('CONNECTION SEVERED')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Attempts: 0 of 8 used/i)).toBeInTheDocument();
    expect(screen.getByText('0/8')).toBeInTheDocument();
    expect(screen.getByText('TRACE TIMEOUT')).toBeInTheDocument();
    expect(screen.getByTestId('failure-attempts')).toHaveTextContent(/0 of 8 used/i);
  });

  describe('FailureScreen (standalone component)', () => {
    it('defaults to TRACE TIMEOUT when guesses are less than maxAttempts', () => {
      render(
        <FailureScreen
          nodeId="n4"
          guesses={[{ guess: '1234', pots: 1, pans: 0 }]}
          maxAttempts={8}
          timeTaken={120}
          onReturnToMap={vi.fn()}
        />
      );

      expect(screen.getByText('TRACE TIMEOUT')).toBeInTheDocument();
      expect(screen.getByText('1 of 8 used')).toBeInTheDocument();
    });

    it('defaults to ATTEMPTS EXHAUSTED when guesses meet or exceed maxAttempts', () => {
      render(
        <FailureScreen
          nodeId="n4"
          guesses={[
            { guess: '1234', pots: 1, pans: 0 },
            { guess: '5678', pots: 0, pans: 0 },
          ]}
          maxAttempts={2}
          timeTaken={40}
          onReturnToMap={vi.fn()}
        />
      );

      expect(screen.getByText('ATTEMPTS EXHAUSTED')).toBeInTheDocument();
      expect(screen.getByText('2 of 2 used')).toBeInTheDocument();
    });
  });
});
