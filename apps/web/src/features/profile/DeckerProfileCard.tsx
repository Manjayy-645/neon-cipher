'use client';

import React, { useState } from 'react';
import { DeckerProfile } from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

interface DeckerProfileCardProps {
  profile: DeckerProfile;
  onUpdateCosmetics: (cosmetics: Partial<DeckerProfile['cosmetics']>) => void;
}

export const DeckerProfileCard: React.FC<DeckerProfileCardProps> = ({
  profile,
  onUpdateCosmetics,
}) => {
  const { handle, avatarUrl, rank, stats, cosmetics } = profile;
  const [selectedTab, setSelectedTab] = useState<'stats' | 'cosmetics'>('stats');

  return (
    <div className="bg-panel-light border border-line rounded-md p-4 text-ink font-data shadow-card space-y-4">
      {/* Header with Avatar, Handle, Rank */}
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <div className="w-12 h-12 rounded-sm border border-line bg-panel flex items-center justify-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={handle} className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-title tracking-wide truncate">{handle}</h2>
            <span className="type-label bg-accent/15 text-accent-text border border-accent/30 px-1.5 py-0.5 rounded-sm text-[10px]">
              LVL {rank.level}
            </span>
          </div>
          <p className="text-xs text-ink-muted">{rank.title}</p>
        </div>
      </div>

      {/* XP Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-ink-muted">
          <span>PROGRESS TO LEVEL {rank.level + 1}</span>
          <span className="font-semibold text-ink">
            {rank.currentXp} / {rank.nextLevelXp} XP
          </span>
        </div>
        <div className="w-full h-2 bg-panel border border-line rounded-pill overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${Math.min(100, (rank.currentXp / rank.nextLevelXp) * 100)}%` }}
          />
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-line pb-2">
        <Button
          type="button"
          variant={selectedTab === 'stats' ? 'primary' : 'secondary'}
          compact
          onClick={() => setSelectedTab('stats')}
          className="flex-1"
        >
          Combat Stats
        </Button>
        <Button
          type="button"
          variant={selectedTab === 'cosmetics' ? 'primary' : 'secondary'}
          compact
          onClick={() => setSelectedTab('cosmetics')}
          className="flex-1"
        >
          Cosmetics
        </Button>
      </div>

      {/* Stats View */}
      {selectedTab === 'stats' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-panel border border-line p-2.5 rounded-sm">
              <span className="type-label text-[10px] block">WIN RATE</span>
              <span className="text-lg font-bold text-accent-text">{stats.winRatePercent}%</span>
              <span className="text-[10px] text-ink-muted block mt-0.5">
                {stats.successfulBreaches} won / {stats.totalHacks} total
              </span>
            </div>

            <div className="bg-panel border border-line p-2.5 rounded-sm">
              <span className="type-label text-[10px] block">WIN STREAK</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-ink">{stats.currentStreak}</span>
                <span className="text-xs text-ink-muted">(Best: {stats.bestStreak})</span>
              </div>
              <span className="text-[10px] text-ink-muted block mt-0.5">Current run</span>
            </div>

            <div className="bg-panel border border-line p-2.5 rounded-sm">
              <span className="type-label text-[10px] block">FASTEST BREACH</span>
              <span className="text-lg font-bold text-ink">{stats.fastestBreachSeconds}s</span>
              <span className="text-[10px] text-ink-muted block mt-0.5">Record solve clock</span>
            </div>

            <div className="bg-panel border border-line p-2.5 rounded-sm">
              <span className="type-label text-[10px] block">FEWEST GUESSES</span>
              <span className="text-lg font-bold text-money-text">{stats.fewestGuesses} probes</span>
              <span className="text-[10px] text-ink-muted block mt-0.5">Efficiency record</span>
            </div>
          </div>

          <div className="bg-panel border border-line p-2.5 rounded-sm flex justify-between items-center text-xs">
            <span className="type-label">CAREER EARNINGS</span>
            <span className="font-bold text-money-text text-sm">
              ${stats.totalCreditsEarned.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Cosmetics Customization View */}
      {selectedTab === 'cosmetics' && (
        <div className="space-y-4">
          {/* Active Terminal Theme */}
          <div className="space-y-1.5">
            <label className="type-label text-[10px]">TERMINAL COLOR MATRIX</label>
            <div className="grid grid-cols-3 gap-2">
              {cosmetics.unlockedThemes.map((theme) => {
                const isActive = cosmetics.activeTerminalTheme === theme;
                return (
                  <Button
                    key={theme}
                    type="button"
                    variant={isActive ? 'primary' : 'secondary'}
                    compact
                    onClick={() => onUpdateCosmetics({ activeTerminalTheme: theme })}
                    className="p-2 text-[11px]"
                  >
                    {theme.replace('-', ' ')}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Active Deck Chassis Frame */}
          <div className="space-y-1.5">
            <label className="type-label text-[10px]">CHASSIS CASING</label>
            <div className="grid grid-cols-3 gap-2">
              {cosmetics.unlockedFrames.map((frame) => {
                const isActive = cosmetics.activeDeckFrame === frame;
                return (
                  <Button
                    key={frame}
                    type="button"
                    variant={isActive ? 'primary' : 'secondary'}
                    compact
                    onClick={() => onUpdateCosmetics({ activeDeckFrame: frame })}
                    className="p-2 text-[11px]"
                  >
                    {frame.replace('frame-', '').replace('-', ' ')}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Decker Insignia Badge */}
          <div className="space-y-1.5">
            <label className="type-label text-[10px]">INSIGNIA BADGE</label>
            <div className="grid grid-cols-3 gap-2">
              {cosmetics.unlockedBadges.map((badge) => {
                const isActive = cosmetics.activeBadge === badge;
                return (
                  <Button
                    key={badge}
                    type="button"
                    variant={isActive ? 'primary' : 'secondary'}
                    compact
                    onClick={() => onUpdateCosmetics({ activeBadge: badge })}
                    className="p-2 text-[11px]"
                  >
                    {badge.replace('badge-', '').replace('-', ' ')}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
