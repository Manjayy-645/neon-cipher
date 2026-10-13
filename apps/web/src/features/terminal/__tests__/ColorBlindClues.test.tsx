import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import TerminalHistory from '../TerminalHistory';
import { useSettingsStore } from '@/stores/settings-store';

describe('Color-Blind Clue Mode in TerminalHistory', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      colorBlindMode: false,
    });
  });

  it('renders standard color+shape clues when colorBlindMode is false', () => {
    const { container } = render(
      <TerminalHistory
        guesses={[{ guess: '1234', pots: 1, pans: 1 }]}
        digits={4}
      />
    );

    // Standard pot has bg-accent
    const standardPots = container.querySelectorAll('.bg-accent.rounded-full');
    expect(standardPots.length).toBe(1);

    // Standard pan has border-money
    const standardPans = container.querySelectorAll('.border-money');
    expect(standardPans.length).toBe(1);
  });

  it('renders shape-only monochrome clues when colorBlindMode is true', () => {
    useSettingsStore.setState({
      colorBlindMode: true,
    });

    const { container } = render(
      <TerminalHistory
        guesses={[{ guess: '1234', pots: 2, pans: 1 }]}
        digits={4}
      />
    );

    // Shape-only pots have data-clue="pot-shape" and text content ■
    const shapePots = container.querySelectorAll('[data-clue="pot-shape"]');
    expect(shapePots.length).toBe(2);
    expect(shapePots[0].textContent?.trim()).toBe('■');

    // Shape-only pans have data-clue="pan-shape" and text content ○
    const shapePans = container.querySelectorAll('[data-clue="pan-shape"]');
    expect(shapePans.length).toBe(1);
    expect(shapePans[0].textContent?.trim()).toBe('○');

    // Miss has data-clue="miss-shape"
    const shapeMisses = container.querySelectorAll('[data-clue="miss-shape"]');
    expect(shapeMisses.length).toBe(1);
  });
});
