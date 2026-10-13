import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TerminalFrame } from './TerminalFrame';
import TerminalHistory from './TerminalHistory';
import { IceIndicator } from './IceIndicator';
import { SuccessScreen, FailureScreen } from './TerminalScreens';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Task 7: Terminal skins & ICE features', () => {
  describe('TerminalFrame - 5 tier skins', () => {
    it('renders Tier 1 vending skin with manufacturer mark and serial', () => {
      render(
        <TerminalFrame tier={1}>
          <div>Core Content</div>
        </TerminalFrame>
      );
      expect(screen.getByText(/KURA-TEK VEND-LINE/i)).toBeInTheDocument();
      expect(screen.getByText(/KT-09-8832-A/i)).toBeInTheDocument();
      expect(screen.getByText('Core Content')).toBeInTheDocument();
    });

    it('renders Tier 2 ATM / register skin', () => {
      render(
        <TerminalFrame tier={2}>
          <div>Core Content</div>
        </TerminalFrame>
      );
      expect(screen.getByText(/MERIDIAN COMMERCE/i)).toBeInTheDocument();
      expect(screen.getByText(/MCS-501-REV9/i)).toBeInTheDocument();
    });

    it('renders Tier 3 corporate workstation skin', () => {
      render(
        <TerminalFrame tier={3}>
          <div>Core Content</div>
        </TerminalFrame>
      );
      expect(screen.getByText(/AERIS NETWORKS/i)).toBeInTheDocument();
      expect(screen.getByText(/AC-9941-X/i)).toBeInTheDocument();
    });

    it('renders Tier 4 vault panel skin', () => {
      render(
        <TerminalFrame tier={4}>
          <div>Core Content</div>
        </TerminalFrame>
      );
      expect(screen.getByText(/AEGIS HEAVY DEFENSE/i)).toBeInTheDocument();
      expect(screen.getByText(/CLASS-4/i)).toBeInTheDocument();
    });

    it('renders Tier 5 mainframe skin', () => {
      render(
        <TerminalFrame tier={5}>
          <div>Core Content</div>
        </TerminalFrame>
      );
      expect(screen.getByText(/NULL-ZERO COMPUTING/i)).toBeInTheDocument();
      expect(screen.getByText(/NZ-CORE-001X/i)).toBeInTheDocument();
    });
  });

  describe('ICE display rules in TerminalHistory', () => {
    it('suppresses pans when ice is Pot-only', () => {
      const guesses = [{ guess: '1234', pots: 1, pans: 2 }];
      const { container } = render(
        <TerminalHistory guesses={guesses} digits={4} ice="Pot-only" />
      );

      // Pot-only should show the filled circle (pot) and misses, but 0 pan rings
      const panElements = container.querySelectorAll('.border-money');
      expect(panElements.length).toBe(0);

      const potElements = container.querySelectorAll('.bg-accent');
      expect(potElements.length).toBe(1);
    });

    it('renders combined diamond hits when ice is Ghost', () => {
      const guesses = [{ guess: '1234', pots: 1, pans: 2 }];
      const { container } = render(
        <TerminalHistory guesses={guesses} digits={4} ice="Ghost" />
      );

      // Ghost renders totalHits (1 pot + 2 pans = 3 hits) with rotated diamond classes
      const ghostElements = container.querySelectorAll('.rotate-45');
      expect(ghostElements.length).toBe(3);
    });
  });

  describe('IceIndicator component', () => {
    it('renders ICE chip button with proper label', () => {
      render(<IceIndicator ice="Drift" />);
      expect(screen.getByText('ICE: Drift')).toBeInTheDocument();
    });

    it('renders nothing when ICE is None', () => {
      const { container } = render(<IceIndicator ice="None" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Breach Success and Failure screens', () => {
    it('renders SuccessScreen with payout breakdown and return button', () => {
      const onReturn = vi.fn();
      render(
        <SuccessScreen
          nodeId="n1"
          payout={150}
          guesses={[{ guess: '1234', pots: 4, pans: 0 }]}
          timeTaken={12}
          maxAttempts={5}
          onReturnToMap={onReturn}
        />
      );

      expect(screen.getByText('BREACH SUCCESSFUL')).toBeInTheDocument();
      expect(screen.getByText('RETURN TO MAP')).toBeInTheDocument();
      expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('renders FailureScreen with lockout and Nix comment', () => {
      const onReturn = vi.fn();
      render(
        <FailureScreen
          nodeId="n1"
          fine={50}
          secret="4321"
          guesses={[{ guess: '1234', pots: 0, pans: 0 }]}
          timeTaken={45}
          maxAttempts={4}
          errorReason="MAX ATTEMPTS EXCEEDED"
          onReturnToMap={onReturn}
        />
      );

      expect(screen.getByText('CONNECTION SEVERED')).toBeInTheDocument();
      expect(screen.getByText('DISCONNECT')).toBeInTheDocument();
      expect(screen.getByText('-$50')).toBeInTheDocument();
      expect(screen.getByText('4321')).toBeInTheDocument();
    });
  });

  describe('TerminalScreen lifecycle and hook consistency', () => {
    it('transitions smoothly from loading to active session without hook order errors', async () => {
      const { terminalService } = await import('./terminalService');
      const TerminalScreen = (await import('./TerminalScreen')).default;

      vi.spyOn(terminalService, 'startSession').mockResolvedValue({
        sessionId: 'test-session-123',
        startedAt: Date.now(),
        config: {
          digits: 3,
          allowDuplicates: false,
          attempts: 5,
          timerSeconds: 60,
          tier: 1,
          ice: 'None',
          eliminatedDigits: ['9'],
        },
      });

      render(<TerminalScreen nodeId="n1" />);

      // First renders loading state
      expect(screen.getByText(/ESTABLISHING QUANTUM LINK/i)).toBeInTheDocument();

      // After resolution, renders active terminal without throwing hook errors
      expect(await screen.findByText(/Node: n1/i)).toBeInTheDocument();
      expect(screen.getByText(/TIER 1 • UNIQUE/i)).toBeInTheDocument();
    });
  });
});
