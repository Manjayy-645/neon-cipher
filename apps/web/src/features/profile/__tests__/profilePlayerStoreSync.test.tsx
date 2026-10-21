import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DeckerProfileCard } from '../DeckerProfileCard';
import { usePlayerStore } from '@/stores/player-store';
import { DeckerProfile } from '@neon-cipher/game-rules';

describe('Bug 1 Fix: Active Player Profile & Player-Store Sync', () => {
  const dummyBaseProfile: DeckerProfile = {
    handle: 'ZERO_COOL',
    avatarUrl: '/icons/glyph-camera.svg',
    rank: {
      title: 'Street Decker',
      level: 1,
      currentXp: 0,
      nextLevelXp: 1000,
    },
    stats: {
      totalHacks: 0,
      successfulBreaches: 0,
      failedBreaches: 0,
      winRatePercent: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCreditsEarned: 0,
      fastestBreachSeconds: 0,
      fewestGuesses: 0,
    },
    cosmetics: {
      activeBadge: 'badge-rookie',
      activeTerminalTheme: 'amber-crt',
      activeDeckFrame: 'frame-carbon',
      unlockedBadges: ['badge-rookie'],
      unlockedThemes: ['amber-crt'],
      unlockedFrames: ['frame-carbon'],
    },
  };

  beforeEach(() => {
    act(() => {
      usePlayerStore.getState().resetProfile('ZERO_COOL');
    });
  });

  it('fresh profile starts at LVL 1, 0 / 0 breaches, and $0 career earnings', () => {
    render(<DeckerProfileCard profile={dummyBaseProfile} onUpdateCosmetics={() => {}} />);

    expect(screen.getByText('ZERO_COOL')).toBeDefined();
    expect(screen.getByText('LVL 1')).toBeDefined();
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/0 won \/ 0 total/)).toBeDefined();
    expect(screen.getByText('$0')).toBeDefined();
  });

  it('displays new active handle QATEST instead of hardcoded ZERO_COOL', () => {
    act(() => {
      usePlayerStore.getState().setProfileStats({
        handle: 'QATEST',
        callsign: 'QATEST',
      });
    });

    render(<DeckerProfileCard profile={dummyBaseProfile} onUpdateCosmetics={() => {}} />);

    expect(screen.getByText('QATEST')).toBeDefined();
    expect(screen.queryByText('ZERO_COOL')).toBeNull();
    expect(screen.getByText('LVL 1')).toBeDefined();
    expect(screen.getByText(/0 won \/ 0 total/)).toBeDefined();
    expect(screen.getByText('$0')).toBeDefined();
  });

  it('increments accurately after winning a breach', () => {
    act(() => {
      usePlayerStore.getState().setProfileStats({
        handle: 'QATEST',
        callsign: 'QATEST',
      });
      // Player wins a breach with $650 payout
      usePlayerStore.getState().recordBreach(true, 650, 150);
    });

    render(<DeckerProfileCard profile={dummyBaseProfile} onUpdateCosmetics={() => {}} />);

    expect(screen.getByText('QATEST')).toBeDefined();
    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText(/1 won \/ 1 total/)).toBeDefined();
    expect(screen.getByText('$650')).toBeDefined();
    expect(screen.getByText(/150 \/ 1000 XP/)).toBeDefined();
  });

  it('increments total breaches and recalculates win rate on a failed breach', () => {
    act(() => {
      usePlayerStore.getState().setProfileStats({
        handle: 'QATEST',
        callsign: 'QATEST',
      });
      // 1 win ($1200), then 1 loss
      usePlayerStore.getState().recordBreach(true, 1200, 150);
      usePlayerStore.getState().recordBreach(false, 0, 25);
    });

    render(<DeckerProfileCard profile={dummyBaseProfile} onUpdateCosmetics={() => {}} />);

    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText(/1 won \/ 2 total/)).toBeDefined();
    expect(screen.getByText('$1,200')).toBeDefined();
    expect(screen.getByText(/175 \/ 1000 XP/)).toBeDefined();
  });
});
