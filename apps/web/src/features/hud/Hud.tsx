'use client';

import React from 'react';
import { usePlayerStore } from '../../stores/player-store';
import { useSettingsStore } from '../../stores/settings-store';
import { Button } from '@/components/ui/Button';

import { CITY_NAME } from '@neon-cipher/game-rules';

export { CITY_NAME };

export interface HudProps {
  cityName?: string;
}

export const Hud: React.FC<HudProps> = ({ cityName = CITY_NAME }) => {
  const { credits, coins, handle, avatarUrl, sectorHeat } = usePlayerStore();
  const { openDrawer } = useSettingsStore();

  const heatSegments = 8;
  const clampedHeat = Math.max(0, Math.min(100, Math.round(sectorHeat)));
  const activeSegments = Math.round((clampedHeat / 100) * heatSegments);

  return (
    <header className="min-h-[56px] h-[calc(56px_+_max(env(safe-area-inset-top),0.5rem))] pt-[max(env(safe-area-inset-top),0.5rem)] bg-panel border-b border-line px-3 grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center shrink-0 select-none gap-2 z-hud-bars relative">
      {/* Group 1: Avatar 36px, Handle (max ~90px, ellipsis) with Credits under it, and Coins with 8px gap */}
      <div className="flex items-center min-w-0">
        <Button
          variant="ghost"
          compact
          onClick={openDrawer}
          aria-label="Open settings"
          className="flex items-center gap-1.5 shrink-0 text-left border-none bg-transparent hover:bg-transparent p-0 h-auto min-h-[44px]"
        >
          <div className="w-[36px] h-[36px] rounded-[6px] border border-line bg-panel-light flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl && avatarUrl !== '/icons/glyph-camera.svg' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={handle || 'Decker Avatar'} className="w-full h-full object-cover" />
            ) : (
              <span
                data-testid="avatar-fallback"
                className="font-data text-[13px] font-bold text-ink-muted uppercase select-none"
              >
                {handle ? handle.charAt(0) : '?'}
              </span>
            )}
          </div>
          <div className="flex flex-col justify-center leading-none min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span
                title={handle}
                className="font-data text-[12px] font-bold tracking-[1px] text-ink uppercase truncate max-w-[90px]"
              >
                {handle}
              </span>
              <svg
                className="w-3 h-3 text-ink-muted/70 shrink-0 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span className="font-data text-[12px] font-semibold text-money-text tabular-nums mt-0.5 leading-tight">
              ${credits.toLocaleString()}
            </span>
          </div>
        </Button>

        {/* 8px gap between credits and coins */}
        <div
          className="ml-2 flex items-center gap-1 shrink-0"
          title={`${coins.toLocaleString()} coins`}
        >
          <svg
            className="w-[16px] h-[16px] text-ink shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 4.75v6.5M6.2 6.5h2.6a1 1 0 0 1 0 2H7.2a1 1 0 0 0 0 2h2.6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-data text-[12px] text-ink font-semibold tabular-nums leading-none">
            {coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Hairline Divider 1 */}
      <div className="w-[1px] h-[24px] bg-line shrink-0" aria-hidden="true" />

      {/* Group 2 (Center): City Name (serif, ellipsis) */}
      <div className="min-w-0 text-center px-1">
        <span
          title={cityName}
          className="font-heading text-[18px] sm:text-[19px] tracking-[0.5px] text-ink truncate block leading-none"
        >
          {cityName}
        </span>
      </div>

      {/* Hairline Divider 2 */}
      <div className="w-[1px] h-[24px] bg-line shrink-0" aria-hidden="true" />

      {/* Group 3 (Right): Sector Heat (12px right padding via container pr-3) */}
      <div
        className="flex flex-col items-end shrink-0 justify-center"
        role="meter"
        aria-label={`Sector heat ${clampedHeat} percent`}
        aria-valuenow={clampedHeat}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="font-data text-[11px] uppercase tracking-[1px] text-ink-muted leading-tight">
          SECTOR HEAT
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 leading-none">
          <div className="flex gap-[2px]" aria-hidden="true">
            {Array.from({ length: heatSegments }).map((_, i) => (
              <div
                key={i}
                className={`w-[5px] h-[7px] rounded-[1px] ${
                  i < activeSegments ? 'bg-danger' : 'bg-heat-track'
                }`}
              />
            ))}
          </div>
          <span className="font-data text-[11px] font-semibold text-danger-text tabular-nums leading-none">
            {clampedHeat}%
          </span>
        </div>
      </div>
    </header>
  );
};
