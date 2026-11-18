import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TerminalHeader } from '../components/TerminalHeader';
import { SplashScreen } from '@/features/onboarding/components/SplashScreen';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { usePlayerStore } from '@/stores/player-store';
import { TUTORIAL } from '@/features/onboarding/steps';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

describe('Nix Tutorial Exit & Skip Mechanics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().reset();
  });

  describe('TerminalHeader Exit Button', () => {
    const baseConfig = {
      length: 3,
      digits: 3,
      allowDuplicates: false,
      tier: 1,
      attempts: 7,
      timerSeconds: 60,
      ice: 'None' as const,
    };

    it('renders the exit tutorial button when onExit is provided', () => {
      const onExit = vi.fn();

      render(
        <TerminalHeader
          nodeName="Rusty Soda Machine"
          nodeId="tutorial-soda"
          config={baseConfig}
          usedAttempts={0}
          elapsedSeconds={0}
          onOpenLegend={vi.fn()}
          onExit={onExit}
          exitLabel="EXIT TUTORIAL"
        />
      );

      const exitBtn = screen.getByTestId('exit-tutorial-button');
      expect(exitBtn).toBeInTheDocument();
      expect(exitBtn).toHaveTextContent(/EXIT TUTORIAL/i);

      fireEvent.click(exitBtn);
      expect(onExit).toHaveBeenCalledOnce();
    });

    it('omits the exit button when onExit is not provided', () => {
      render(
        <TerminalHeader
          nodeName="Corner Store"
          nodeId="n4"
          config={baseConfig}
          usedAttempts={0}
          elapsedSeconds={0}
          onOpenLegend={vi.fn()}
        />
      );

      expect(screen.queryByTestId('exit-tutorial-button')).not.toBeInTheDocument();
    });
  });

  describe('SplashScreen Skip Tutorial Action', () => {
    it('renders the SKIP TUTORIAL button and transitions player straight to the city map', async () => {
      render(<SplashScreen />);

      const skipTutorialBtn = await screen.findByTestId('splash-skip-tutorial-btn');
      expect(skipTutorialBtn).toBeInTheDocument();
      expect(skipTutorialBtn).toHaveTextContent(/ENTER THE CITY/i);
      expect(skipTutorialBtn).toHaveAccessibleDescription(/mark Chapter 1 complete.*Chapter 2/i);

      fireEvent.click(skipTutorialBtn);

      const state = useOnboardingStore.getState();
      expect(state.skipped).toBe(true);
      expect(state.step).toBe('done');
      expect(state.callsign).toBeDefined();
      expect(state.crackedNodes[TUTORIAL.mapNodeId]).toBeDefined();

      const playerState = usePlayerStore.getState();
      expect(playerState.handle).toBeDefined();

      expect(mockPush).toHaveBeenCalledWith('/map');
    });
  });
});
