'use client';

import { useHydrated } from '@/lib/useHydrated';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Hud } from '@/features/hud/Hud';
import { Navigation } from '@/app/Navigation';
import { ONBOARDING_AVATARS, useOnboardingStore } from '../onboardingStore';
import { usePlayerStore } from '@/stores/player-store';
import { useDuelStore } from '@/stores/duel-store';
import { useOverlayStore } from '@/stores/overlay-store';

function isChromeAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (
    pathname === '/' ||
    pathname.startsWith('/terminal') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/splash') ||
    pathname.startsWith('/login')
  ) {
    return false;
  }
  return (
    pathname === '/map' ||
    pathname.startsWith('/market') ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/comms') ||
    pathname.startsWith('/coop') ||
    pathname.startsWith('/story') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/rig') ||
    pathname.startsWith('/duel') ||
    pathname.startsWith('/codemaker') ||
    pathname.startsWith('/settings')
  );
}

/** Timed consoles supply their own confirmed exit instead of global links. */
export function isFocusedConsoleRoute(pathname: string | null): boolean {
  return Boolean(pathname && (
    pathname.startsWith('/terminal/') || pathname === '/coop' ||
    pathname.startsWith('/coop/') || pathname.startsWith('/duel/match/')
  ));
}

export function ConditionalHud() {
  const mounted = useHydrated();
  const pathname = usePathname();
  const chromeVisible = useOnboardingStore((s) => s.chromeVisible());
  const callsign = useOnboardingStore((s) => s.callsign);
  const avatarId = useOnboardingStore((s) => s.avatarId);
  const activeDuel = useDuelStore((state) => state.activeSession?.status === 'active');
  const focusedFlow = useOverlayStore((state) => state.focusedFlows.length > 0);


  useEffect(() => {
    if (!callsign) return;

    const avatar = ONBOARDING_AVATARS.find((option) => option.id === avatarId);
    usePlayerStore.setState({
      handle: callsign,
      ...(avatar ? { avatarUrl: avatar.url } : {}),
    });
  }, [callsign, avatarId]);

  if (!mounted || isFocusedConsoleRoute(pathname) ||
    (pathname === '/duel' && activeDuel) ||
    (pathname === '/comms' && focusedFlow)) return null;
  const isVisible = chromeVisible || isChromeAppRoute(pathname);
  if (!isVisible) return null;

  return <Hud />;
}

export function ConditionalNav() {
  const mounted = useHydrated();
  const pathname = usePathname();
  const chromeVisible = useOnboardingStore((s) => s.chromeVisible());
  const activeDuel = useDuelStore((state) => state.activeSession?.status === 'active');
  const focusedFlow = useOverlayStore((state) => state.focusedFlows.length > 0);


  if (!mounted || isFocusedConsoleRoute(pathname) ||
    (pathname === '/duel' && activeDuel) ||
    (pathname === '/comms' && focusedFlow)) return null;
  const isVisible = chromeVisible || isChromeAppRoute(pathname);
  if (!isVisible) return null;

  return <Navigation />;
}
