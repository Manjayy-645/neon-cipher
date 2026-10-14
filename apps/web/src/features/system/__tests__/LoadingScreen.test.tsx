import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LoadingScreen } from '../LoadingScreen';
import { useSystemStore } from '@/stores/system-store';

vi.mock('@/lib/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => true,
}));

describe('LoadingScreen', () => {
  beforeEach(() => {
    useSystemStore.setState({
      globalLoading: false,
      loadingMessage: 'INITIALIZING SUB-GRID LINK...',
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays hidden when loading is inactive', () => {
    const { container } = render(<LoadingScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('shows an indeterminate progress bar without motion for reduced-motion users', () => {
    useSystemStore.setState({ globalLoading: true });
    render(<LoadingScreen />);

    expect(screen.getByRole('progressbar', { name: 'Loading game' })).toBeDefined();
    expect(screen.getByText('Synchronizing with the city grid.')).toBeDefined();
    expect(document.querySelector('.loading-indeterminate-motion')).toBeNull();
  });

  it('explains a long wait after five seconds', () => {
    useSystemStore.setState({ globalLoading: true });
    render(<LoadingScreen />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('This is taking longer than usual. Your saved progress is safe.')).toBeDefined();
  });
});
