import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TerminalScreen from '../TerminalScreen';
import { terminalService } from '../terminalService';
import { useCampaignStore } from '@/stores/campaign-store';
import { useMapStore } from '@/stores/map-store';
import { usePlayerStore } from '@/stores/player-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { emit } from '@/features/onboarding/events';
import { NIX_RECOVERY_NODE_ID } from '@/features/story/recoveryQuest';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/terminal/n4',
}));

describe('Part 2 Terminal UX: Pause, Keyboard & Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().reset();
    usePlayerStore.setState({
      credits: 500,
      equippedTools: ['cryo_spike'],
      inventory: { cryo_spike: 2 },
    });
    useCampaignStore.getState().syncCampaign({
      debt: { initial: 10000, current: 8500, paid: 1500 },
      chapters: {
        'chapter-1': { id: 'chapter-1', status: 'completed' },
        'chapter-2': { id: 'chapter-2', status: 'available' },
      },
      activeChapterId: 'chapter-2',
      unlocks: { blackMarket: false, onlinePlay: false, bridge: false },
      tutorials: {
        'chapter-1': { completed: true, skipped: false },
        'chapter-2': { completed: false, skipped: false },
      },
    });
  });

  it('routes the coach exit request through confirmation without changing progress on cancel', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'test-coach-exit', startedAt: Date.now(),
      config: { digits: 3, allowDuplicates: false, attempts: 6, timerSeconds: 60, tier: 1, ice: 'None' },
    });
    render(<TerminalScreen nodeId="tutorial-soda" />);
    await screen.findByTestId('exit-tutorial-button');
    act(() => emit({ type: 'terminal:exit-requested' }));
    expect(screen.getByRole('dialog', { name: 'Exit Nix tutorial?' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cancel-exit-tutorial-btn'));
    expect(screen.queryByRole('dialog', { name: 'Exit Nix tutorial?' })).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('preserves native Enter activation on focused controls and moves typed digits into the terminal', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'keyboard-controls', startedAt: Date.now(),
      config: { digits: 3, allowDuplicates: false, attempts: 6, timerSeconds: 120, tier: 1, ice: 'None' },
    });
    const submit = vi.spyOn(terminalService, 'submitGuess');
    render(<TerminalScreen nodeId="n4" />);
    const help = await screen.findByRole('button', { name: 'Open Clue Legend' });
    help.focus();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    fireEvent(help, enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(help, { key: '1' });
    expect(screen.getByRole('region', { name: 'Cipher terminal' })).toHaveFocus();
    expect(screen.getByRole('group', { name: 'Digit entry, 1 of 3 digits filled' })).toBeInTheDocument();
  });

  it('supports physical keyboard input (0-9, Backspace, Enter)', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'test-session-kb',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 6,
        timerSeconds: 120,
        tier: 1,
        ice: 'None',
      },
    });

    const submitSpy = vi.spyOn(terminalService, 'submitGuess').mockResolvedValue({
      pans: 1,
      pots: 0,
      attemptsLeft: 5,
      status: 'active',
    });

    render(<TerminalScreen nodeId="n4" />);

    await waitFor(() => {
      expect(screen.queryByText(/ESTABLISHING QUANTUM LINK/i)).not.toBeInTheDocument();
    });

    // Press physical keys 1, 2, 3
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: '3' });

    // Press Backspace: should remove '3'
    fireEvent.keyDown(window, { key: 'Backspace' });

    // Press '4': now entry is 1, 2, 4
    fireEvent.keyDown(window, { key: '4' });

    // Press Enter to submit
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith('test-session-kb', '124');
    });
  });

  it('provides tactile [PAUSE] button in header that blurs/masks terminal until [RESUME BREACH] is clicked', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'test-session-pause',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 6,
        timerSeconds: 60,
        tier: 1,
        ice: 'None',
      },
    });

    render(<TerminalScreen nodeId="n4" />);

    await waitFor(() => {
      expect(screen.getByTestId('terminal-pause-button')).toBeInTheDocument();
    });

    // Pause overlay initially hidden
    expect(screen.queryByTestId('terminal-pause-overlay')).not.toBeInTheDocument();

    // Click PAUSE button
    fireEvent.click(screen.getByTestId('terminal-pause-button'));

    // Pause overlay is displayed
    const pauseOverlay = screen.getByTestId('terminal-pause-overlay');
    expect(pauseOverlay).toBeInTheDocument();
    expect(pauseOverlay).toHaveTextContent(/BREACH PAUSED/i);

    // Click RESUME BREACH
    const resumeBtn = screen.getByTestId('resume-breach-button');
    expect(resumeBtn).toBeInTheDocument();
    fireEvent.click(resumeBtn);

    // Overlay is dismissed
    expect(screen.queryByTestId('terminal-pause-overlay')).not.toBeInTheDocument();
  });

  it('allows inspecting equipped tool via ToolInspectorModal', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'test-session-tool',
      startedAt: Date.now(),
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 6,
        timerSeconds: 60,
        tier: 1,
        ice: 'None',
      },
    });

    render(<TerminalScreen nodeId="n4" />);

    await waitFor(() => {
      expect(screen.getByTestId('inspect-tool-cryo_spike')).toBeInTheDocument();
    });

    // Click tool to inspect
    fireEvent.click(screen.getByTestId('inspect-tool-cryo_spike'));

    // Tool inspector modal is visible
    const modal = screen.getByTestId('tool-inspector-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent(/Cryo-Spike/i);
    expect(modal).toHaveTextContent(/Freezes active ICE/i);

    // Close modal
    fireEvent.click(screen.getByTestId('close-tool-inspector-btn'));
    expect(screen.queryByTestId('tool-inspector-modal')).not.toBeInTheDocument();
  });

  it('routes back to /map with next campaign target highlighted after winning Nix Recovery Run', async () => {
    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'test-session-recovery',
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

    vi.spyOn(terminalService, 'submitGuess').mockResolvedValue({
      pans: 3,
      pots: 0,
      attemptsLeft: 998,
      status: 'won',
      secret: '123',
      payout: 0,
    });

    render(<TerminalScreen nodeId={NIX_RECOVERY_NODE_ID} />);

    await waitFor(() => {
      expect(screen.queryByText(/ESTABLISHING QUANTUM LINK/i)).not.toBeInTheDocument();
    });

    // Enter winning guess 1, 2, 3
    for (const digit of ['1', '2', '3']) {
      fireEvent.click(screen.getByRole('button', { name: digit }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Submit Guess/i }));

    // Win banner appears with "RETURN TO CAMPAIGN"
    const returnBtn = await screen.findByRole('button', { name: /RETURN TO CAMPAIGN/i });
    expect(returnBtn).toBeInTheDocument();

    fireEvent.click(returnBtn);

    // Routes to active campaign target terminal
    expect(mockPush).toHaveBeenCalledWith('/terminal/n4');
  });
});
