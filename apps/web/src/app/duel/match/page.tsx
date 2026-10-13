'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { duelFeed, DuelConfig } from '@/features/duel/duelFeed';
import { useDuelMatch } from '@/features/duel/useDuelMatch';
import {
  RivalStatusStrip,
  FeedSwitcher,
  FeedList,
  DuelEndBanner,
} from '@/features/duel/components';
import {
  GuessEntry,
  Keypad,
  ClueLegendDrawer,
} from '@/features/terminal/components';
import { useSettingsStore } from '@/stores/settings-store';

function DuelMatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rookieAssist = useSettingsStore((s) => s.rookieAssist);
  const assistMode = rookieAssist ? 'rookie' : 'pro';

  const [duelId, setDuelId] = useState<string | null>(searchParams.get('duelId'));
  const [config, setConfig] = useState<DuelConfig | null>(null);
  const [loading, setLoading] = useState(!searchParams.get('duelId'));
  const [error, setError] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Initialize duel session if not provided
  useEffect(() => {
    let mounted = true;
    const tierParam = searchParams.get('tier');
    const tier = tierParam ? parseInt(tierParam, 10) : 2;

    duelFeed
      .startDuel({ tier })
      .then((data) => {
        if (!mounted) return;
        setDuelId(data.duelId);
        setConfig(data.config);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to connect to rival feed');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const {
    events,
    deadDigits,
    unseenRivalCount,
    status,
    secret,
    rivalAttemptsLeft,
    lastRivalVisibleGuess,
    entry,
    validationError,
    shakeKey,
    activeFeedTab,
    selectTab,
    inputDigit,
    backspace,
    clearEntry,
    submitGuess,
  } = useDuelMatch(duelId || '', config || undefined);

  const lastResultText = useMemo(() => {
    if (!lastRivalVisibleGuess) return null;
    const p = lastRivalVisibleGuess.pots ?? 0;
    const n = lastRivalVisibleGuess.pans ?? 0;
    if (p === 0 && n === 0) return 'NO MATCH';
    return `${p > 0 ? `${p} POT` : ''}${p > 0 && n > 0 ? ' ' : ''}${n > 0 ? `${n} PAN` : ''}`;
  }, [lastRivalVisibleGuess]);

  if (loading || !config) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center font-data text-terminal-phosphor bg-terminal-bg gap-3 p-6"
        data-surface="terminal"
      >
        <div className="w-8 h-8 border-2 border-terminal-phosphor border-t-transparent rounded-full animate-spin" />
        <span className="tracking-widest uppercase text-xs">
          SYNCHRONIZING DUAL CIPHER CARRIER...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center bg-terminal-bg text-terminal-danger font-data p-6 text-center gap-4"
        data-surface="terminal"
      >
        <div className="text-xl font-bold tracking-wider">DUEL LINK TERMINATED</div>
        <div className="text-xs opacity-80">{error}</div>
        <button
          onClick={() => router.push('/duel')}
          className="px-6 py-2 rounded-[6px] border border-terminal-danger bg-terminal-panel text-terminal-danger font-data text-xs uppercase font-bold"
        >
          RETURN TO LOBBY
        </button>
      </div>
    );
  }

  const isSubmitDisabled =
    entry.length !== config.length ||
    (!config.allowDuplicates && new Set(entry).size !== entry.length);

  return (
    <div
      className="flex flex-col h-full w-full bg-terminal-bg text-terminal-ink overflow-hidden relative"
      data-surface="terminal"
    >
      {/* CRT Scanline */}
      <div className="terminal-scanline absolute inset-0 pointer-events-none z-10" />

      {/* 1. Rival Status Strip (40px, always visible) */}
      <RivalStatusStrip
        handle="NULL_BYTE"
        totalAttempts={config.attempts}
        attemptsLeft={rivalAttemptsLeft}
        isThinking={status === 'playing'}
        lastResultText={lastResultText}
      />

      {/* 2. Feed Container */}
      {/* Mobile view (< 768px): Feed Switcher + Single feed */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-hidden">
        <FeedSwitcher
          activeTab={activeFeedTab}
          onChange={selectTab}
          unseenRivalCount={unseenRivalCount}
        />
        <FeedList
          events={events}
          length={config.length}
          filterMode={activeFeedTab}
        />
      </div>

      {/* Tablet & Desktop (>= 768px): Side-by-side feeds */}
      <div className="hidden md:flex flex-1 min-h-0 divide-x divide-terminal-line overflow-hidden">
        <FeedList
          events={events}
          length={config.length}
          filterMode="you"
          title="YOUR SCAN FEED"
        />
        <FeedList
          events={events}
          length={config.length}
          filterMode="rival"
          title="RIVAL SCAN FEED"
        />
      </div>

      {/* 3. Entry Row (pinned at bottom in every feed view) */}
      <GuessEntry
        digits={config.length}
        entry={entry}
        validationError={validationError}
        shakeKey={shakeKey}
      />

      {/* 4. Keypad (pinned at bottom in every feed view) */}
      <Keypad
        onDigit={inputDigit}
        onBackspace={backspace}
        onSubmit={submitGuess}
        onClear={clearEntry}
        isSubmitDisabled={isSubmitDisabled}
        deadDigits={deadDigits}
        usedDigitsInEntry={entry}
        allowDuplicates={config.allowDuplicates}
        assistMode={assistMode}
      />

      {/* Clue Legend Drawer */}
      <ClueLegendDrawer
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />

      {/* 5. Duel End Banner */}
      {status !== 'playing' && (
        <DuelEndBanner
          status={status}
          secret={secret}
          onReturnToLobby={() => router.push('/duel')}
        />
      )}
    </div>
  );
}

export default function DuelMatchPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-full flex items-center justify-center font-data text-terminal-phosphor bg-terminal-bg text-xs tracking-widest uppercase"
          data-surface="terminal"
        >
          INITIALIZING SEC-NET FEED...
        </div>
      }
    >
      <DuelMatchContent />
    </Suspense>
  );
}
