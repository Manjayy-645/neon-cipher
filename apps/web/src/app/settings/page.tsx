'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsDrawer } from '@/features/settings/SettingsDrawer';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="scene-ground scene-arrive h-full w-full p-4 flex flex-col justify-center items-center">
      <SettingsDrawer isOpen={true} onClose={() => router.push('/map')} />
    </div>
  );
}
