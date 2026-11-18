import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TerminalHeader } from '../components/TerminalHeader';
import { BreachBanner } from '../components/BreachBanner';
import { ClueMarks } from '../components/ClueMarks';
import { useSettingsStore } from '@/stores/settings-store';
import { getTutorialClueLines } from '@/features/onboarding/components/TourDirector';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/terminal/tutorial-soda' }));

beforeEach(() => useSettingsStore.setState({ colorBlindMode: false }));

describe('terminal clarity and accessible clues', () => {
  it('keeps the player-facing name separate from internal references and all header actions available', () => {
    const pause = vi.fn();
    const help = vi.fn();
    const exit = vi.fn();
    render(<TerminalHeader nodeName="Market Register" nodeId="n4"
      config={{ digits: 4, attempts: 8, timerSeconds: 120, tier: 1, allowDuplicates: false, ice: 'None' }}
      usedAttempts={2} elapsedSeconds={10} onOpenLegend={help} onExit={exit} onTogglePause={pause} />);
    expect(screen.getByRole('heading', { name: 'Market Register' })).toBeInTheDocument();
    expect(screen.getByText('2 of 8 attempts used')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Clue Legend' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause breach timer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exit tutorial' }));
    expect(help).toHaveBeenCalledOnce();
    expect(pause).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledOnce();
  });

  it('uses monochrome filled dot, ring, and dash for the active terminal in shape-only mode', () => {
    useSettingsStore.setState({ colorBlindMode: true });
    const { container } = render(<ClueMarks pans={1} pots={1} length={3} />);
    expect(container.querySelector('[data-clue-mode="shape-only"]')).toBeInTheDocument();
    expect(container.querySelector('[data-clue="pan"]')).toHaveClass('bg-terminal-ink');
    expect(container.querySelector('[data-clue="pot"]')).toHaveClass('border-terminal-ink');
    expect(container.querySelector('[data-clue="miss"]')).toBeInTheDocument();
    expect(container.querySelector('.bg-terminal-phosphor')).toBeNull();
  });

  it('reconciles only confirmed payout, earned bonus and actual campaign ledger credit', () => {
    render(<BreachBanner status="won" payout={75} onReturnToMap={vi.fn()} receipt={{
      bonusCredits: 10, campaignLedgerCredit: 2500, debtReduced: 2500,
      remainingDebt: 7500, confirmedBalance: 2685,
    }} />);
    const receipt = screen.getByRole('region', { name: 'Confirmed breach receipt' });
    expect(receipt).toHaveTextContent('Confirmed credits added+$2585');
    expect(receipt).toHaveTextContent('Current wallet balance$2,685');
    expect(receipt).toHaveTextContent('Debt reduced separately−$2500');
    expect(receipt).toHaveTextContent('not an additional wallet award');
    expect(receipt).not.toHaveTextContent('650');
  });

  it('explains a zero-match guess accurately instead of claiming an exact match is present', () => {
    const lines = getTutorialClueLines({ pans: 0, pots: 0 });
    expect(lines[0]).toBe('No matches this time. None of those digits are in the code.');
    expect(lines.join(' ')).toContain('total counts');
    expect(getTutorialClueLines({ pans: 1, pots: 2 })[0]).toBe('Your result: 1 exact match and 2 right digits in the wrong position.');
  });
});
