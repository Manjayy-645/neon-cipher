import React from 'react';
import { Codemaker } from '@/features/codemaker/Codemaker';

export default function CodemakerPage() {
  return (
    <main className="flex h-full w-full min-h-0 flex-col bg-panel text-ink overflow-hidden">
      <Codemaker />
    </main>
  );
}
