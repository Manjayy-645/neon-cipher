'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StepId, STEPS } from '../steps';
import { useOnboardingStore } from '../onboardingStore';

export interface GateState {
  step: StepId;
  skipped: boolean;
  callsign: string | null;
  ch2Fails: number;
}

export function getOnboardingRedirect(
  pathname: string,
  state: GateState
): string | null {
  // Never redirect after done
  if (state.step === 'done') return null;

  // Never redirect when skipped with a profile
  if (state.skipped && state.callsign) return null;

  // After a failed Chapter 2 hack, let the player leave the terminal for the map.
  if (state.step === 'ch2.hack' && state.ch2Fails > 0 && pathname === '/map') {
    return null;
  }

  const targetRoute = STEPS[state.step]?.route;
  if (!targetRoute) return null;

  // If already on the target route, no redirect
  if (pathname === targetRoute) return null;

  const isOnboardingRoute =
    pathname === '/' ||
    pathname.startsWith('/onboarding/') ||
    pathname === '/terminal/tutorial-soda';

  // If player has no profile and route is not an onboarding route
  if (!state.callsign && !isOnboardingRoute) {
    return targetRoute;
  }

  // If route does not match current step's route while not skipped
  if (!state.skipped && pathname !== targetRoute) {
    return targetRoute;
  }

  return null;
}

export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { step, skipped, callsign, ch2Fails } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !pathname) return;

    const target = getOnboardingRedirect(pathname, { step, skipped, callsign, ch2Fails });
    if (target && target !== pathname) {
      router.replace(target);
    }
  }, [mounted, pathname, step, skipped, callsign, ch2Fails, router]);

  return null;
}
