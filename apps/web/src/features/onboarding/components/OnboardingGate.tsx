'use client';

import { useHydrated } from '@/lib/useHydrated';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StepId, STEPS } from '../steps';
import { useOnboardingStore } from '../onboardingStore';
import { PendingQuestNotification } from './PendingQuestNotification';

export interface GateState {
  step: StepId;
  skipped: boolean;
  callsign: string | null;
  ch2Fails: number;
}

export function shouldExitGuidedChapterHack(pathname: string, state: GateState): boolean {
  return (
    state.step === 'ch2.hack' &&
    Boolean(state.callsign) &&
    pathname !== STEPS['ch2.hack'].route
  );
}

export function getOnboardingRedirect(
  pathname: string,
  state: GateState
): string | null {
  // Never redirect after done
  if (state.step === 'done') return null;

  // Never redirect when skipped with a profile
  if (state.skipped && state.callsign) return null;

  // Once Chapter 2's guided hack has started, navigating elsewhere exits onboarding.
  if (shouldExitGuidedChapterHack(pathname, state)) {
    return null;
  }

  // Any incomplete or pending task should come up as a pending quest notification,
  // NOT a force redirect.
  // The only redirect is if a user has not started onboarding at all (step === 'splash' and no callsign)
  // and attempts to access protected routes without initializing.
  if (state.step === 'splash' && !state.callsign) {
    const isOnboardingRoute =
      pathname === '/' ||
      pathname.startsWith('/onboarding/') ||
      pathname === '/terminal/tutorial-soda';
    if (!isOnboardingRoute) {
      return '/';
    }
  }

  // Incomplete / pending tasks do NOT force redirect
  return null;
}

export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { step, skipped, callsign, ch2Fails } = useOnboardingStore();
  const mounted = useHydrated();


  useEffect(() => {
    if (!mounted || !pathname) return;

    const state = { step, skipped, callsign, ch2Fails };
    const target = getOnboardingRedirect(pathname, state);
    if (target && target !== pathname) {
      router.replace(target);
    }
  }, [mounted, pathname, step, skipped, callsign, ch2Fails, router]);

  if (!mounted) return null;
  return <PendingQuestNotification />;
}
