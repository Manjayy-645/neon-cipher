import React from 'react';
import { CoopConsole } from '@/features/coop/CoopConsole';

export default function CoopPage() {
  return (
    <main className="scene-ground scene-arrive flex h-full w-full min-h-0 flex-col text-ink overflow-hidden">
      <CoopConsole />
    </main>
  );
}
