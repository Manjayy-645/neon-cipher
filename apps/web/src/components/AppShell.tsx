'use client';

import React, { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { ConnectionBanner } from '@/features/system/ConnectionBanner';
import { OfflineNotice } from '@/features/system/OfflineNotice';
import { LoadingScreen } from '@/features/system/LoadingScreen';
import { SettingsDrawer } from '@/features/settings/SettingsDrawer';
import { DevMenu } from '@/features/dev/DevMenu';
import { isFeatureEnabled } from '@/lib/flags';

export function AppShell({ children }: { children: React.ReactNode }) {
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const showDevOverlay = isFeatureEnabled('devOverlay');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <>
      {/* Main Viewport Content */}
      {children}

      {/* Global Modals & Overlays */}
      <OfflineNotice />
      <LoadingScreen />
      <SettingsDrawer />

      {/* Developer Control Menu */}
      {showDevOverlay && <DevMenu />}
    </>
  );
}
