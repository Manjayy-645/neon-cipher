'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsDrawer } from '@/features/settings/SettingsDrawer';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="h-full w-full bg-panel p-4 flex flex-col justify-center items-center">
      <SettingsDrawer isOpen={true} onClose={() => router.push('/map')} />
    </div>
  );
}
