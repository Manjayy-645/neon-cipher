import React from 'react';
import { CoopConsole } from '@/features/coop/CoopConsole';

export default function CoopPage() {
  return (
    <main className="flex h-full w-full min-h-0 flex-col bg-panel text-ink overflow-hidden">
      <CoopConsole />
    </main>
  );
}
