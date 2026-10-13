import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BootSequence } from '../BootSequence';
import { authService } from '../../auth/authService';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../../auth/authService', () => ({
  authService: {
    getSession: vi.fn(),
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

describe('BootSequence Component (0.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial boot sequence headers and title', () => {
    render(<BootSequence autoRoute={false} />);
    expect(screen.getByText('NEON CIPHER')).toBeDefined();
    expect(screen.getByText('STREET CRACKING CONSOLE')).toBeDefined();
    expect(screen.getByLabelText('Skip boot sequence')).toBeDefined();
  });

  it('skips sequence immediately on tap to skip button', async () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} autoRoute={false} />);

    const skipBtn = screen.getByLabelText('Skip boot sequence');
    await act(async () => {
      fireEvent.click(skipBtn);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skips on Escape key press', async () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} autoRoute={false} />);

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('routes to /map if authenticated session exists', async () => {
    vi.mocked(authService.getSession).mockResolvedValueOnce({
      profile: { id: '1', handle: 'ZERO_COOL', avatarUrl: '', createdAt: Date.now() },
      settings: {} as any,
      wallet: {} as any,
    });

    render(<BootSequence autoRoute={true} />);
    const skipBtn = screen.getByLabelText('Skip boot sequence');

    await act(async () => {
      fireEvent.click(skipBtn);
    });

    // Wait for microtask resolution
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockPush).toHaveBeenCalledWith('/map');
  });

  it('routes to /login if session has no user', async () => {
    vi.mocked(authService.getSession).mockRejectedValueOnce(new Error('Unauthorized'));

    render(<BootSequence autoRoute={true} />);
    const skipBtn = screen.getByLabelText('Skip boot sequence');

    await act(async () => {
      fireEvent.click(skipBtn);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
