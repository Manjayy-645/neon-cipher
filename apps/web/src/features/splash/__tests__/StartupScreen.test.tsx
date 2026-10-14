import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StartupScreen } from '../StartupScreen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/audio', () => ({
  soundFx: {
    playKeystroke: vi.fn(),
    playUiBeep: vi.fn(),
    playSuccess: vi.fn(),
    playWarning: vi.fn(),
  },
}));

describe('StartupScreen', () => {
  it('shows the animated boot sequence before opening the starter screen', async () => {
    render(<StartupScreen />);

    expect(screen.getByText('STREET CRACKING CONSOLE')).toBeInTheDocument();
    expect(screen.getByLabelText('Skip boot sequence')).toBeInTheDocument();
    expect(screen.queryByTestId('splash-start-btn')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Skip boot sequence'));

    expect(await screen.findByTestId('splash-start-btn')).toBeInTheDocument();
  });
});
