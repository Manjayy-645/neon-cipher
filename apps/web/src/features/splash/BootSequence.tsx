'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { authService } from '../auth/authService';
import { soundFx } from '@/lib/audio';
import { Button } from '@/components/ui/Button';

interface BootSequenceProps {
  onComplete?: () => void;
  autoRoute?: boolean;
}

const BOOT_LOGS = [
  '[LOW_MERIDIAN_NET // BIOS v4.19.0]',
  'INITIALIZING CYBERDECK HARDWARE BUS... OK',
  'VERIFYING RF COUPLER & SECURE ENCLAVE... OK',
  'PROBING CARRIER FREQUENCY: 433.92 MHz... LOCKED',
  'SCANNING DISTRICT NODES... 15 FOUND',
  'CHECKING ICE TRACE RESIDUALS... 0% DETECTED',
  'SYNCHRONIZING WITH SUB-GRID 07...',
  'SIGNAL ESTABLISHED.',
];

export function BootSequence({ onComplete, autoRoute = true }: BootSequenceProps) {
  const router = useRouter();
  const prefersReduced = usePrefersReducedMotion();

  const [visibleLines, setVisibleLines] = useState<number>(prefersReduced ? BOOT_LOGS.length : 1);
  const [isDone, setIsDone] = useState<boolean>(prefersReduced);
  const [progress, setProgress] = useState<number>(prefersReduced ? 100 : 15);
  const hasFinishedRef = useRef(false);

  const finishBoot = useCallback(async () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsDone(true);
    setProgress(100);
    soundFx.playSuccess();

    if (onComplete) {
      onComplete();
      return;
    }

    if (autoRoute) {
      try {
        const session = await authService.getSession();
        if (session && session.profile && session.profile.handle) {
          router.push('/map');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    }
  }, [onComplete, autoRoute, router]);

  // Log ticker animation
  useEffect(() => {
    if (prefersReduced) {
      finishBoot();
      return;
    }

    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        const next = prev + 1;
        soundFx.playKeystroke();
        setProgress(Math.min(100, Math.round((next / BOOT_LOGS.length) * 100)));
        if (next >= BOOT_LOGS.length) {
          clearInterval(interval);
          setTimeout(() => {
            finishBoot();
          }, 400);
        }
        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [prefersReduced, finishBoot]);

  // Keyboard shortcut listener to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finishBoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishBoot]);

  return (
    <div
      className="scene-ground scene-arrive fixed inset-0 z-50 text-ink flex flex-col justify-between p-5 sm:p-6 select-none font-data overflow-hidden"
      onClick={() => finishBoot()}
    >
      {/* Top Header & Skip Button */}
      <div className="flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-[11px] font-data tracking-widest text-ink-muted uppercase">
            PORT 433 // RF-ACTIVE
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          compact
          onClick={(e) => {
            e.stopPropagation();
            finishBoot();
          }}
          aria-label="Skip boot sequence"
        >
          [TAP TO SKIP]
        </Button>
      </div>

      {/* Center Hero */}
      <div className="my-auto z-10 max-w-[420px] w-full mx-auto space-y-5">
        <div>
          <span className="type-label text-[11px] text-accent-text tracking-[2px] uppercase block mb-1">
            LOW MERIDIAN FIELD NETWORK
          </span>
          <h1 className="font-heading text-4xl text-ink tracking-wide">
            NEON CIPHER
          </h1>
          <p className="font-data text-xs text-ink-muted tracking-widest uppercase mt-1 flex items-center gap-1.5 flex-wrap">
            <span>STREET CRACKING CONSOLE</span>
            <span>//</span>
            <span>CITY FIELD GUIDE</span>
          </p>
        </div>

        {/* Ticker logs */}
        <div className="bg-panel border border-line p-4 rounded-sm space-y-1.5 min-h-[170px] font-data text-xs">
          {BOOT_LOGS.slice(0, visibleLines).map((line, idx) => (
            <div
              key={idx}
              className={`leading-tight flex items-center gap-2 ${
                idx === visibleLines - 1 ? 'text-accent font-bold' : 'text-ink-muted'
              }`}
            >
              <span className="text-[10px] text-ink-muted opacity-60">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span>{line}</span>
            </div>
          ))}
          {!isDone && (
            <div className="inline-block w-2 h-4 bg-accent animate-pulse ml-6" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-data text-ink-muted">
            <span>SYSTEM LINK INTEGRITY</span>
            <span>{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="System link integrity"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="w-full h-1.5 bg-panel rounded-full overflow-hidden border border-line"
          >
            <div
              className={`h-full w-full bg-accent origin-left ${
                prefersReduced ? 'transition-none' : 'transition-transform duration-150'
              }`}
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="text-center z-10 shrink-0">
        <span className="text-[10px] font-data text-ink-muted tracking-widest uppercase opacity-70">
          PRESS ANY KEY OR TAP ANYWHERE TO ENTER
        </span>
      </div>
    </div>
  );
}
