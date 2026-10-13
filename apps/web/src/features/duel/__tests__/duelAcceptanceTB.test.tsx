import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DuelMatchPage from '@/app/duel/match/page';
import { duelFeed, FeedEvent } from '../duelFeed';
import { useSettingsStore } from '@/stores/settings-store';
import {
  pickConsistentGuess,
  provenDeadDigits,
  scoreGuess,
  GuessRecord,
} from '@neon-cipher/game-rules';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'tier' ? '2' : null),
  }),
}));

describe('TASK T-B: Duel feed with opponent guesses and mock AI rival', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSettingsStore.setState({ rookieAssist: true });
  });

  describe('Pure Game Rules: pickConsistentGuess & dead digit aggregation', () => {
    it('verifies AI rival makes guesses consistent with all previous public clues', () => {
      const history: GuessRecord[] = [
        { guess: [1, 2, 3, 4], pots: 1, pans: 1 },
        { guess: [5, 6, 7, 8], pots: 0, pans: 0 },
      ];

      // AI generates candidate consistent with history
      const aiCandidate = pickConsistentGuess(
        history,
        { length: 4, allowDuplicates: false },
        Math.random
      );

      expect(aiCandidate).not.toBeNull();
      // Candidate must not contain dead digits 5, 6, 7, 8
      aiCandidate!.forEach((d) => {
        expect([5, 6, 7, 8]).not.toContain(d);
      });

      // Scoring candidate against 1234 must yield exactly 1 pot and 1 pan
      const testScore = scoreGuess(aiCandidate!, [1, 2, 3, 4]);
      expect(testScore.pots).toBe(1);
      expect(testScore.pans).toBe(1);
    });

    it('unifies keypad elimination across BOTH your and rival history', () => {
      const yourHistory: GuessRecord[] = [
        { guess: [1, 2, 3, 4], pots: 1, pans: 0 },
      ];
      const rivalHistory: GuessRecord[] = [
        { guess: [5, 6, 7, 8], pots: 0, pans: 0 },
      ];

      const combinedDead = provenDeadDigits([...yourHistory, ...rivalHistory]);
      expect(combinedDead.has(5)).toBe(true);
      expect(combinedDead.has(6)).toBe(true);
      expect(combinedDead.has(7)).toBe(true);
      expect(combinedDead.has(8)).toBe(true);
      expect(combinedDead.has(1)).toBe(false);
    });
  });

  describe('Hidden Guess Redaction & Network Safety', () => {
    it('redacts hidden guesses so digits are null in response and never appear in DOM', async () => {
      const mockEvents: FeedEvent[] = [
        {
          id: 'e-1',
          who: 'rival',
          guess: null, // REDACTED on server
          pots: null,
          pans: null,
          hidden: true,
          t: 3000,
        },
      ];

      vi.spyOn(duelFeed, 'startDuel').mockResolvedValue({
        duelId: 'test-duel-1',
        config: {
          length: 4,
          allowDuplicates: false,
          attempts: 7,
          timerSeconds: 60,
          tier: 2,
        },
        startedAt: Date.now(),
        rival: { handle: 'NULL_BYTE' },
      });

      vi.spyOn(duelFeed, 'subscribe').mockImplementation((_id, onUpdate) => {
        onUpdate({
          events: mockEvents,
          status: 'playing',
          // secret is NOT included while playing
        });
        return () => {};
      });

      render(<DuelMatchPage />);

      // Masked row appears
      expect((await screen.findAllByText('HIDDEN')).length).toBeGreaterThan(0);
      expect(screen.getAllByText('??').length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/Rival made a hidden guess/i).length).toBeGreaterThan(0);

      // Ensure no leaked digits in the hidden row
      const hiddenItem = screen.getAllByLabelText(/Rival made a hidden guess/i)[0];
      expect(hiddenItem.textContent).not.toMatch(/[0-9]{4}/);
    });
  });

  describe('Duel Feed Interactivity & UI Behavior', () => {
    it('renders rival status strip, feed switcher with unseen badge, and keypad', async () => {
      let subscriberCallback: ((update: any) => void) | null = null;

      vi.spyOn(duelFeed, 'startDuel').mockResolvedValue({
        duelId: 'test-duel-2',
        config: {
          length: 4,
          allowDuplicates: false,
          attempts: 7,
          timerSeconds: 60,
          tier: 2,
        },
        startedAt: Date.now(),
        rival: { handle: 'NULL_BYTE' },
      });

      vi.spyOn(duelFeed, 'subscribe').mockImplementation((_id, onUpdate) => {
        subscriberCallback = onUpdate;
        onUpdate({
          events: [],
          status: 'playing',
        });
        return () => {};
      });

      render(<DuelMatchPage />);

      // Status strip & handle
      expect(await screen.findByText('RIVAL: NULL_BYTE')).toBeInTheDocument();
      expect(screen.getByText(/THINKING/i)).toBeInTheDocument();

      // Keypad pinned at bottom
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Guess/i })).toBeInTheDocument();

      // Switch to YOU tab
      const youTab = screen.getByRole('tab', { name: 'YOU' });
      fireEvent.click(youTab);
      expect(youTab).toHaveAttribute('aria-selected', 'true');

      // Keypad remains visible and pinned
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();

      // Rival produces a new guess while viewing YOU tab
      subscriberCallback!({
        events: [
          {
            id: 'e-rival-1',
            who: 'rival',
            guess: [5, 6, 7, 8],
            pots: 2,
            pans: 1,
            hidden: false,
            t: 4500,
          },
        ],
        status: 'playing',
      });

      // Rival tab displays unseen badge count
      await waitFor(() => {
        expect(screen.getByLabelText('1 new rival guesses')).toBeInTheDocument();
      });

      // Switching to RIVAL tab clears the unseen badge
      const rivalTab = screen.getByRole('tab', { name: /RIVAL/i });
      fireEvent.click(rivalTab);
      await waitFor(() => {
        expect(screen.queryByLabelText('1 new rival guesses')).not.toBeInTheDocument();
      });
    });

    it('shows DuelEndBanner and revealed secret upon winning or losing', async () => {
      vi.spyOn(duelFeed, 'startDuel').mockResolvedValue({
        duelId: 'test-duel-3',
        config: {
          length: 4,
          allowDuplicates: false,
          attempts: 7,
          timerSeconds: 60,
          tier: 2,
        },
        startedAt: Date.now(),
        rival: { handle: 'NULL_BYTE' },
      });

      vi.spyOn(duelFeed, 'subscribe').mockImplementation((_id, onUpdate) => {
        onUpdate({
          events: [
            {
              id: 'e-win',
              who: 'you',
              guess: [1, 2, 3, 4],
              pots: 4,
              pans: 0,
              hidden: false,
              t: 12000,
            },
          ],
          status: 'won',
          secret: '1234', // Only sent on finish
        });
        return () => {};
      });

      render(<DuelMatchPage />);

      expect(await screen.findByText('YOU WIN')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
      expect(screen.getByText('RETURN TO LOBBY')).toBeInTheDocument();
    });
  });
});
