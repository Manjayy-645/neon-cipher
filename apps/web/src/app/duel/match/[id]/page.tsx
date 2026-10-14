'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DuelConsole } from '@/features/duel/DuelConsole';
import { duelService } from '@/features/duel/duelService';
import { DuelSession } from '@/features/duel/types';
import { useDuelStore } from '@/stores/duel-store';

export default function DuelMatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const duelId = (Array.isArray(rawId) ? rawId[0] : rawId) || 'duel-01';

  const [session, setSession] = useState<DuelSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    duelService
      .syncSession(duelId)
      .then((s) => {
        if (!mounted) return;
        setSession(s);
        useDuelStore.setState({ activeSession: s });
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to connect to duel carrier');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [duelId]);

  if (loading) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center font-data text-accent bg-panel-dark gap-3 p-6"
        data-surface="terminal"
      >
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="tracking-widest uppercase text-xs">
          INITIALIZING SEC-NET DUEL LINK...
        </span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center bg-panel-dark text-danger-text font-data p-6 text-center gap-4"
        data-surface="terminal"
      >
        <div className="text-xl font-bold tracking-wider">DUEL LINK TERMINATED</div>
        <div className="text-xs opacity-80">{error || 'Session not found'}</div>
        <button
          onClick={() => router.push('/duel')}
          className="min-h-[44px] px-6 py-2 rounded-[6px] border border-danger bg-panel text-danger-text font-data text-xs uppercase font-bold"
        >
          RETURN TO LOBBY
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-panel-dark">
      <DuelConsole initialSession={session} onExit={() => router.push('/duel')} />
    </div>
  );
}
