'use client';

import React, { useEffect, useState } from 'react';
import { Hud } from '@/features/hud/Hud';
import { Navigation } from '@/app/Navigation';
import { ONBOARDING_AVATARS, useOnboardingStore } from '../onboardingStore';
import { usePlayerStore } from '@/stores/player-store';

export function ConditionalHud() {
  const [mounted, setMounted] = useState(false);
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

  if (!mounted || !chromeVisible) return null;
  return <Hud />;
}

export function ConditionalNav() {
  const [mounted, setMounted] = useState(false);
  const chromeVisible = useOnboardingStore((s) => s.chromeVisible());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !chromeVisible) return null;
  return <Navigation />;
}
