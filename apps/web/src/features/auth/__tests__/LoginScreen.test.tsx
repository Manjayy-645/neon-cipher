import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LoginScreen } from '../LoginScreen';
import { authService } from '../authService';
import { usePlayerStore } from '@/stores/player-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../authService', () => ({
  authService: {
    login: vi.fn(),
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

describe('LoginScreen Component (0.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders callsign input, avatar picker, and JACK IN button', () => {
    render(<LoginScreen />);
    expect(screen.getByLabelText('DECKER CALLSIGN')).toBeDefined();
    expect(screen.getByText('AVATAR TRANSCEIVER GLYPH')).toBeDefined();
    expect(screen.getByText('JACK IN')).toBeDefined();
  });

  it('rejects short callsign under 3 characters', async () => {
    render(<LoginScreen />);
    const input = screen.getByLabelText('DECKER CALLSIGN');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'AB' } });
    });

    const submitBtn = screen.getByText('JACK IN');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText(/Callsign must be at least 3 characters/)).toBeDefined();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('rejects callsign with special characters', async () => {
    render(<LoginScreen />);
    const input = screen.getByLabelText('DECKER CALLSIGN');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'COOL$HACK' } });
    });

    const submitBtn = screen.getByText('JACK IN');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText(/Only letters, numbers, and underscores allowed/)).toBeDefined();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('allows selecting preset accounts', async () => {
    render(<LoginScreen />);
    const phreakBtn = screen.getByText('PHREAK');

    await act(async () => {
      fireEvent.click(phreakBtn);
    });

    const input = screen.getByLabelText('DECKER CALLSIGN') as HTMLInputElement;
    expect(input.value).toBe('PHREAK');
  });

  it('submits valid callsign and routes to /map', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      profile: { id: 'acc-1', handle: 'GIBSON', avatarUrl: '/icons/glyph-camera.svg', createdAt: Date.now() },
      settings: {
        masterMute: false,
        rookieAssist: true,
        reducedMotion: 'system',
        colorBlindMode: false,
        audio: { keystrokes: 50, ui: 50, ambient: 50 },
        dailySpendLimit: null,
      },
      wallet: {
        credits: 10000,
        coins: 25,
        inventory: {},
        equippedTools: [],
      },
    });

    render(<LoginScreen />);
    const input = screen.getByLabelText('DECKER CALLSIGN');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'GIBSON' } });
    });

    const submitBtn = screen.getByText('JACK IN');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(authService.login).toHaveBeenCalledWith('GIBSON', expect.any(String));
    expect(usePlayerStore.getState().handle).toBe('GIBSON');
    expect(mockPush).toHaveBeenCalledWith('/map');
  });
});
