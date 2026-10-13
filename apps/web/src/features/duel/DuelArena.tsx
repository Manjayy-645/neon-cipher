'use client';

import React from 'react';
import { useDuelStore } from '@/stores/duel-store';
import { MatchmakingLobby } from './MatchmakingLobby';
import { DuelConsole } from './DuelConsole';

export function DuelArena() {
  const { activeSession } = useDuelStore();

  if (activeSession) {
    return (
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-panel-dark">
        <DuelConsole />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-panel-light p-2 sm:p-4">
      <MatchmakingLobby />
    </div>
  );
}
