import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ConnectionBanner } from '../ConnectionBanner';
import { useSystemStore } from '@/stores/system-store';

vi.mock('@/lib/audio', () => ({
  soundFx: {
    playKeystroke: vi.fn(),
    playUiBeep: vi.fn(),
    playSuccess: vi.fn(),
    playWarning: vi.fn(),
  },
}));

describe('ConnectionBanner Component (0.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSystemStore.setState({
      isOnline: true,
      simulatedOffline: false,
      reconnectBannerVisible: false,
      isReconnecting: false,
      midDuelDesync: false,
      midDuelSecondsLeft: 30,
    });
  });

  it('renders nothing when connection is online and normal', () => {
    const { container } = render(<ConnectionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders offline banner with retry button when offline', () => {
    useSystemStore.setState({ isOnline: false });
    render(<ConnectionBanner />);

    expect(screen.getByText(/OFFLINE \/\/ CONNECTION LOST/)).toBeDefined();
    expect(screen.getByRole('button', { name: /RETRY LINK/i })).toBeDefined();
  });

  it('renders signal restored banner when reconnectBannerVisible is true', () => {
    useSystemStore.setState({ reconnectBannerVisible: true });
    render(<ConnectionBanner />);

    expect(screen.getByText(/CONNECTION RESTORED \/\/ SIGNAL STABLE/)).toBeDefined();
    expect(screen.getByLabelText('Dismiss banner')).toBeDefined();
  });

  it('renders mid-duel desync banner with countdown and forfeit button', async () => {
    useSystemStore.setState({
      midDuelDesync: true,
      midDuelSecondsLeft: 25,
    });
    render(<ConnectionBanner />);

    expect(screen.getByText(/CRITICAL: DUEL CARRIER DESYNC/)).toBeDefined();
    expect(screen.getByText(/25s/)).toBeDefined();
    expect(screen.getByRole('button', { name: /RECONNECT NOW/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /FORFEIT/i })).toBeDefined();

    // Forfeit button dismisses desync state
    const forfeitBtn = screen.getByRole('button', { name: /FORFEIT/i });
    await act(async () => {
      fireEvent.click(forfeitBtn);
    });

    expect(useSystemStore.getState().midDuelDesync).toBe(false);
  });
});
