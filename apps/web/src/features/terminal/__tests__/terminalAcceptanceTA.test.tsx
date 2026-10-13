import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TerminalScreen from '../TerminalScreen';
import { terminalService } from '../terminalService';
import { useSettingsStore } from '@/stores/settings-store';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TASK T-A Acceptance: Solo cracking terminal & correctness display', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSettingsStore.setState({ rookieAssist: true });
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
      // First guess: 123 -> 1 pot, 1 pan, 1 miss
      .mockResolvedValueOnce({
        pots: 1,
        pans: 1,
        attemptsLeft: 7,
        status: 'active',
      })
      // Second guess: 142 -> 3 pots (win)
      .mockResolvedValueOnce({
        pots: 3,
        pans: 0,
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
      expect(screen.getAllByText('1 POT 1 PAN').length).toBeGreaterThan(0);
    });
    expect(screen.getByLabelText(/Guess 1: 1 2 3\. 1 pot, 1 pan, 1 miss\./i)).toBeInTheDocument();
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
});
