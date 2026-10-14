'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Hud } from '@/features/hud/Hud';
import { Navigation } from '@/app/Navigation';
import { ONBOARDING_AVATARS, useOnboardingStore } from '../onboardingStore';
import { usePlayerStore } from '@/stores/player-store';

function isChromeAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/' || pathname.startsWith('/terminal') || pathname.startsWith('/onboarding')) {
    return false;
  }
  return (
    pathname === '/map' ||
    pathname.startsWith('/market') ||
    pathname.startsWith('/comms') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/rig') ||
    pathname.startsWith('/duel') ||
    pathname.startsWith('/settings')
  );
}

export function ConditionalHud() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const chromeVisible = useOnboardingStore((s) => s.chromeVisible());
  const callsign = useOnboardingStore((s) => s.callsign);
  const avatarId = useOnboardingStore((s) => s.avatarId);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const chromeVisible = useOnboardingStore((s) => s.chromeVisible());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const isVisible = chromeVisible || isChromeAppRoute(pathname);
  if (!isVisible) return null;

  return <Navigation />;
}
