import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import TerminalScreen from '../TerminalScreen';
import { terminalService } from '../terminalService';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useCampaignStore } from '@/stores/campaign-store';

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Terminal Tool Wiring (Solo Cracking)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();

    useSettingsStore.setState({ rookieAssist: true });
    useCampaignStore.setState({
      activeChapterId: null,
      tutorialActive: false,
      tutorialStepIndex: 0,
    });

    vi.spyOn(terminalService, 'startSession').mockResolvedValue({
      sessionId: 'session-tool-test',
      config: {
        digits: 3,
        allowDuplicates: false,
        attempts: 8,
        timerSeconds: 90,
        tier: 1,
        ice: 'None',
        nodeName: 'Test Infiltration Relay',
        nodeType: 'vending',
        bounty: 450,
      },
      startedAt: Date.now(),
    });

    usePlayerStore.setState({
      credits: 5000,
      coins: 20,
      inventory: {
        'tool-static-injector': 2,
        'tool-firewall-patch': 1,
      },
      equippedTools: ['tool-static-injector', 'tool-firewall-patch'],
    });
  });

  it('renders equipped tool slots in the active terminal screen', async () => {
    render(<TerminalScreen nodeId="n-test-relay" />);

    expect(await screen.findByText(/Test Infiltration Relay/i)).toBeInTheDocument();
    expect(screen.getByText('RIG SLOTS // INTRUSION TOOLS')).toBeInTheDocument();
    expect(screen.getByText('Static Injector')).toBeInTheDocument();
    expect(screen.getByText('Firewall Patch')).toBeInTheDocument();
    expect(screen.getByText('x2 in deck')).toBeInTheDocument();
    expect(screen.getByText('x1 in deck')).toBeInTheDocument();
  });

  it('activates Static Injector, displays tactical feedback, and dims eliminated digit', async () => {
    vi.spyOn(terminalService, 'useTool').mockResolvedValue({
      success: true,
      toolId: 'tool-static-injector',
      effectType: 'eliminate_digit',
      eliminatedDigit: '7',
      message: 'Static Injector deployed: Digit [7] confirmed dead and purged from keypad.',
      inventory: {
        'tool-static-injector': 1,
        'tool-firewall-patch': 1,
      },
      equippedTools: ['tool-static-injector', 'tool-firewall-patch'],
    });

    render(<TerminalScreen nodeId="n-test-relay" />);
    await screen.findByText(/Test Infiltration Relay/i);

    const activateBtn = screen.getByTestId('activate-tool-tool-static-injector');
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(terminalService.useTool).toHaveBeenCalledWith('session-tool-test', 'tool-static-injector');
    });

    expect(await screen.findByTestId('terminal-tool-feedback')).toHaveTextContent(
      'Digit [7] confirmed dead'
    );

    // Verify key 7 is now disabled, grayed out, and labeled as eliminated
    const key7 = await screen.findByRole('button', { name: /7, eliminated/i });
    expect(key7).toBeDisabled();
    expect(key7).toHaveClass('line-through');

    // Key 7 is disabled so clicking is blocked
    expect(key7).toBeDisabled();

    // Typing dead key 7 on keyboard triggers illegal attempt feedback
    fireEvent.keyDown(window, { key: '7' });
    expect(screen.getByText('Digit eliminated — not in code')).toBeInTheDocument();
  });

  it('primes Firewall Patch and displays SHIELD ARMED indicator', async () => {
    vi.spyOn(terminalService, 'useTool').mockResolvedValue({
      success: true,
      toolId: 'tool-firewall-patch',
      effectType: 'firewall_shield',
      shieldArmed: true,
      message: 'Firewall Patch armed: Defensive shield primed.',
      inventory: {
        'tool-static-injector': 2,
      },
      equippedTools: ['tool-static-injector'],
    });

    render(<TerminalScreen nodeId="n-test-relay" />);
    await screen.findByText(/Test Infiltration Relay/i);

    const firewallBtn = screen.getByTestId('activate-tool-tool-firewall-patch');
    fireEvent.click(firewallBtn);

    await waitFor(() => {
      expect(screen.getByTestId('ice-shield-status')).toHaveTextContent('SHIELD ARMED');
    });
  });

  it('activates Extra Cycle exploit and injects +2 attempts', async () => {
    usePlayerStore.setState({
      inventory: {
        'exploit-extra-cycle': 1,
      },
      equippedTools: ['exploit-extra-cycle'],
    });

    vi.spyOn(terminalService, 'useTool').mockResolvedValue({
      success: true,
      toolId: 'exploit-extra-cycle',
      effectType: 'extra_attempts',
      extraAttempts: 2,
      message: 'Extra Cycle deployed: +2 intrusion attempts injected into buffer.',
      inventory: {},
      equippedTools: [],
    });

    render(<TerminalScreen nodeId="n-test-relay" />);
    await screen.findByText(/Test Infiltration Relay/i);

    expect(screen.getByText('Extra Cycle')).toBeInTheDocument();
    const btn = screen.getByTestId('activate-tool-exploit-extra-cycle');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId('terminal-tool-feedback')).toHaveTextContent('+2 intrusion attempts');
    });
    // Base attempts was 8, now 8 + 2 = 10
    expect(screen.getByText(/1\/10/)).toBeInTheDocument();
  });

  it('activates Skeleton Key exploit and breaches node immediately', async () => {
    usePlayerStore.setState({
      inventory: {
        'exploit-skeleton-key': 1,
      },
      equippedTools: ['exploit-skeleton-key'],
    });

    vi.spyOn(terminalService, 'useTool').mockResolvedValue({
      success: true,
      toolId: 'exploit-skeleton-key',
      effectType: 'skeleton_key',
      autoCrack: true,
      secret: '482',
      message: 'Skeleton Key deployed: Master cryptographic bypass accepted. Node breached!',
      inventory: {},
      equippedTools: [],
    });

    render(<TerminalScreen nodeId="n-test-relay" />);
    await screen.findByText(/Test Infiltration Relay/i);

    const btn = screen.getByTestId('activate-tool-exploit-skeleton-key');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(terminalService.useTool).toHaveBeenCalledWith('session-tool-test', 'exploit-skeleton-key');
    });

    await waitFor(() => {
      expect(screen.getByText('BREACHED')).toBeInTheDocument();
    });
  });

  it('activates Cryo-Pulse Spike, displays CLOCK FROZEN, and marks tool slot as USED', async () => {
    usePlayerStore.setState({
      inventory: {
        'tool-cryo-pulse': 2,
      },
      equippedTools: ['tool-cryo-pulse'],
    });

    vi.spyOn(terminalService, 'useTool').mockResolvedValue({
      success: true,
      toolId: 'tool-cryo-pulse',
      effectType: 'freeze_timer',
      timerFrozenSeconds: 15,
      timeAddedSeconds: 15,
      message: 'Cryo-Pulse Spike detonated: Cryogenic feedback injected. Clock frozen for 15 seconds!',
      inventory: {
        'tool-cryo-pulse': 1,
      },
      equippedTools: ['tool-cryo-pulse'],
    });

    render(<TerminalScreen nodeId="n-test-relay" />);
    await screen.findByText(/Test Infiltration Relay/i);

    expect(screen.getByText('Cryo-Pulse Spike')).toBeInTheDocument();
    const btn = screen.getByTestId('activate-tool-tool-cryo-pulse');
    expect(btn).toHaveTextContent('USE');
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(terminalService.useTool).toHaveBeenCalledWith('session-tool-test', 'tool-cryo-pulse');
    });

    expect(await screen.findByTestId('timer-frozen-status')).toHaveTextContent('CLOCK FROZEN');
    expect(screen.getByTestId('terminal-tool-feedback')).toHaveTextContent('Clock frozen for 15 seconds');

    // Button should now show USED and be disabled (1 use per slot per run)
    expect(btn).toHaveTextContent('USED');
    expect(btn).toBeDisabled();

    // Clicking again should not trigger another useTool call
    fireEvent.click(btn);
    expect(terminalService.useTool).toHaveBeenCalledTimes(1);
  });

  it('activates Zero-Day Exploit, displays unmasked slot digit, and attaches PEEK badge in GuessEntry', async () => {
    usePlayerStore.setState({
      inventory: {
        'tool-zero-day': 1,
      },
      equippedTools: ['tool-zero-day'],
    });

    vi.spyOn(terminalService, 'useTool').mockResolvedValue({
      success: true,
      toolId: 'tool-zero-day',
      effectType: 'slot_peek',
      revealedSlot: { slotIndex: 1, digit: '8' },
      message: 'Zero-Day Exploit unmasked: Slot [2] is confirmed to be digit [8].',
      inventory: {},
      equippedTools: [],
    });

    render(<TerminalScreen nodeId="n-test-relay" />);
    await screen.findByText(/Test Infiltration Relay/i);

    expect(screen.getByText('Zero-Day Exploit')).toBeInTheDocument();
    const btn = screen.getByTestId('activate-tool-tool-zero-day');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(terminalService.useTool).toHaveBeenCalledWith('session-tool-test', 'tool-zero-day');
    });

    expect(await screen.findByTestId('terminal-tool-feedback')).toHaveTextContent(
      'Slot [2] is confirmed to be digit [8]'
    );

    // Slot index 1 (the 2nd slot) should display revealed digit 8 and PEEK badge
    const revealedDigit = await screen.findByTestId('revealed-slot-1');
    expect(revealedDigit).toHaveTextContent('8');
    expect(screen.getByTestId('slot-unmasked-badge-1')).toHaveTextContent('PEEK');
  });
});
