'use client';

import { useResettableState } from '@/lib/useResettableState';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DuelSession, DuelGuess, DuelFeedEvent } from './types';
import { duelService } from './duelService';
import { SabotageBar } from './SabotageBar';
import {
  StaticHistoryOverlay,
  ScrambleKeypadBanner,
  ClockDrainAlert,
  ShieldAlert,
  ParityJammerBanner,
  KeyLatchBanner,
  NixTacticalCalloutBanner,
  NixDuelOnboardingCard,
} from './SabotageOverlay';
import { ResolutionModal } from './ResolutionModal';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import {
  validateGuess,
  isExploitAllowed,
  getNixDuelCallout,
  NIX_DUEL_BRIEFINGS,
  NixDialogueTrigger,
} from '@neon-cipher/game-rules';

import { useDuelStore } from '@/stores/duel-store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export interface DuelConsoleProps {
  initialSession?: DuelSession;
  onExit?: () => void;
}

// Scrambled keypad order when under scramble_keypad attack
const SCRAMBLED_DIGITS = ['7', '2', '9', '4', '0', '6', '1', '8', '3', '5'];
const STANDARD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const DuelConsole: React.FC<DuelConsoleProps> = ({
  initialSession,
  onExit: propsOnExit,
} = {}) => {
  const storeSession = useDuelStore((s) => s.activeSession);
  const storeExit = useDuelStore((s) => s.exitDuel);
  const storeMobileTab = useDuelStore((s) => s.activeMobileTab);
  const setStoreMobileTab = useDuelStore((s) => s.setMobileTab);
  const syncSession = useDuelStore((s) => s.syncSession);
  const activeSessionFromStore = initialSession || storeSession;

  const [session, setSession] = useState<DuelSession | null>(activeSessionFromStore);
  const [filterChoice, setFeedFilter] = useState<'all' | 'player' | 'rival'>(
    storeMobileTab || 'player'
  );
  const mobileTab = storeMobileTab || 'player';
  const feedFilter = filterChoice === 'all' ? 'all' : mobileTab;
  const [input, setInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [activeCheat, setActiveCheat] = useState<boolean>(false);
  const [drainAlert, setDrainAlert] = useState<boolean>(false);
  const [isStealthArmed, setIsStealthArmed] = useState<boolean>(false);

  // Clocks
  const clockKey = [session?.playerClockMs, session?.rivalClockMs, session?.turnClockSeconds].join(':');
  const [turnClock, setTurnClock] = useResettableState<number>(session?.turnClockSeconds ?? 35, clockKey);
  const [playerClockMs, setPlayerClockMs] = useResettableState<number>(session?.playerClockMs ?? 35000, clockKey);
  const [rivalClockMs, setRivalClockMs] = useResettableState<number>(session?.rivalClockMs ?? 35000, clockKey);

  // Unread indicator for rival guesses
  const [unreadRivalCount, setUnreadRivalCount] = useState<number>(0);
  const lastSeenRivalGuessesCount = useRef<number>(activeSessionFromStore?.rival.guesses.length || 0);

  const [previousStoreSession, setPreviousStoreSession] = useState(activeSessionFromStore);
  if (previousStoreSession !== activeSessionFromStore) {
    setPreviousStoreSession(activeSessionFromStore);
    if (activeSessionFromStore) setSession(activeSessionFromStore);
  }


  const feedBottomRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback((tab: 'all' | 'player' | 'rival') => {
    setFeedFilter(tab);
    if (tab === 'player' || tab === 'rival') {
      setStoreMobileTab(tab);
    }
    if (tab === 'rival' || tab === 'all') {
      setUnreadRivalCount(0);
      if (session) {
        lastSeenRivalGuessesCount.current = session.rival.guesses.length;
      }
    }
  }, [session, setStoreMobileTab]);

  const onExit = propsOnExit || storeExit;
  const [confirmLeave, setConfirmLeave] = useState(false);

  const { credits, setBalances } = usePlayerStore();
  const colorBlindMode = useSettingsStore((s) => s.colorBlindMode);
  const seenFeatureGuides = useSettingsStore((s) => s.seenFeatureGuides) || [];
  const markFeatureGuideSeen = useSettingsStore((s) => s.markFeatureGuideSeen);

  const [activeNixCallout, setActiveNixCallout] = useState<NixDialogueTrigger | null>(null);
  const [lastProcessedEventId, setLastProcessedEventId] = useState<string | null>(null);

  const latestEvent = session?.feedEvents?.[session.feedEvents.length - 1];
  if (latestEvent && latestEvent.id !== lastProcessedEventId) {
    setLastProcessedEventId(latestEvent.id);
    if (latestEvent.sabotageEvent) {
      const toolName = latestEvent.sabotageEvent.toolName.toLowerCase();
      if (toolName.includes('parity')) {
        setActiveNixCallout(getNixDuelCallout({ type: 'parity_jammer' }));
      } else if (toolName.includes('latch')) {
        setActiveNixCallout(getNixDuelCallout({ type: 'key_latch_virus' }));
      } else if (toolName.includes('bomb')) {
        setActiveNixCallout(getNixDuelCallout({ type: 'logic_bomb' }));
      }
    } else if (latestEvent.who === 'rival' && latestEvent.isStealth) {
      setActiveNixCallout(getNixDuelCallout({ type: 'stealth_probe' }));
    }
  }

  const isScrambled = session?.player.activeEffects.includes('scramble_keypad') ?? false;
  const hasStatic = session?.player.activeEffects.includes('static_history') ?? false;
  const isShielded = session?.player.shieldActive ?? false;
  const isCasual = session?.matchType === 'casual';
  const exploitCheck = session ? isExploitAllowed(session.matchType) : { allowed: false };

  // Track unread rival moves
  useEffect(() => {
    if (!session) return;
    const currentRivalCount = session.rival.guesses.length;
    if (feedFilter === 'player' && currentRivalCount > lastSeenRivalGuessesCount.current) {
      setUnreadRivalCount((prev) => prev + (currentRivalCount - lastSeenRivalGuessesCount.current));
      lastSeenRivalGuessesCount.current = currentRivalCount;
    } else if (feedFilter !== 'player') {
      lastSeenRivalGuessesCount.current = currentRivalCount;
      setUnreadRivalCount(0);
    }
  }, [session, feedFilter]);

  // Periodic session sync with mock server (every 1.5s)
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const syncInterval = setInterval(() => {
      syncSession();
    }, 1500);

    return () => clearInterval(syncInterval);
  }, [session?.status, syncSession]);

  // Smooth clock countdown timer
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const interval = setInterval(() => {
      setPlayerClockMs((prev) => Math.max(0, prev - 250));
      setRivalClockMs((prev) => Math.max(0, prev - 250));
      setTurnClock((prev) => {
        if (prev <= 1) return session.guessClockMs ? Math.ceil(session.guessClockMs / 1000) : 35;
        return prev - 1;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [session?.status, session?.guessClockMs, setPlayerClockMs, setRivalClockMs, setTurnClock]);

  // Handle guess submission
  const handleSubmit = useCallback(async () => {
    if (
      !session ||
      input.length !== session.digits ||
      isSubmitting ||
      session.status !== 'active'
    ) {
      return;
    }

    if (session.pacingMode === 'turn_based' && session.currentTurn !== 'player') {
      return;
    }

    const currentSession = session;
    setIsSubmitting(true);
    try {
      const exploitToUse = activeCheat && isCasual ? 'exploit-digit-scrub' : undefined;
      const res = isStealthArmed
        ? await duelService.submitGuess(currentSession.id, input, exploitToUse, true)
        : await duelService.submitGuess(currentSession.id, input, exploitToUse);
      setIsStealthArmed(false);

      // Check if drain_clock was triggered by opponent
      if (
        res.session.player.activeEffects.includes('drain_clock') &&
        !currentSession.player.activeEffects.includes('drain_clock')
      ) {
        setDrainAlert(true);
        setTimeout(() => setDrainAlert(false), 3000);
      }

      setSession(res.session);
      setInput('');
      setActiveNixCallout(null);
      setTurnClock(res.session.turnClockSeconds);
      setPlayerClockMs(res.session.playerClockMs || 35000);
      setRivalClockMs(res.session.rivalClockMs || 35000);

      // If duel finished and player won, sync net payout to player store
      if (res.session.status === 'player_won') {
        const newCredits = credits + res.session.netPot;
        setBalances(newCredits, usePlayerStore.getState().coins);
      }

      // If user was viewing rival tab, switch to player tab so their new guess is visible!
      if (feedFilter === 'rival') {
        handleTabChange('player');
      }
    } catch (err: unknown) {
      console.error('Failed to submit duel guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [input, isSubmitting, session, activeCheat, isCasual, isStealthArmed, credits, setBalances, feedFilter, handleTabChange]);

  // Handle keypad input
  const handleKeyPress = useCallback((digit: string) => {
    if (!session) return;
    if (session.pacingMode === 'turn_based' && session.currentTurn !== 'player') return;
    if (session.player.latchedKeys?.includes(digit)) return;
    if (input.length < session.digits && !input.includes(digit)) {
      setInput((prev) => prev + digit);
    }
  }, [input, session]);

  const handleBackspace = useCallback(() => {
    setInput((prev) => prev.slice(0, -1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!session || session.status !== 'active') return;

      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, handleSubmit, session]);

  // Sabotage callback
  const handleSabotageResult = (result: {
    success: boolean;
    shielded: boolean;
    effectApplied?: string;
    remainingCredits: number;
    message: string;
  }) => {
    setBalances(result.remainingCredits, usePlayerStore.getState().coins);

    if (result.shielded) {
      setActiveNixCallout(getNixDuelCallout({ type: 'firewall_blocked' }));
    } else if (result.effectApplied === 'mirror_shield') {
      setActiveNixCallout(getNixDuelCallout({ type: 'mirror_reflected' }));
    }

    if (result.effectApplied === 'firewall_shield' || result.effectApplied === 'mirror_shield') {
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          player: { ...prev.player, shieldActive: true },
        } as DuelSession;
      });
    }
  };

  // Double or Nothing callback
  const handleDoubleOrNothing = async () => {
    if (!session || isRematching) return;
    setIsRematching(true);
    try {
      const newSession = await duelService.triggerDoubleOrNothing(session.id);
      setSession(newSession);
      setInput('');
      setTurnClock(newSession.turnClockSeconds);
    } catch (err: unknown) {
      console.error('Failed to trigger Double or Nothing:', err);
    } finally {
      setIsRematching(false);
    }
  };

  // Compile proven dead digits from BOTH player & rival public zero-hit guesses
  const deadDigits = useMemo(() => {
    if (!session) return new Set<string>();
    const dead = new Set<string>();

    session.player.guesses.forEach((g) => {
      if (g.pans === 0 && g.pots === 0 && !g.falsified) {
        g.guess.split('').forEach((d) => dead.add(d));
      }
    });

    session.rival.guesses.forEach((g) => {
      if (g.pans === 0 && g.pots === 0 && (!g.isStealth || g.unmasked)) {
        if (g.guess && !g.guess.includes('*')) {
          g.guess.split('').forEach((d) => dead.add(d));
        }
      }
    });

    (session.feedEvents || []).forEach((ev) => {
      if (ev.pans === 0 && ev.pots === 0 && ev.guess && !ev.falsified) {
        ev.guess.split('').forEach((d) => dead.add(d));
      }
    });

    return dead;
  }, [session]);

  // Assemble chronological unified feed events
  const unifiedFeedEvents = useMemo(() => {
    if (!session) return [];
    if (session.feedEvents && session.feedEvents.length > 0) {
      return session.feedEvents;
    }

    // Fallback merge for compatibility
    const pEvents: DuelFeedEvent[] = session.player.guesses.map((g, i) => ({
      id: `p-${i}-${g.timestamp}`,
      who: 'player',
      guess: g.guess,
      pans: g.pans,
      pots: g.pots,
      timestamp: g.timestamp - session.startedAt,
      cheatUsed: g.cheatUsed,
      isStealth: g.isStealth,
      falsified: g.falsified,
      unmasked: g.unmasked,
      parityLabel: g.parityLabel,
    }));
    const rEvents: DuelFeedEvent[] = session.rival.guesses.map((g, i) => ({
      id: `r-${i}-${g.timestamp}`,
      who: 'rival',
      guess: g.isStealth && !g.unmasked ? null : g.guess,
      pans: g.isStealth && !g.unmasked ? null : g.pans,
      pots: g.isStealth && !g.unmasked ? null : g.pots,
      timestamp: g.timestamp - session.startedAt,
      isStealth: g.isStealth,
      unmasked: g.unmasked,
      parityLabel: g.parityLabel,
    }));
    return [...pEvents, ...rEvents].sort((a, b) => a.timestamp - b.timestamp);
  }, [session]);

  // Filter events based on selected tab
  const filteredFeedEvents = useMemo(() => {
    if (feedFilter === 'all') return unifiedFeedEvents;
    return unifiedFeedEvents.filter((ev) => ev.who === feedFilter);
  }, [unifiedFeedEvents, feedFilter]);

  // Last visible rival guess summary
  const lastRivalSummary = useMemo(() => {
    if (!session || session.rival.guesses.length === 0) return 'NONE';
    const last = session.rival.guesses[session.rival.guesses.length - 1];
    if ((last.isStealth && !last.unmasked) || last.pans == null || last.pots == null) return '[ENCRYPTED]';
    if (last.pans === 0 && last.pots === 0) return '0 PAN 0 POT';
    return `${last.pans > 0 ? `${last.pans} PAN ` : ''}${last.pots > 0 ? `${last.pots} POT` : ''}`.trim();
  }, [session]);

  // Auto-scroll feed stream to latest event
  useEffect(() => {
    if (typeof feedBottomRef.current?.scrollIntoView === 'function') {
      feedBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredFeedEvents.length, feedFilter]);

  if (!session) {
    return (
      <div data-testid="duel-console-loading" className="h-full flex items-center justify-center font-data text-accent text-xs">
        INITIALIZING DUEL MATRIX...
      </div>
    );
  }

  const isInputValid = validateGuess(input, session.digits, false);
  const orderedDigits = isScrambled ? SCRAMBLED_DIGITS : STANDARD_DIGITS;

  const guessClockMax = session.guessClockMs || 35000;
  const playerClockPercent = Math.min(100, Math.max(0, (playerClockMs / guessClockMax) * 100));
  const rivalClockPercent = Math.min(100, Math.max(0, (rivalClockMs / guessClockMax) * 100));
  const playerSecondsLeft = Math.ceil(playerClockMs / 1000);
  const rivalSecondsLeft = Math.ceil(rivalClockMs / 1000);
  const isTurnBased = session.pacingMode === 'turn_based';
  const isPlayerTurn = !isTurnBased || session.currentTurn === 'player';

  return (
    <div
      data-testid="duel-console"
      data-surface="terminal"
      className="flex flex-col h-full w-full bg-panel-dark text-panel-light overflow-y-auto relative select-none"
    >
      <p className="shrink-0 px-3 py-1 border-b border-line font-data text-xs text-ink-muted bg-panel-dark">Local duel simulation · Synthetic opponent</p>
      {/* 1. TOP STATUS BAR: Opponent info, pot, mode, alerts & clocks */}
      <header
        data-testid="duel-status-bar"
        className="flex justify-between items-center px-2.5 sm:px-3 py-2 bg-ink border-b border-line shrink-0 z-20 gap-2"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-panel-dark border border-line flex items-center justify-center text-sm shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                session.rival.avatar && session.rival.avatar.startsWith('/')
                  ? session.rival.avatar
                  : '/Character portraits/Null_Byte.png'
              }
              alt={session.rival.handle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-data text-xs font-bold text-panel-light truncate max-w-[85px] sm:max-w-[140px]">
                {session.rival.handle}
              </span>
              <span className="font-data text-[8px] sm:text-[9px] uppercase px-1 py-0.2 rounded bg-danger/20 text-danger border border-danger/30 shrink-0">
                AI
              </span>
              <span className="font-data text-[8px] sm:text-[9px] uppercase px-1 py-0.2 rounded bg-accent/20 text-accent border border-accent/30 shrink-0">
                {isTurnBased ? '⏱️ TURN-BASED' : '⚡ SPEED RACE'}
              </span>
            </div>
            <span className="font-data text-[8px] sm:text-[9px] text-ink-muted uppercase tracking-wider truncate">
              {session.matchType.toUpperCase()} • {session.totalPot.toLocaleString()} CR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Shield status */}
          <ShieldAlert shieldActive={isShielded} />

          {/* Clock Drain Alert */}
          <ClockDrainAlert active={drainAlert} />

          {/* Shared Attempts Pool (Legacy compatible) */}
          <div
            data-testid="shared-attempts-pool"
            className="flex flex-col items-end px-1.5 sm:px-2 py-0.5 sm:py-1 bg-panel-dark/80 rounded border border-line"
          >
            <span className="font-data text-[7px] sm:text-[8px] text-ink-muted uppercase tracking-wider">
              ATTEMPTS
            </span>
            <span
              data-testid="shared-attempts-indicator"
              className={`font-data text-[11px] sm:text-xs font-black ${
                session.sharedAttempts <= 3 ? 'text-danger animate-pulse' : 'text-accent'
              }`}
            >
              {session.sharedAttempts} LEFT
              <span className="hidden sm:inline"> ({session.sharedAttempts}/12)</span>
            </span>
          </div>

          {/* Turn Clock */}
          <div
            data-testid="turn-clock"
            className="flex flex-col items-end px-2 sm:px-2.5 py-0.5 sm:py-1 bg-panel-dark/80 rounded border border-line"
          >
            <span className="font-data text-[7px] sm:text-[8px] text-ink-muted uppercase tracking-wider">
              CLOCK
            </span>
            <span
              className={`font-data text-[11px] sm:text-xs font-black ${
                turnClock <= 5 ? 'text-danger animate-pulse' : 'text-money'
              }`}
            >
              {turnClock}s
            </span>
          </div>

          {/* Quit / Surrender Button */}
          <Button
            type="button"
            variant="icon"
            onClick={() => { if (session.status === 'active') setConfirmLeave(true); else onExit(); }}
            data-testid="surrender-button"
            aria-label="Surrender or Exit Duel"
            title="Surrender / Exit Duel"
            className="border-line text-ink-muted hover:text-danger hover:border-danger p-1 sm:p-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </header>

      {/* 1.5 GAME MODE & INTEGRITY RIBBON */}
      <div
        data-testid="duel-mode-ribbon"
        className="px-2.5 sm:px-3 py-1 bg-ink/95 border-b border-line flex items-center justify-between text-xs font-data shrink-0 gap-2 select-none"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider shrink-0">
            MODE:
          </span>
          {isCasual ? (
            <span
              data-testid="mode-badge-casual"
              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/50 text-sky-300 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]"
            >
              <span>🎮 CASUAL</span>
              <span className="text-[9px] text-sky-400/80 hidden sm:inline">• CHEATS PERMITTED</span>
            </span>
          ) : session.matchType === 'turf' ? (
            <span
              data-testid="mode-badge-turf"
              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-accent/25 border border-accent/50 text-accent font-bold uppercase tracking-wider text-[10px] sm:text-[11px]"
            >
              <span>🏴 TURF WAR</span>
              <span className="text-[9px] text-accent/80 hidden sm:inline">• TERRITORY LOCK</span>
            </span>
          ) : (
            <span
              data-testid="mode-badge-wager"
              className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]"
            >
              <span>💰 RANKED WAGER</span>
              <span className="text-[9px] text-amber-400/80 hidden sm:inline">({session.totalPot.toLocaleString()} CR POT)</span>
            </span>
          )}

          <span
            data-testid="pacing-badge"
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-panel-dark border border-line text-panel-light font-bold uppercase tracking-wider text-[10px] sm:text-[11px] shrink-0"
          >
            {isTurnBased ? '⏱️ 35s TACTICAL TURNS' : '⚡ SPEED RACE'}
          </span>
        </div>

        {/* Live Integrity / Cheat status indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isCasual ? (
            <span
              data-testid="mode-cheat-status"
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeCheat
                  ? 'bg-danger/25 border border-danger/60 text-danger animate-pulse'
                  : 'bg-panel-dark border border-line text-ink-muted'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeCheat ? 'bg-danger' : 'bg-ink-muted'}`} />
              <span>{activeCheat ? 'EXPLOIT ARMED' : 'CHEATS ALLOWED'}</span>
            </span>
          ) : (
            <span
              data-testid="mode-anti-cheat"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-panel-dark border border-line text-ink-muted text-[10px] font-bold uppercase tracking-wider"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>NO EXPLOITS</span>
            </span>
          )}
        </div>
      </div>

      {/* Floating Unobtrusive Nix Intel Overlay Container (Zero Layout Shift) */}
      {(!seenFeatureGuides.includes('guide-shared-feed') ||
        !seenFeatureGuides.includes('guide-sabotage-deck')) && (
        <div className="absolute top-20 left-2 right-2 z-40 flex flex-col gap-2 pointer-events-auto">
          {!seenFeatureGuides.includes('guide-shared-feed') && (
            <NixDuelOnboardingCard
              guideId="guide-shared-feed"
              title={NIX_DUEL_BRIEFINGS.shared_feed.title}
              body={NIX_DUEL_BRIEFINGS.shared_feed.body}
              onDismiss={() => markFeatureGuideSeen('guide-shared-feed')}
            />
          )}
          {!seenFeatureGuides.includes('guide-sabotage-deck') && (
            <NixDuelOnboardingCard
              guideId="guide-sabotage-deck"
              title={NIX_DUEL_BRIEFINGS.sabotage_deck.title}
              body={NIX_DUEL_BRIEFINGS.sabotage_deck.body}
              onDismiss={() => markFeatureGuideSeen('guide-sabotage-deck')}
            />
          )}
        </div>
      )}

      {/* Contextual Floating Nix Tactical Callout Banner */}
      <NixTacticalCalloutBanner
        callout={activeNixCallout}
        onDismiss={() => setActiveNixCallout(null)}
      />

      {/* 2. RIVAL STATUS STRIP with live guess countdown clock bar */}
      <section
        role="region"
        aria-label="Rival Status Strip"
        className="px-3 py-2 bg-ink/90 border-b border-line flex flex-col gap-1.5 shrink-0"
      >
        <div className="flex items-center justify-between text-xs font-data">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-danger-text uppercase">
              RIVAL [{session.rival.handle}]
            </span>
            <span className="text-[10px] text-ink-muted">
              {session.rivalAttempts}/{session.maxAttempts || 7} TRIES
            </span>
            {isTurnBased && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                  session.currentTurn === 'rival'
                    ? 'bg-danger/20 text-danger border border-danger/40 animate-pulse'
                    : 'bg-panel-dark text-ink-muted border border-line'
                }`}
              >
                {session.currentTurn === 'rival' ? 'CALCULATING...' : 'WAITING'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-muted">LAST:</span>
            <span className="font-bold text-panel-light text-[11px] font-mono">
              {lastRivalSummary}
            </span>
            <span
              className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-panel-dark border border-line ${
                rivalSecondsLeft <= 5 ? 'text-danger animate-pulse border-danger' : 'text-terminal-amber'
              }`}
            >
              {rivalSecondsLeft}s
            </span>
          </div>
        </div>

        {/* Rival clock countdown progress bar */}
        <div className="w-full h-1 bg-panel-dark rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              rivalSecondsLeft <= 5 ? 'bg-danger animate-pulse' : 'bg-terminal-amber'
            }`}
            style={{ width: `${rivalClockPercent}%` }}
          />
        </div>
      </section>

      {/* 3. UNIFIED FEED FILTER SWITCHER [SHARED | YOU | RIVAL] */}
      <nav aria-label="Feed Tabs" className="flex border-b border-line bg-ink/70 shrink-0">
        <Button
          type="button"
          variant="ghost"
          data-testid="tab-all"
          onClick={() => handleTabChange('all')}
          className={`flex-1 min-h-[44px] py-2 px-3 font-data text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-none border-t-0 border-l-0 border-r-0 ${
            feedFilter === 'all'
              ? 'bg-panel-dark text-panel-light border-b-2 border-accent'
              : 'text-ink-muted hover:text-panel-light border-b-0'
          }`}
        >
          <span>ALL (SHARED)</span>
          <span className="text-[10px] opacity-75">({unifiedFeedEvents.length})</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          data-testid="tab-you"
          onClick={() => handleTabChange('player')}
          className={`flex-1 min-h-[44px] py-2 px-3 font-data text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-none border-t-0 border-l-0 border-r-0 ${
            feedFilter === 'player'
              ? 'bg-panel-dark text-accent border-b-2 border-accent'
              : 'text-ink-muted hover:text-panel-light border-b-0'
          }`}
        >
          <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/40 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={session.player.avatar || '/Character portraits/Player avatars.png'} alt="You" className="w-full h-full object-cover" />
          </div>
          <span data-testid="toggle-tab-you">YOU</span>
          <span className="text-[10px] opacity-75">({session.player.guesses.length})</span>
          {session.player.cheatUsed && (
            <span className="text-[9px] px-1 rounded bg-danger/20 text-danger border border-danger/30">
              CHEAT
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          data-testid="tab-rival"
          onClick={() => handleTabChange('rival')}
          className={`flex-1 min-h-[44px] py-2 px-3 font-data text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-none border-t-0 border-l-0 border-r-0 relative ${
            feedFilter === 'rival'
              ? 'bg-panel-dark text-danger-text border-b-2 border-danger'
              : 'text-ink-muted hover:text-panel-light border-b-0'
          }`}
        >
          <div className="w-4 h-4 rounded-full overflow-hidden border border-danger/40 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Character portraits/Null_Byte.png" alt="Rival" className="w-full h-full object-cover" />
          </div>
          <span data-testid="toggle-tab-rival">RIVAL [{session.rival.handle}]</span>
          <span className="text-[10px] opacity-75">({session.rival.guesses.length})</span>
          {unreadRivalCount > 0 && (
            <span className="font-data text-[9px] font-bold px-1 py-0.2 rounded bg-terminal-amber text-terminal-bg animate-pulse">
              ● NEW
            </span>
          )}
        </Button>
      </nav>

      {/* 4. UNIFIED CHRONOLOGICAL FEED */}
      <div
        data-testid={mobileTab === 'rival' ? 'rival-stream' : 'player-stream'}
        className="flex-1 min-h-0 overflow-hidden flex flex-col relative"
      >
        <div
          data-testid="player-guess-stream"
          className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2 relative"
        >
          {/* Static history overlay when attacked */}
          {hasStatic && (
            <StaticHistoryOverlay
              staticExpiry={session.player.staticExpiry}
              onExpire={() => {
                setSession((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    player: {
                      ...prev.player,
                      activeEffects: prev.player.activeEffects.filter(
                        (e) => e !== 'static_history'
                      ),
                    },
                  } as DuelSession;
                });
              }}
            />
          )}

          {/* Feed Context Header */}
          <div className="shrink-0">
            {feedFilter === 'rival' ? (
              <div
                data-testid="rival-feed-active-banner"
                className="p-2 rounded bg-terminal-amber/15 border border-terminal-amber/40 flex items-center justify-between text-xs font-data"
              >
                <div className="flex items-center gap-1.5 text-terminal-amber">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="font-bold">FILTER: RIVAL TELEMETRY</span>
                  <span className="text-ink-muted text-[10px] hidden sm:inline">({session.player.guesses.length} of your probes hidden)</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  compact
                  data-testid="switch-to-player-feed-btn"
                  onClick={() => handleTabChange('player')}
                  className="text-[11px] font-bold text-terminal-phosphor hover:text-accent underline px-2 py-0.5 h-auto"
                >
                  SHOW YOUR PROBES ({session.player.guesses.length})
                </Button>
              </div>
            ) : feedFilter === 'player' ? (
              <div className="px-2.5 py-1.5 rounded bg-terminal-phosphor/10 border border-terminal-phosphor/25 flex items-center justify-between text-[11px] font-data">
                <div className="flex items-center gap-1.5 text-terminal-phosphor font-bold">
                  <span>YOUR CIPHER PROBE HISTORY</span>
                  <span className="text-ink-muted font-normal text-[10px]">({session.player.guesses.length} attempts recorded)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                  <span className="flex items-center gap-1"><span className="text-terminal-phosphor font-bold">●</span> PAN (Exact)</span>
                  <span className="flex items-center gap-1"><span className="text-terminal-amber font-bold">○</span> POT (Wrong Slot)</span>
                </div>
              </div>
            ) : (
              <div className="px-2.5 py-1.5 rounded bg-panel-dark/90 border border-line flex items-center justify-between text-[11px] font-data text-ink-muted">
                <div className="flex items-center gap-1.5 text-panel-light font-bold">
                  <span>SHARED CIPHER FEED</span>
                  <span className="text-ink-muted font-normal text-[10px]">({session.player.guesses.length} you, {session.rival.guesses.length} rival)</span>
                </div>
                <span className="text-[10px] font-mono uppercase">CHRONOLOGICAL DUAL STREAM</span>
              </div>
            )}
          </div>

          {filteredFeedEvents.length === 0 ? (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 gap-2 text-ink-muted font-data">
              <div className="w-8 h-8 rounded-full border border-line bg-panel-dark flex items-center justify-center text-ink-muted/70">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              {feedFilter === 'player' ? (
                <>
                  <div className="text-xs font-bold text-terminal-phosphor uppercase tracking-wider">
                    NO CIPHER PROBES TRANSMITTED YET
                  </div>
                  <p className="text-[11px] text-ink-muted max-w-xs leading-relaxed">
                    Enter {session.digits} unique digits on the keypad below and press <strong className="text-panel-light">[ENT]</strong> to test your first hypothesis.
                  </p>
                </>
              ) : feedFilter === 'rival' ? (
                <>
                  <div className="text-xs font-bold text-terminal-amber uppercase tracking-wider">
                    RIVAL TELEMETRY SILENT
                  </div>
                  <p className="text-[11px] text-ink-muted max-w-xs leading-relaxed">
                    {session.rival.handle} has not made a public probe yet. Strike first!
                  </p>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-panel-light uppercase tracking-wider">
                    DUEL CIPHER FEED READY
                  </div>
                  <p className="text-[11px] text-ink-muted max-w-xs leading-relaxed">
                    Both cipher carrier streams active. Transmit your opening probe below.
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredFeedEvents.map((ev, idx) => {
              const isYou = ev.who === 'player';
              const totalSec = Math.max(0, Math.floor(ev.timestamp / 1000));
              const mins = Math.floor(totalSec / 60);
              const secs = totalSec % 60;
              const timeFormatted = `+${mins}:${String(secs).padStart(2, '0')}`;

              // Sabotage Event Card
              if (ev.sabotageEvent) {
                return (
                  <div
                    key={ev.id || `sab-${idx}`}
                    className="p-2.5 rounded bg-ink/70 border border-accent/30 flex items-center justify-between text-xs font-data"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/40">
                        PROTOCOL
                      </span>
                      <span className="font-bold text-panel-light">{ev.sabotageEvent.toolName}</span>
                      <span className="text-ink-muted text-[11px]">— {ev.sabotageEvent.description}</span>
                    </div>
                    <span className="text-[10px] text-ink-muted font-mono">{timeFormatted}</span>
                  </div>
                );
              }

              // Guess Event Card
              const isEncrypted = !isYou && ev.isStealth && !ev.unmasked;

              // Compute turn count for this actor
              let turnNumber = 1;
              for (const e of unifiedFeedEvents) {
                if (e.id === ev.id) break;
                if (e.who === ev.who && e.guess !== null) {
                  turnNumber++;
                }
              }

              return (
                <div
                  key={ev.id || `ev-${idx}`}
                  data-testid={isYou ? `player-guess-row-${idx}` : `rival-guess-row-${idx}`}
                  className={`min-h-[52px] px-3 py-2 rounded border flex items-center justify-between gap-3 relative overflow-hidden bg-panel-dark/80 text-sm ${
                    isYou ? 'border-line' : 'border-danger/30'
                  }`}
                >
                  {/* Left actor indicator band: solid for you, hatched for rival */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isYou ? 'bg-terminal-phosphor' : ''
                    }`}
                    style={
                      isYou
                        ? undefined
                        : {
                            backgroundImage:
                              'repeating-linear-gradient(45deg, var(--terminal-amber), var(--terminal-amber) 2px, transparent 2px, transparent 4px)',
                          }
                    }
                  />

                  {/* Actor tag & offset */}
                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <span
                      className={`font-data text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isYou
                          ? 'text-terminal-phosphor bg-terminal-phosphor/15 border border-terminal-phosphor/30'
                          : 'text-terminal-amber bg-terminal-amber/15 border border-terminal-amber/30'
                      }`}
                    >
                      <span>{isYou ? 'YOU' : `RIVAL [${session.rival.handle}]`}</span>
                      <span className="opacity-70 ml-1">#{turnNumber}</span>
                    </span>
                    <span className="font-data text-xs text-ink-muted font-mono">{timeFormatted}</span>
                  </div>

                  {/* Guess digits or Encrypted lock */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isEncrypted ? (
                      <div className="flex items-center gap-1.5 font-data text-xs text-ink-muted italic">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>[ENCRYPTED MOVE]</span>
                      </div>
                    ) : (
                      <span className="font-data font-black text-panel-light tracking-[0.25em] text-base">
                        {ev.guess}
                      </span>
                    )}

                    {ev.cheatUsed && (
                      <span className="font-data text-[9px] px-1 py-0.2 bg-danger/20 text-danger border border-danger/40 rounded uppercase">
                        CHEAT
                      </span>
                    )}
                    {ev.isStealth && (
                      <span className="font-data text-[9px] px-1 py-0.2 bg-accent/20 text-accent border border-accent/40 rounded uppercase">
                        {ev.unmasked ? 'UNMASKED' : 'STEALTH'}
                      </span>
                    )}
                    {ev.falsified && (
                      <span className="font-data text-[9px] px-1 py-0.2 bg-money/20 text-money-text border border-money/40 rounded uppercase">
                        SPOOFED
                      </span>
                    )}
                  </div>

                  {/* Standardized Clue Display: Pan = filled circle, Pot = ring, Miss = dash + text */}
                  {!isEncrypted && (
                    <DuelClueDisplay
                      pans={ev.pans ?? 0}
                      pots={ev.pots ?? 0}
                      digits={session.digits}
                      colorBlindMode={colorBlindMode}
                      parityLabel={ev.parityLabel}
                    />
                  )}
                </div>
              );
            })
          )}
          {/* Bottom scroll anchor */}
          <div ref={feedBottomRef} className="h-0 w-full" />
        </div>
      </div>

      {/* 5. EFFECT BANNERS: Scramble, Key Latch, Parity Jammer */}
      <ScrambleKeypadBanner active={isScrambled} />
      <KeyLatchBanner latchedKeys={session.player.latchedKeys} />
      <ParityJammerBanner
        active={session.player.parityJamActive || session.player.activeEffects.includes('parity_jam')}
        label={session.player.guesses[session.player.guesses.length - 1]?.parityLabel}
      />

      {/* 6. MODIFIER TOGGLES & PLAYER GUESS CLOCK BAR */}
      <div className="px-3 py-1.5 bg-ink border-t border-line/50 flex flex-col gap-1.5 text-xs font-data">
        {/* Player Guess Clock bar */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold flex items-center gap-1.5">
            {isTurnBased ? (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  isPlayerTurn
                    ? 'bg-terminal-phosphor/20 text-terminal-phosphor border border-terminal-phosphor/40 animate-pulse'
                    : 'bg-panel-dark text-ink-muted border border-line'
                }`}
              >
                {isPlayerTurn ? '● YOUR TURN' : 'WAITING FOR RIVAL...'}
              </span>
            ) : (
              <span className="text-accent-text">GUESS CLOCK</span>
            )}
            {deadDigits.size > 0 && (
              <span className="text-[10px] text-ink-muted">
                ({deadDigits.size} dead digits eliminated)
              </span>
            )}
          </span>
          <span
            className={`font-mono text-xs font-bold ${
              playerSecondsLeft <= 5 ? 'text-danger animate-pulse' : 'text-terminal-phosphor'
            }`}
          >
            {playerSecondsLeft}s
          </span>
        </div>

        <div className="w-full h-1 bg-panel-dark rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              playerSecondsLeft <= 5 ? 'bg-danger animate-pulse' : 'bg-terminal-phosphor'
            }`}
            style={{ width: `${playerClockPercent}%` }}
          />
        </div>

        {/* Persistent Last Probe deduction banner */}
        {session.player.guesses.length > 0 && (
          <div
            data-testid="last-probe-summary"
            className="flex items-center justify-between px-2.5 py-1.5 rounded bg-panel-dark/95 border border-line text-xs font-data shadow-sm"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">
                LAST PROBE (#{session.player.guesses.length}):
              </span>
              <span className="font-mono font-black text-terminal-phosphor tracking-[0.2em] text-sm">
                {session.player.guesses[session.player.guesses.length - 1].guess.split('').join(' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DuelClueDisplay
                pans={session.player.guesses[session.player.guesses.length - 1].pans ?? 0}
                pots={session.player.guesses[session.player.guesses.length - 1].pots ?? 0}
                digits={session.digits}
                colorBlindMode={colorBlindMode}
                parityLabel={session.player.guesses[session.player.guesses.length - 1].parityLabel}
                parityTestId="last-probe-parity-badge"
              />
              {feedFilter !== 'player' && (
                <Button
                  type="button"
                  variant="ghost"
                  compact
                  onClick={() => handleTabChange('player')}
                  className="text-[10px] text-accent hover:text-accent-text underline px-1 py-0 h-auto"
                  title="Switch to full probe history"
                >
                  VIEW HISTORY
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Active Cheat Alert Banner */}
        {activeCheat && isCasual && (
          <div
            data-testid="cheat-active-banner"
            className="w-full bg-danger/20 border border-danger/60 rounded px-2.5 py-1.5 flex items-center justify-between text-danger-text text-xs font-data font-bold uppercase tracking-wider animate-pulse select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger shrink-0" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="truncate">CASUAL CHEAT ARMED // INVALID DIGITS SCRUBBED ON GUESS</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveCheat(false)}
              className="text-[10px] text-danger hover:text-panel-light underline uppercase shrink-0 font-mono ml-2 cursor-pointer"
            >
              [DISARM]
            </button>
          </div>
        )}

        {/* Modifiers row */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap sm:flex-nowrap">
          {isCasual ? (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant={activeCheat ? 'danger' : 'secondary'}
                compact
                data-testid="casual-exploit-toggle"
                onClick={() => setActiveCheat(!activeCheat)}
                className={`text-xs min-h-[40px] px-2.5 flex items-center gap-1.5 font-bold transition-all ${
                  activeCheat
                    ? 'border-danger bg-danger/30 text-danger-text ring-1 ring-danger animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                    : 'border-terminal-amber/60 text-terminal-amber hover:bg-terminal-amber/10'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>{activeCheat ? 'CHEAT ARMED' : 'ARM CASUAL CHEAT'}</span>
              </Button>
              <span className="text-[10px] text-ink-muted hidden md:inline">
                (Scrubs invalid digits)
              </span>
            </div>
          ) : (
            <div
              data-testid="exploits-disabled-badge"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-panel-dark border border-line text-ink-muted text-[10px] sm:text-[11px] uppercase tracking-wider font-bold"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="truncate">EXPLOITS STRICTLY DISABLED IN RANKED MATCHES</span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={isStealthArmed ? 'primary' : 'secondary'}
              compact
              data-testid="stealth-guess-toggle"
              disabled={session.status !== 'active' || credits < 150}
              onClick={() => setIsStealthArmed(!isStealthArmed)}
              className={`text-xs min-h-[40px] px-2.5 flex items-center gap-1.5 font-bold transition-all ${
                isStealthArmed
                  ? 'border-accent bg-accent/30 text-accent-text ring-1 ring-accent animate-pulse shadow-[0_0_12px_rgba(217,70,239,0.3)]'
                  : ''
              }`}
              aria-label="Toggle Stealth Guess"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{isStealthArmed ? 'STEALTH ACTIVE' : 'STEALTH (150 CR)'}</span>
            </Button>

            {/* Input buffer display */}
            <div className="flex items-center gap-1">
              {Array.from({ length: session.digits }).map((_, i) => {
                const char = input[i];
                return (
                  <div
                    key={`input-slot-${i}`}
                    data-testid={`input-slot-${i}`}
                    className={`w-7 sm:w-8 h-8 rounded border flex items-center justify-center font-data text-base font-black transition-colors ${
                      char
                        ? 'border-accent text-accent bg-panel-dark'
                        : 'border-line text-ink-muted/40 bg-panel-dark/50'
                    }`}
                  >
                    {char || '•'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 7. KEYPAD WITH DEAD DIGIT ELIMINATION */}
      <div
        data-testid="duel-keypad"
        className={`grid grid-cols-4 gap-1.5 p-2 bg-ink border-t border-line shrink-0 transition-all duration-300 ${
          isTurnBased && isPlayerTurn
            ? 'ring-1 ring-terminal-phosphor/50 shadow-[0_0_12px_rgba(111,191,122,0.15)]'
            : ''
        }`}
      >
        {orderedDigits.slice(0, 8).map((digit) => {
          const isEntered = input.includes(digit);
          const isDead = deadDigits.has(digit);
          const isLatched = session.player.latchedKeys?.includes(digit) ?? false;
          const isDisabled =
            isEntered || isDead || isLatched || session.status !== 'active' || !isPlayerTurn;

          return (
            <Button
              key={`digit-${digit}`}
              type="button"
              variant="secondary"
              data-testid={`keypad-${digit}`}
              disabled={isDisabled}
              onClick={() => handleKeyPress(digit)}
              title={
                isLatched
                  ? `Digit ${digit} locked by Key Latch Virus!`
                  : isDead
                  ? `Digit ${digit} eliminated (0 pan, 0 pot)`
                  : undefined
              }
              className={`min-h-[44px] h-11 font-data text-lg font-bold p-0 ${
                isLatched
                  ? 'border-danger/80 bg-danger/20 text-danger-text cursor-not-allowed'
                  : isDead
                  ? 'line-through opacity-30 text-ink-muted/50 border-line/20 bg-panel-dark/20 cursor-not-allowed'
                  : 'bg-panel-dark border-line text-panel-light'
              }`}
            >
              {digit}
            </Button>
          );
        })}

        {/* 9, 0, CLR, ENT */}
        {orderedDigits.slice(8, 10).map((digit) => {
          const isEntered = input.includes(digit);
          const isDead = deadDigits.has(digit);
          const isLatched = session.player.latchedKeys?.includes(digit) ?? false;
          const isDisabled =
            isEntered || isDead || isLatched || session.status !== 'active' || !isPlayerTurn;

          return (
            <Button
              key={`digit-${digit}`}
              type="button"
              variant="secondary"
              data-testid={`keypad-${digit}`}
              disabled={isDisabled}
              onClick={() => handleKeyPress(digit)}
              title={
                isLatched
                  ? `Digit ${digit} locked by Key Latch Virus!`
                  : isDead
                  ? `Digit ${digit} eliminated (0 pan, 0 pot)`
                  : undefined
              }
              className={`min-h-[44px] h-11 font-data text-lg font-bold p-0 ${
                isLatched
                  ? 'border-danger/80 bg-danger/20 text-danger-text cursor-not-allowed'
                  : isDead
                  ? 'line-through opacity-30 text-ink-muted/50 border-line/20 bg-panel-dark/20 cursor-not-allowed'
                  : 'bg-panel-dark border-line text-panel-light'
              }`}
            >
              {digit}
            </Button>
          );
        })}

        {/* CLR button */}
        <Button
          type="button"
          variant="danger"
          data-testid="keypad-clr"
          disabled={session.status !== 'active' || input.length === 0 || !isPlayerTurn}
          onClick={handleBackspace}
          aria-label="Clear Digit"
          className="min-h-[44px] h-11 font-data text-sm font-bold bg-danger/20 border-danger/50 text-danger p-0"
        >
          CLR
        </Button>

        {/* ENT button */}
        <Button
          type="button"
          variant="primary"
          data-testid="keypad-ent"
          disabled={!isInputValid || isSubmitting || session.status !== 'active' || !isPlayerTurn}
          loading={isSubmitting}
          onClick={handleSubmit}
          aria-label="Submit Guess"
          className="min-h-[44px] h-11 font-data text-sm font-bold p-0"
        >
          ENT
        </Button>
      </div>

      {/* 8. SABOTAGE PROTOCOL BAR */}
      <SabotageBar
        duelId={session.id}
        playerCredits={credits}
        shieldActive={isShielded}
        disabled={session.status !== 'active'}
        onSabotageResult={handleSabotageResult}
      />

      {confirmLeave && <Modal label="Leave this duel?" onClose={() => setConfirmLeave(false)} header={<h2 className="font-heading text-xl">Leave this duel?</h2>} footer={<div className="flex gap-2"><Button variant="secondary" onClick={() => setConfirmLeave(false)}>Keep playing</Button><Button variant="primary" onClick={onExit}>Leave duel</Button></div>}>
        <p className="font-data text-sm">Leaving ends your view of this attempt. The duel clock and any game-credit stakes are not paused.</p>
      </Modal>}

      {/* 9. RESOLUTION MODAL */}
      {session.status !== 'active' && (
        <ResolutionModal
          session={session}
          onDoubleOrNothing={handleDoubleOrNothing}
          onExit={onExit}
          isRematching={isRematching}
        />
      )}
    </div>
  );
};

interface DuelClueDisplayProps {
  pans: number;
  pots: number;
  digits: number;
  colorBlindMode?: boolean;
  parityLabel?: 'EVEN' | 'ODD';
  parityTestId?: string;
}

const DuelClueDisplay: React.FC<DuelClueDisplayProps> = ({
  pans,
  pots,
  digits,
  colorBlindMode = false,
  parityLabel,
  parityTestId = 'parity-label-badge',
}) => {
  if (parityLabel) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span
          data-testid={parityTestId}
          className="font-data text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 border border-amber-500/40"
        >
          [{parityLabel}]
        </span>
      </div>
    );
  }

  const misses = Math.max(0, digits - (pans + pots));
  const summaryText =
    pans === 0 && pots === 0
      ? '0 PAN 0 POT'
      : `${pans > 0 ? `${pans} PAN` : ''}${pans > 0 && pots > 0 ? ' ' : ''}${
          pots > 0 ? `${pots} POT` : ''
        }`;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {/* Pans: filled circle (phosphor) - right digit, right spot! */}
        {Array.from({ length: pans }).map((_, i) => (
          <div
            key={`pan-${i}`}
            data-clue="pan"
            title="Pan: Right digit, right spot"
            className="w-3.5 h-3.5 rounded-full bg-terminal-phosphor shadow-[0_0_8px_rgba(111,191,122,0.35)] flex items-center justify-center text-[8px] font-bold text-terminal-bg"
          >
            {colorBlindMode ? '●' : null}
          </div>
        ))}

        {/* Pots: hollow ring (amber) - right digit, wrong spot! */}
        {Array.from({ length: pots }).map((_, i) => (
          <div
            key={`pot-${i}`}
            data-clue="pot"
            title="Pot: Right digit, wrong spot"
            className="w-3.5 h-3.5 rounded-full border-2 border-terminal-amber bg-transparent flex items-center justify-center text-[8px] font-bold text-terminal-amber"
          >
            {colorBlindMode ? '○' : null}
          </div>
        ))}

        {/* Misses: dash (muted) */}
        {Array.from({ length: misses }).map((_, i) => (
          <div
            key={`miss-${i}`}
            data-clue="miss"
            title="Miss: Digit not in secret"
            className="w-3.5 h-3.5 flex items-center justify-center"
          >
            <div className="w-2.5 h-[2px] bg-terminal-muted rounded-full" />
          </div>
        ))}
      </div>

      <span
        className={`font-data text-xs font-bold tracking-wider uppercase font-mono ${
          pans === digits
            ? 'text-terminal-phosphor font-black'
            : pans > 0
            ? 'text-terminal-phosphor'
            : pots > 0
            ? 'text-terminal-amber'
            : 'text-terminal-muted'
        }`}
      >
        {summaryText}
      </span>
    </div>
  );
};
