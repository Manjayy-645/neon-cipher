'use client';

import React, { useEffect, useState } from 'react';

export interface StaticHistoryOverlayProps {
  staticExpiry?: number;
  onExpire?: () => void;
}

export const StaticHistoryOverlay: React.FC<StaticHistoryOverlayProps> = ({
  staticExpiry,
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!staticExpiry) return 0;
    return Math.max(0, Math.ceil((staticExpiry - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!staticExpiry) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const rem = Math.max(0, Math.ceil((staticExpiry - Date.now()) / 1000));
      setSecondsLeft(rem);
      if (rem <= 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [staticExpiry, onExpire]);

  if (secondsLeft <= 0) return null;

  return (
    <div
      data-testid="static-history-overlay"
      className="absolute inset-0 z-30 bg-ink/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden"
    >
      {/* Scanline / noise overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-2 max-w-xs">
        <div className="w-10 h-10 rounded-full bg-danger/20 border border-danger flex items-center justify-center text-danger text-lg font-bold animate-pulse">
          ⚡
        </div>
        <div className="font-data text-xs font-bold uppercase tracking-widest text-danger-text">
          STATIC BLACKOUT // BLACKOUT PING ACTIVE
        </div>
        <p className="font-data text-[11px] text-panel-light/80 leading-snug">
          CLUE FEED INTERFERENCE — CLUES OBSCURED
        </p>
        <div
          data-testid="static-timer"
          className="font-data text-xl font-black text-danger tracking-widest mt-1 px-3 py-1 bg-panel-dark/80 rounded border border-danger/40"
        >
          {secondsLeft}s
        </div>
      </div>
    </div>
  );
};

export interface ScrambleKeypadBannerProps {
  active: boolean;
}

export const ScrambleKeypadBanner: React.FC<ScrambleKeypadBannerProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div
      data-testid="scramble-keypad-banner"
      className="w-full bg-danger/20 border-y border-danger/60 px-3 py-1 flex items-center justify-center gap-2 text-danger-text text-center select-none animate-pulse"
    >
      <span className="font-data text-xs font-bold">⚠️</span>
      <span className="font-data text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
        KEYPAD MATRIX SCRAMBLED // DIGITS REORDERED
      </span>
    </div>
  );
};

export interface ClockDrainAlertProps {
  active: boolean;
}

export const ClockDrainAlert: React.FC<ClockDrainAlertProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div
      data-testid="clock-drain-alert"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-danger/20 border border-danger/60 text-danger text-[10px] font-data font-bold uppercase tracking-wide animate-pulse"
    >
      <span>-10s</span>
      <span>CLOCK DRAINED</span>
    </div>
  );
};

export interface ShieldAlertProps {
  shieldActive: boolean;
}

export const ShieldAlert: React.FC<ShieldAlertProps> = ({ shieldActive }) => {
  if (!shieldActive) return null;

  return (
    <div
      data-testid="shield-alert-indicator"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-money/20 border border-money/60 text-money text-[10px] font-data font-bold uppercase tracking-wide"
    >
      <span className="w-2 h-2 rounded-full bg-money" />
      <span>FIREWALL ACTIVE</span>
      <span className="sr-only">FIREWALL SHIELD ACTIVE</span>
    </div>
  );
};
