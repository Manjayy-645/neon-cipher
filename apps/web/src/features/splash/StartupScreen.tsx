'use client';

import { useState } from 'react';
import { SplashScreen } from '@/features/onboarding/components/SplashScreen';
import { BootSequence } from './BootSequence';

export function StartupScreen() {
  const [bootComplete, setBootComplete] = useState(false);

  if (!bootComplete) {
    return (
      <BootSequence
        autoRoute={false}
        onComplete={() => setBootComplete(true)}
      />
    );
  }

  return <SplashScreen />;
}
