'use client';

import { useHydrated } from '@/lib/useHydrated';
import { useResettableState } from '@/lib/useResettableState';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { BottomDrawer } from '@/components/ui/BottomDrawer';
import { useOnboardingStore, ONBOARDING_AVATARS } from '../onboardingStore';
import { STEPS, TUTORIAL } from '../steps';
import { track } from '../analytics';
import { campaignService } from '@/features/story/campaignService';
import { useCampaignStore } from '@/stores/campaign-store';
import { usePlayerStore } from '@/stores/player-store';

const BOOT_LINE = 'DECK INITIALIZATION: SECURE PROTOCOL ACTIVE';

export function SplashScreen() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { step, callsign, advance, reset } = useOnboardingStore();

  const [displayedBootLine, setDisplayedBootLine] = useResettableState(shouldReduceMotion ? BOOT_LINE : '', String(shouldReduceMotion));
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const mounted = useHydrated();

  useEffect(() => {
    if (typeof router.prefetch === 'function') {
      router.prefetch('/terminal/tutorial-soda');
      router.prefetch('/map');
    }
  }, [router]);

  // Typewriter effect (max 1.2s, instant under reduced motion)
  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    let currentIndex = 0;
    const intervalMs = Math.floor(1200 / BOOT_LINE.length); // ~27ms per char -> ~1.16s
    const timer = setInterval(() => {
      currentIndex++;
      setDisplayedBootLine(BOOT_LINE.slice(0, currentIndex));
      if (currentIndex >= BOOT_LINE.length) {
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [shouldReduceMotion, setDisplayedBootLine]);

  const handleStart = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    track('splash_start');
    advance('cold.intro');
    router.push('/terminal/tutorial-soda');
  };

  const handleKnowGame = () => {
    useOnboardingStore.setState({ skipExplanations: true });
    track('skip_explanations');
    advance('cold.intro');
    router.push('/terminal/tutorial-soda');
  };

  const handleSkipTutorialDirectly = () => {
    track('splash_skip_tutorial');
    const { callsign, setProfile, guestId } = useOnboardingStore.getState();
    if (!callsign) {
      const fallbackCallsign = 'DECKER_' + guestId.slice(0, 4).toUpperCase();
      setProfile(fallbackCallsign, 'avatar-nx');
      usePlayerStore.setState({
        handle: fallbackCallsign,
        avatarUrl: ONBOARDING_AVATARS[0].url,
      });
    }
    useOnboardingStore.getState().skip();
    campaignService.completeChapter(1).catch(() => {});
    useCampaignStore.getState().completeChapter('chapter-1').catch(() => {});
    useOnboardingStore.getState().crackNode(TUTORIAL.mapNodeId, TUTORIAL.cooldownMs);
    router.push('/map');
  };

  const handleContinue = () => {
    const targetRoute = step === 'done' ? '/map' : STEPS[step]?.route ?? '/map';
    router.push(targetRoute);
  };

  const handleConfirmReset = () => {
    reset();
    setConfirmResetOpen(false);
  };

  const hasProfile = mounted && Boolean(callsign);

  return (
    <div
      className="flex-1 w-full bg-panel text-ink flex flex-col justify-between p-6 select-none relative overflow-y-auto"
      data-surface="panel"
    >
      {/* Top Header / Branding */}
      <div className="flex flex-col items-center pt-12 sm:pt-16 text-center">
        <div className="w-12 h-12 rounded-[12px] border border-line bg-panel-light flex items-center justify-center mb-6 shadow-sm">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 15h10M7 9h4" />
          </svg>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-wider text-ink leading-tight">
          NEON CIPHER
        </h1>
        <p className="font-data text-xs text-ink-muted uppercase tracking-[2px] mt-2">
          Deduce the secret code before the city traces you.
        </p>
      </div>

      {/* Center Console Line */}
      <div className="my-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-panel-light border border-line">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span className="font-data text-xs text-accent-text tracking-wider">
            {displayedBootLine}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-3 pb-6">
        {hasProfile ? (
          <>
            <Button
              variant="primary"
              size="full"
              onClick={handleContinue}
              data-testid="splash-continue-btn"
            >
              CONTINUE ({callsign})
            </Button>
            <Button
              variant="ghost"
              size="full"
              onClick={() => setConfirmResetOpen(true)}
              data-testid="splash-new-game-btn"
            >
              NEW GAME
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              size="full"
              onClick={handleStart}
              data-testid="splash-start-btn"
              autoFocus
              aria-describedby="learn-outcome"
            >
              LEARN TO CRACK CODES
            </Button>
            <p id="learn-outcome" className="text-xs text-ink-muted text-center">A guided practice breach with Nix. About two minutes.</p>
            <Button
              variant="ghost"
              size="full"
              onClick={handleKnowGame}
              data-testid="splash-know-game-btn"
              aria-describedby="check-outcome"
            >
              QUICK SKILLS CHECK
            </Button>
            <p id="check-outcome" className="text-xs text-ink-muted text-center">The same practice lock, with explanations turned off.</p>
            <Button
              variant="ghost"
              size="full"
              onClick={handleSkipTutorialDirectly}
              data-testid="splash-skip-tutorial-btn"
              aria-describedby="city-outcome"
            >
              ENTER THE CITY
            </Button>
            <p id="city-outcome" className="text-xs text-ink-muted text-center">Skip the lesson, mark Chapter 1 complete, and continue to Chapter 2.</p>
          </>
        )}
      </div>

      {/* Reset Confirmation Drawer */}
      <BottomDrawer
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="START NEW GAME?"
      footer={(
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="danger"
              size="full"
              onClick={handleConfirmReset}
            >
              RESET AND RESTART
            </Button>
            <Button
              variant="ghost"
              size="full"
              onClick={() => setConfirmResetOpen(false)}
            >
              CANCEL
            </Button>
          </div>
      )}
      >
        <div className="flex flex-col gap-4">
          <p className="font-data text-xs text-ink-muted leading-relaxed">
            Starting a new game will reset all progress on this device and return to Chapter 1.
          </p>

        </div>
      </BottomDrawer>
    </div>
  );
}
