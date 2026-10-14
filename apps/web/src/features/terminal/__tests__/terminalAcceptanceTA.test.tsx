import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TerminalScreen from '../TerminalScreen';
import { terminalService } from '../terminalService';
import { useSettingsStore } from '@/stores/settings-store';
import { useCampaignStore } from '@/stores/campaign-store';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('TASK T-A Acceptance: Solo cracking terminal & correctness display', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
    useSettingsStore.setState({ rookieAssist: true });
    useCampaignStore.setState({
      activeChapterId: null,
      tutorialActive: false,
      tutorialStepIndex: 0,
    });
  });

  it('plays a full Tier 1 game (3 unique digits) with marks, summary text, and breach banner', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-t1',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });

    const submitSpy = vi.spyOn(terminalService, 'submitGuess')
      // First guess: 123 -> 1 pan, 1 pot, 1 miss
      .mockResolvedValueOnce({
        pans: 1,
        pots: 1,
        attemptsLeft: 7,
        status: 'active',
      })
      // Second guess: 142 -> 3 pans (win)
      .mockResolvedValueOnce({
        pans: 3,
        pots: 0,
        attemptsLeft: 6,
        status: 'won',
        secret: '142',
        payout: 120,
      });

    render(<TerminalScreen nodeId="n-street" />);

    // Renders active terminal
    expect(await screen.findByText(/Node: n-street/i)).toBeInTheDocument();
    expect(screen.getByText(/TIER 1 • UNIQUE/i)).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();

    // Keypad has 56px keys
    const btnKey = screen.getByRole('button', { name: '1' });
    expect(btnKey).toHaveClass('h-[56px]');
    expect(screen.getByLabelText('Terminal Keypad')).toHaveAttribute(
      'data-tutorial',
      'keypad'
    );
    expect(document.querySelector('[data-tutorial="history"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Guess/i })).toHaveAttribute(
      'data-tutorial',
      'submit'
    );

    // Type 1, 2, 3
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    // Submit button should be enabled
    const submitBtn = screen.getByRole('button', { name: /Submit Guess/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Verify first guess result
    await waitFor(() => {
      expect(screen.getAllByText('1 PAN 1 POT').length).toBeGreaterThan(0);
    });
    expect(screen.getByLabelText(/Guess 1: 1 2 3\. 1 pan, 1 pot, 1 miss\./i)).toBeInTheDocument();
    expect(screen.getByText('2/8')).toBeInTheDocument();

    // Type winning guess: 1, 4, 2
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    // Win banner appears
    await waitFor(() => {
      expect(screen.getByText('BREACHED')).toBeInTheDocument();
      expect(screen.getByText('RETURN TO MAP')).toBeInTheDocument();
    });
    expect(screen.getByTestId('breach-banner')).toHaveAttribute(
      'data-surface',
      'terminal'
    );
  });

  it('offers Nix recovery practice after a campaign target is lost', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-campaign-loss',
      startedAt: Date.now(),
      config: {
        digits: 4,
        allowDuplicates: false,
        attempts: 7,
        timerSeconds: 60,
        tier: 2,
        ice: 'None',
      },
    });
    vi.spyOn(terminalService, 'submitGuess').mockResolvedValueOnce({
      pots: 0,
      pans: 0,
      attemptsLeft: 0,
      status: 'lost',
      secret: '9876',
      fine: 0,
    });
    useCampaignStore.setState({
      activeChapterId: 'chapter-2',
      tutorialActive: true,
      tutorialStepIndex: 0,
    });

    render(<TerminalScreen nodeId="n4" />);
    await screen.findByText(/Node: n4/i);

    for (const digit of ['0', '1', '2', '3']) {
      fireEvent.click(screen.getByRole('button', { name: digit }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    const recoveryButton = await screen.findByRole('button', {
      name: /START NIX'S RECOVERY RUN/i,
    });
    expect(screen.getByText(/No clock and no fine/i)).toBeInTheDocument();
    expect(screen.getByTestId('breach-banner').querySelector('[data-tour="breach-banner"]'))
      .toHaveClass('terminal-result-card');
    expect(useCampaignStore.getState().tutorialActive).toBe(false);
    expect(recoveryButton).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'RETURN TO MAP' }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/map');
    });
  });

  it('returns to the active campaign target after the recovery run is breached', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-nix-recovery',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 999,
        timerSeconds: 0,
        tier: 1,
        ice: 'None',
      },
    });
    vi.spyOn(terminalService, 'submitGuess').mockResolvedValueOnce({
      pots: 0,
      pans: 3,
      attemptsLeft: 998,
      status: 'won',
      secret: '123',
      payout: 0,
    });
    useCampaignStore.setState({
      activeChapterId: 'chapter-2',
      tutorialActive: true,
      tutorialStepIndex: 0,
    });

    render(<TerminalScreen nodeId="nix-recovery" />);
    await screen.findByText(/Nix's Recovery Run/i);

    for (const digit of ['1', '2', '3']) {
      fireEvent.click(screen.getByRole('button', { name: digit }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    const returnButton = await screen.findByRole('button', {
      name: /RETURN TO CAMPAIGN/i,
    });
    expect(screen.getByText(/Your assignment is waiting/i)).toBeInTheDocument();
    fireEvent.click(returnButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/terminal/n4');
    });
    expect(useCampaignStore.getState().activeChapterId).toBe('chapter-2');
  });

  it('highlights the rendered keypad and advances after the guided digits are entered', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-tutorial',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });
    useCampaignStore.setState({
      activeChapterId: 'chapter-1',
      tutorialActive: true,
      tutorialStepIndex: 2,
    });

    render(<TerminalScreen nodeId="n1" />);

    expect(await screen.findByText(/Node: n1/i)).toBeInTheDocument();
    expect(await screen.findByTestId('tutorial-target-highlight')).toHaveAttribute(
      'aria-label',
      'Nix target: KEYPAD PROBE'
    );
    expect(screen.getByLabelText('Terminal Keypad')).toHaveAttribute(
      'data-tutorial',
      'keypad'
    );

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    await waitFor(() => {
      expect(useCampaignStore.getState().tutorialStepIndex).toBe(3);
    });
    expect(screen.getByLabelText('Submit Guess')).toHaveAttribute(
      'data-tutorial',
      'submit'
    );
  });

  it('demonstrates Rookie Assist dead key dimming on a 0-pot 0-pan guess', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-dead',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });

    vi.spyOn(terminalService, 'submitGuess').mockResolvedValueOnce({
      pots: 0,
      pans: 0,
      attemptsLeft: 7,
      status: 'active',
    });

    render(<TerminalScreen nodeId="n-dead" />);
    await screen.findByText(/Node: n-dead/i);

    // Guess 7, 8, 9
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    // Expect NO MATCH
    await waitFor(() => {
      expect(screen.getByText('NO MATCH')).toBeInTheDocument();
    });

    // Keys 7, 8, 9 must now have aria-label ending with "eliminated"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '7, eliminated' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '8, eliminated' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '9, eliminated' })).toBeInTheDocument();
    // Key 1 is not eliminated
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();

    // Nix elimination message appears
    await waitFor(() => {
      expect(screen.getByText(/Dead number\. I grayed that key out/i)).toBeInTheDocument();
    });
  });

  it('pro mode does not dim dead keys', async () => {
    useSettingsStore.setState({ rookieAssist: false }); // Pro mode

    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-pro',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });

    vi.spyOn(terminalService, 'submitGuess').mockResolvedValueOnce({
      pots: 0,
      pans: 0,
      attemptsLeft: 7,
      status: 'active',
    });

    render(<TerminalScreen nodeId="n-pro" />);
    await screen.findByText(/Node: n-pro/i);

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    await waitFor(() => {
      expect(screen.getByText('NO MATCH')).toBeInTheDocument();
    });

    // In pro mode, key 7 retains regular aria-label "7" without eliminated
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument();
  });

  it('explains validation errors on incomplete entry and duplicate digits', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-val',
      startedAt: Date.now(),
      config: {
        digits: 4,
        allowDuplicates: false,
        attempts: 7,
        timerSeconds: 60,
        tier: 2,
        ice: 'None',
      },
    });

    render(<TerminalScreen nodeId="n-val" />);
    await screen.findByText(/Node: n-val/i);

    // Incomplete submission: SUBMIT is disabled
    const submitBtn = screen.getByRole('button', { name: /Submit Guess/i });
    expect(submitBtn).toBeDisabled();

    // Click digit 1 twice on unique-only tier
    const btn1 = screen.getByRole('button', { name: '1' });
    fireEvent.click(btn1);

    // Second click on '1' is disabled and explains repeats
    expect(screen.getByRole('button', { name: '1, already used' })).toBeDisabled();
  });

  it('opens clue legend drawer on "?" button tap', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-legend',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });

    render(<TerminalScreen nodeId="n-legend" />);
    await screen.findByText(/Node: n-legend/i);

    const helpBtn = screen.getByRole('button', { name: /Open Clue Legend/i });
    fireEvent.click(helpBtn);

    expect(screen.getByText('Clue Legend')).toBeInTheDocument();
    expect(screen.getByText('Right digit in the right position.')).toBeInTheDocument();
    expect(screen.getByText('Right digit in the wrong position.')).toBeInTheDocument();
    expect(screen.getByText('Digit does not appear in the target cipher.')).toBeInTheDocument();
  });

  it('displays tactical guidance when all digits are pots (transposed) and allows swapping positions to win with all pans', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-allpots',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });

    vi.spyOn(terminalService, 'submitGuess')
      // Guess 1: 312 -> 0 pans, 3 pots (all digits correct but wrong slots)
      .mockResolvedValueOnce({
        pans: 0,
        pots: 3,
        attemptsLeft: 7,
        status: 'active',
      })
      // Guess 2: 123 -> 3 pans (win)
      .mockResolvedValueOnce({
        pans: 3,
        pots: 0,
        attemptsLeft: 6,
        status: 'won',
        secret: '123',
        payout: 120,
      });

    render(<TerminalScreen nodeId="n-allpots" />);
    await screen.findByText(/Node: n-allpots/i);

    // Guess 3, 1, 2
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    // Expect 3 POT result
    await waitFor(() => {
      expect(screen.getAllByText('3 POT').length).toBeGreaterThan(0);
    });

    // Expect tactical guidance hint to be shown
    expect(
      screen.getByText('All 3 digits found! Swap positions to breach.')
    ).toBeInTheDocument();

    // Now user swaps to 1, 2, 3
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    // Win banner appears
    await waitFor(() => {
      expect(screen.getByText('BREACHED')).toBeInTheDocument();
      expect(screen.getByText('RETURN TO MAP')).toBeInTheDocument();
    });
  });

  it('displays connection severed banner with revealed cipher and trace penalty on timeout loss', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'sess-timeout',
      startedAt: Date.now() - 95000,
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
      },
    });

    vi.spyOn(terminalService, 'submitGuess').mockResolvedValueOnce({
      status: 'lost',
      secret: '849',
      fine: 60,
      error: 'Time expired',
    });

    render(<TerminalScreen nodeId="n-timeout" />);
    await screen.findByText(/Node: n-timeout/i);

    // Type 1, 2, 3 and submit
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    // Severed banner appears with target cipher code and trace penalty
    await waitFor(() => {
      expect(screen.getByText('CONNECTION SEVERED')).toBeInTheDocument();
      expect(screen.getByText('TARGET CIPHER CODE')).toBeInTheDocument();
      expect(screen.getByText('849')).toBeInTheDocument();
      expect(screen.getByText('TRACE PENALTY:')).toBeInTheDocument();
      expect(screen.getByText('-$60')).toBeInTheDocument();
      expect(screen.getByText('RETURN TO MAP')).toBeInTheDocument();
    });
    expect(screen.getByTestId('breach-banner')).toHaveAttribute(
      'data-surface',
      'terminal'
    );
  });
});
