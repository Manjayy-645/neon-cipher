import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DevMenu } from '../DevMenu';
import { useSystemStore } from '@/stores/system-store';
import { useSettingsStore } from '@/stores/settings-store';
import { usePlayerStore } from '@/stores/player-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../../settings/settingsService', () => ({
  settingsService: {
    getSettings: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../auth/authService', () => ({
  authService: {
    login: vi.fn().mockResolvedValue({
      profile: { handle: 'ZERO_COOL', avatarUrl: '/icons/glyph-camera.svg' },
      settings: {},
      wallet: { credits: 10000, coins: 20, inventory: {}, equippedTools: [] },
    }),
  },
}));

describe('DevMenu Component (Acceptance: Every state reachable from dev menu)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSystemStore.setState({
      simulatedOffline: false,
      reconnectBannerVisible: false,
      midDuelDesync: false,
      globalLoading: false,
      offlineNoticeVisible: false,
    });
    useSettingsStore.setState({
      reducedMotion: 'system',
      colorBlindMode: false,
      rookieAssist: true,
      isDrawerOpen: false,
    });
    usePlayerStore.setState({
      handle: 'ZERO_COOL',
      credits: 10000,
      coins: 20,
    });
  });

  it('renders floating dev button and opens matrix dialog', async () => {
    render(<DevMenu />);
    const openBtn = screen.getByLabelText('Open developer debug menu');
    expect(openBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(openBtn);
    });

    expect(screen.getByText('DEV CONTROL MATRIX')).toBeDefined();
  });

  it('reaches screens from dev menu', async () => {
    render(<DevMenu />);
    const openBtn = screen.getByLabelText('Open developer debug menu');
    await act(async () => {
      fireEvent.click(openBtn);
    });

    // Test Splash route
    const splashBtn = screen.getByText('0.1 Splash / Boot');
    await act(async () => {
      fireEvent.click(splashBtn);
    });
    expect(mockPush).toHaveBeenCalledWith('/splash');

    // Reopen menu
    await act(async () => {
      fireEvent.click(openBtn);
    });

    // Test Login route
    const loginBtn = screen.getByText('0.2 Login & Callsign');
    await act(async () => {
      fireEvent.click(loginBtn);
    });
    expect(mockPush).toHaveBeenCalledWith('/login');

    // Reopen menu
    await act(async () => {
      fireEvent.click(openBtn);
    });

    // Test Error route
    const errorBtn = screen.getByText('0.3 Error Page');
    await act(async () => {
      fireEvent.click(errorBtn);
    });
    expect(mockPush).toHaveBeenCalledWith('/error');

    // Reopen menu
    await act(async () => {
      fireEvent.click(openBtn);
    });

    // Test Maintenance route
    const maintBtn = screen.getByText('0.3 Maintenance');
    await act(async () => {
      fireEvent.click(maintBtn);
    });
    expect(mockPush).toHaveBeenCalledWith('/maintenance');
  });

  it('toggles system states (offline, mid-duel desync, loading, offline notice)', async () => {
    render(<DevMenu />);
    const openBtn = screen.getByLabelText('Open developer debug menu');
    await act(async () => {
      fireEvent.click(openBtn);
    });

    // Toggle offline
    const offlineToggle = screen.getByRole('button', { name: /^ONLINE$/i });
    await act(async () => {
      fireEvent.click(offlineToggle);
    });
    expect(useSystemStore.getState().simulatedOffline).toBe(true);

    // Toggle mid-duel desync
    const desyncToggle = screen.getByRole('button', { name: /^NORMAL$/i });
    await act(async () => {
      fireEvent.click(desyncToggle);
    });
    expect(useSystemStore.getState().midDuelDesync).toBe(true);

    // Show offline notice
    const offlineNoticeBtn = screen.getByRole('button', { name: /^SHOW$/i });
    await act(async () => {
      fireEvent.click(offlineNoticeBtn);
    });
    expect(useSystemStore.getState().offlineNoticeVisible).toBe(true);

    // Toggle global loading
    const loadingToggle = screen.getByRole('button', { name: /^IDLE$/i });
    await act(async () => {
      fireEvent.click(loadingToggle);
    });
    expect(useSystemStore.getState().globalLoading).toBe(true);
  });

  it('toggles global accessibility options (reduced motion, color-blind mode)', async () => {
    render(<DevMenu />);
    const openBtn = screen.getByLabelText('Open developer debug menu');
    await act(async () => {
      fireEvent.click(openBtn);
    });

    // Override reduced motion
    const reducedBtn = screen.getByRole('button', { name: /^REDUCED$/i });
    await act(async () => {
      fireEvent.click(reducedBtn);
    });
    expect(useSettingsStore.getState().reducedMotion).toBe('reduced');

    // Toggle color-blind mode
    const cbBtn = screen.getByRole('button', { name: /^DEFAULT$/i });
    await act(async () => {
      fireEvent.click(cbBtn);
    });
    expect(useSettingsStore.getState().colorBlindMode).toBe(true);
  });

  it('toggles feature flags and unlocks locked-out features for developer review', async () => {
    render(<DevMenu />);
    const openBtn = screen.getByLabelText('Open developer debug menu');
    await act(async () => {
      fireEvent.click(openBtn);
    });

    // Toggle Comms flag
    const commsToggle = screen.getByTestId('dev-flag-toggle-comms');
    expect(commsToggle).toBeDefined();

    await act(async () => {
      fireEvent.click(commsToggle);
    });
    expect(commsToggle).toHaveTextContent(/ON/i);

    // Click UNLOCK ALL GATES
    const unlockAllBtn = screen.getByTestId('dev-unlock-all-gates');
    await act(async () => {
      fireEvent.click(unlockAllBtn);
    });

    const duelToggle = screen.getByTestId('dev-flag-toggle-duel');
    expect(duelToggle).toHaveTextContent(/ON/i);

    // Reset flags
    const resetBtn = screen.getByTestId('dev-reset-all-flags');
    await act(async () => {
      fireEvent.click(resetBtn);
    });
  });
});
