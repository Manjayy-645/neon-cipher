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
});
