import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SettingsDrawer } from '../SettingsDrawer';
import { useSettingsStore } from '@/stores/settings-store';
import { usePlayerStore } from '@/stores/player-store';
import { authService } from '../../auth/authService';
import { defaultCampaignState } from '@/app/api/mock/db';
import { useCampaignStore } from '@/stores/campaign-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../../auth/authService', () => ({
  authService: {
    exportData: vi.fn(),
    resetCampaign: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../settingsService', () => ({
  settingsService: {
    getSettings: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/audio', () => ({
  soundFx: {
    playKeystroke: vi.fn(),
    playUiBeep: vi.fn(),
    playSuccess: vi.fn(),
    playWarning: vi.fn(),
  },
}));

describe('SettingsDrawer Component (6.0)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      rookieAssist: true,
      reducedMotion: 'system',
      colorBlindMode: false,
      audio: { keystrokes: 70, ui: 80, ambient: 50 },
      dailySpendLimit: null,
      isDrawerOpen: true,
    });
    usePlayerStore.setState({
      handle: 'ZERO_COOL',
      credits: 12500,
      coins: 45,
    });
    vi.mocked(authService.resetCampaign).mockResolvedValue({
      account: {
        wallet: {
          credits: 4200,
          coins: 7,
          inventory: { 'tool-static-injector': 1 },
          equippedTools: ['tool-static-injector'],
        },
      },
      campaign: defaultCampaignState,
    });
    useCampaignStore.getState().syncCampaign(defaultCampaignState);
  });

  it('renders all 6 configuration sections and decker profile', () => {
    render(<SettingsDrawer isOpen={true} />);
    expect(screen.getByText('SETTINGS')).toBeDefined();
    expect(screen.getByText('HACKING CONSOLE MODE')).toBeDefined();
    expect(screen.getByText('MOTION PREFERENCE')).toBeDefined();
    expect(screen.getByText('CLUE DISPLAY MODE')).toBeDefined();
    expect(screen.getByText('AUDIO LEVELS')).toBeDefined();
    expect(screen.getByText('DAILY SPEND LIMIT')).toBeDefined();
    expect(screen.getByText('DECKER PROFILE')).toBeDefined();
    expect(screen.getByText('ZERO_COOL')).toBeDefined();
  });

  it('toggles between Rookie Assist and Pro Mode', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const proBtn = screen.getByRole('button', { name: /Pro Mode/i });

    await act(async () => {
      fireEvent.click(proBtn);
    });

    expect(useSettingsStore.getState().rookieAssist).toBe(false);

    const rookieBtn = screen.getByRole('button', { name: /Rookie Assist/i });
    await act(async () => {
      fireEvent.click(rookieBtn);
    });

    expect(useSettingsStore.getState().rookieAssist).toBe(true);
  });

  it('changes reduced motion override and updates DOM attribute', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const reducedBtn = screen.getByRole('button', { name: /^reduced$/i });

    await act(async () => {
      fireEvent.click(reducedBtn);
    });

    expect(useSettingsStore.getState().reducedMotion).toBe('reduced');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
  });

  it('toggles color-blind mode and sets data-colorblind DOM attribute', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const shapeOnlyBtn = screen.getByRole('button', { name: /Shape-Only/i });

    await act(async () => {
      fireEvent.click(shapeOnlyBtn);
    });

    expect(useSettingsStore.getState().colorBlindMode).toBe(true);
    expect(document.documentElement.getAttribute('data-colorblind')).toBe('true');
  });

  it('updates audio sliders', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const slider = screen.getByLabelText('Keystroke audio volume');

    await act(async () => {
      fireEvent.change(slider, { target: { value: '45' } });
    });

    expect(useSettingsStore.getState().audio.keystrokes).toBe(45);
  });

  it('toggles master mute switch', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const muteToggle = screen.getByTestId('master-mute-toggle');
    expect(muteToggle.textContent).toContain('UNMUTED');
    expect(useSettingsStore.getState().masterMute).toBe(false);

    await act(async () => {
      fireEvent.click(muteToggle);
    });

    expect(useSettingsStore.getState().masterMute).toBe(true);
    expect(screen.getByTestId('master-mute-toggle').textContent).toContain('MUTED');

    await act(async () => {
      fireEvent.click(screen.getByTestId('master-mute-toggle'));
    });

    expect(useSettingsStore.getState().masterMute).toBe(false);
  });

  it('configures daily spend limit', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const limitBtn = screen.getByRole('button', { name: '$1K' });

    await act(async () => {
      fireEvent.click(limitBtn);
    });

    expect(useSettingsStore.getState().dailySpendLimit).toBe(1000);
  });

  it('requires confirmation before resetting campaign', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const resetBtn = screen.getByText('Reset Campaign Progress');

    await act(async () => {
      fireEvent.click(resetBtn);
    });

    expect(screen.getByText(/clears chapter and node progress/i)).toBeDefined();
    expect(authService.resetCampaign).not.toHaveBeenCalled();

    const confirmBtn = screen.getByRole('button', { name: 'RESET CAMPAIGN' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(authService.resetCampaign).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().credits).toBe(4200);
    expect(usePlayerStore.getState().coins).toBe(7);
    expect(usePlayerStore.getState().inventory).toEqual({ 'tool-static-injector': 1 });
  });

  it('signs out and routes to /login', async () => {
    render(<SettingsDrawer isOpen={true} />);
    const signOutBtn = screen.getByText('Sign Out');

    await act(async () => {
      fireEvent.click(signOutBtn);
    });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
