'use client';

import { useHydrated } from '@/lib/useHydrated';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Hud } from '@/features/hud/Hud';
import { Navigation } from '@/app/Navigation';
import { ONBOARDING_AVATARS, useOnboardingStore } from '../onboardingStore';
import { usePlayerStore } from '@/stores/player-store';

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

export function ConditionalHud() {
  const mounted = useHydrated();
  const pathname = usePathname();
  const chromeVisible = useOnboardingStore((s) => s.chromeVisible());
  const callsign = useOnboardingStore((s) => s.callsign);
  const avatarId = useOnboardingStore((s) => s.avatarId);


  useEffect(() => {
    if (!callsign) return;

    const avatar = ONBOARDING_AVATARS.find((option) => option.id === avatarId);
    usePlayerStore.setState({
      handle: callsign,
      ...(avatar ? { avatarUrl: avatar.url } : {}),
    });
  }, [callsign, avatarId]);

  if (!mounted) return null;
  const isVisible = chromeVisible || isChromeAppRoute(pathname);
  if (!isVisible) return null;

  return <Hud />;
}

export function ConditionalNav() {
  const mounted = useHydrated();
  const pathname = usePathname();
  const chromeVisible = useOnboardingStore((s) => s.chromeVisible());


  if (!mounted) return null;
  const isVisible = chromeVisible || isChromeAppRoute(pathname);
  if (!isVisible) return null;

  return <Navigation />;
}
