'use client';

import React, { useEffect, useState } from 'react';
import { NixDialogueTrigger } from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

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
      className="absolute inset-0 z-30 bg-ink/95 flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-2 max-w-xs">
        <div className="w-10 h-10 rounded-full bg-danger/20 border border-danger flex items-center justify-center text-danger text-lg font-bold animate-pulse">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-danger" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span className="font-data text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
        KEYPAD MATRIX SCRAMBLED // DIGITS REORDERED
      </span>
    </div>
  );
};

export interface ClockDrainAlertProps {
  active: boolean;
  seconds?: number;
}

export const ClockDrainAlert: React.FC<ClockDrainAlertProps> = ({ active, seconds = 10 }) => {
  if (!active) return null;

  return (
    <div
      data-testid="clock-drain-alert"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-danger/20 border border-danger/60 text-danger-text text-[10px] font-data font-bold uppercase tracking-wide animate-pulse"
    >
      <span>-{seconds}s</span>
      <span>CLOCK DRAINED</span>
    </div>
  );
};

export interface ShieldAlertProps {
  shieldActive: boolean;
  buffType?: 'firewall_patch' | 'mirror_daemon';
}

export const ShieldAlert: React.FC<ShieldAlertProps> = ({ shieldActive, buffType }) => {
  if (!shieldActive) return null;

  const isMirror = buffType === 'mirror_daemon';

  return (
    <div
      data-testid="shield-alert-indicator"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-data font-bold uppercase tracking-wide ${
        isMirror
          ? 'bg-accent/20 border-accent/60 text-accent-text'
          : 'bg-money/20 border-money/60 text-money-text'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isMirror ? 'bg-accent animate-pulse' : 'bg-money'}`} />
      <span>{isMirror ? 'MIRROR DAEMON ACTIVE' : 'FIREWALL ACTIVE'}</span>
      <span className="sr-only">{isMirror ? 'MIRROR DAEMON ACTIVE' : 'FIREWALL SHIELD ACTIVE'}</span>
    </div>
  );
};

export interface ParityJammerBannerProps {
  active: boolean;
  label?: 'EVEN' | 'ODD';
}

export const ParityJammerBanner: React.FC<ParityJammerBannerProps> = ({ active, label }) => {
  if (!active && !label) return null;

  return (
    <div
      data-testid="parity-jammer-banner"
      className="w-full bg-amber-500/15 border-y border-amber-500/40 px-3 py-1 flex items-center justify-between text-amber-900 text-xs font-data"
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="font-bold tracking-wider uppercase text-[10px] sm:text-[11px]">
          PARITY JAMMER ACTIVE {label ? `// CLUE READOUT: [${label}]` : '// EXACT CLUES OBSCURED'}
        </span>
      </div>
      <span className="text-[10px] text-ink-muted">EVEN = 0,2,4 | ODD = 1,3</span>
    </div>
  );
};

export interface KeyLatchBannerProps {
  latchedKeys?: string[];
}

export const KeyLatchBanner: React.FC<KeyLatchBannerProps> = ({ latchedKeys }) => {
  if (!latchedKeys || latchedKeys.length === 0) return null;

  return (
    <div
      data-testid="key-latch-banner"
      className="w-full bg-danger/15 border-y border-danger/40 px-3 py-1.5 flex items-center justify-between text-danger-text text-xs font-data"
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded bg-danger animate-pulse" />
        <span className="font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
          KEY LATCH VIRUS // LOCKED KEYS: [{latchedKeys.join(', ')}]
        </span>
      </div>
      <span className="text-[10px] text-ink-muted">Locks clear on guess submission</span>
    </div>
  );
};

export interface NixTacticalCalloutBannerProps {
  callout: NixDialogueTrigger | null;
  onDismiss: () => void;
}

export const NixTacticalCalloutBanner: React.FC<NixTacticalCalloutBannerProps> = ({
  callout,
  onDismiss,
}) => {
  if (!callout) return null;

  const severityClasses = {
    info: 'bg-panel-light border-accent text-ink',
    warning: 'bg-amber-500/10 border-amber-500 text-amber-950',
    alert: 'bg-danger/10 border-danger text-danger-text',
  }[callout.severity];

  return (
    <aside
      aria-label="Nix Tactical Callout"
      data-testid="nix-tactical-callout"
      className={`w-full border-b px-3 py-2 flex items-start justify-between gap-3 font-data transition-all ${severityClasses}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded border border-line bg-panel shrink-0 flex items-center justify-center font-bold text-xs text-ink font-mono">
          NX
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-[10px] font-bold tracking-widest uppercase text-accent-text flex items-center gap-1.5">
            <span>{callout.title}</span>
          </div>
          <p className="text-xs text-ink font-medium leading-snug">
            &ldquo;{callout.message}&rdquo;
          </p>
          <p className="text-[10px] text-ink-muted leading-tight font-mono">
            TACTICAL ADVICE: {callout.advice}
          </p>
        </div>
      </div>
      <Button
        variant="icon"
        compact
        onClick={onDismiss}
        aria-label="Dismiss Nix Callout"
        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-muted hover:text-ink shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </Button>
    </aside>
  );
};

export interface NixDuelOnboardingCardProps {
  guideId: 'guide-shared-feed' | 'guide-sabotage-deck';
  title: string;
  body: string;
  onDismiss: () => void;
}

export const NixDuelOnboardingCard: React.FC<NixDuelOnboardingCardProps> = ({
  guideId,
  title,
  body,
  onDismiss,
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      data-testid={`nix-onboarding-${guideId}`}
      className="w-full bg-panel border-b border-accent/40 p-3 flex items-start justify-between gap-3 select-none"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded border border-accent bg-panel-light shrink-0 flex items-center justify-center font-bold text-xs text-accent-text font-mono">
          NIX
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[10px] font-bold tracking-widest uppercase text-accent-text">
            {title}
          </div>
          <p className="text-xs text-ink leading-relaxed font-sans">
            {body}
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        onClick={onDismiss}
        aria-label={`Dismiss ${title}`}
        className="w-11 h-11 min-w-[44px] min-h-[44px] p-0 flex items-center justify-center shrink-0 text-ink text-xs font-bold"
      >
        GOT IT
      </Button>
    </div>
  );
};
