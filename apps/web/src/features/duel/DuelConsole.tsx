'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DuelSession, DuelGuess, DuelFeedEvent } from './types';
import { duelService } from './duelService';
import { SabotageBar } from './SabotageBar';
import {
  StaticHistoryOverlay,
  ScrambleKeypadBanner,
  ClockDrainAlert,
  ShieldAlert,
} from './SabotageOverlay';
import { ResolutionModal } from './ResolutionModal';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import { validateGuess, isExploitAllowed } from '@neon-cipher/game-rules';

import { useDuelStore } from '@/stores/duel-store';
import { Button } from '@/components/ui/Button';

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
  const [feedFilter, setFeedFilter] = useState<'all' | 'player' | 'rival'>(
    storeMobileTab || 'player'
  );
  const [mobileTab, setMobileTab] = useState<'player' | 'rival'>(storeMobileTab || 'player');
  const [input, setInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [activeCheat, setActiveCheat] = useState<boolean>(false);
  const [drainAlert, setDrainAlert] = useState<boolean>(false);
  const [isStealthArmed, setIsStealthArmed] = useState<boolean>(false);

  // Clocks
  const [turnClock, setTurnClock] = useState<number>(activeSessionFromStore?.turnClockSeconds || 20);
  const [playerClockMs, setPlayerClockMs] = useState<number>(activeSessionFromStore?.playerClockMs || 20000);
  const [rivalClockMs, setRivalClockMs] = useState<number>(activeSessionFromStore?.rivalClockMs || 20000);

  // Unread indicator for rival guesses
  const [unreadRivalCount, setUnreadRivalCount] = useState<number>(0);
  const lastSeenRivalGuessesCount = useRef<number>(activeSessionFromStore?.rival.guesses.length || 0);

  useEffect(() => {
    if (activeSessionFromStore) {
      setSession(activeSessionFromStore);
    }
  }, [activeSessionFromStore]);

  useEffect(() => {
    if (storeMobileTab) {
      setMobileTab(storeMobileTab);
      if (feedFilter !== 'all') {
        setFeedFilter(storeMobileTab);
      }
    }
  }, [storeMobileTab, feedFilter]);

  const handleTabChange = (tab: 'all' | 'player' | 'rival') => {
    setFeedFilter(tab);
    if (tab === 'player' || tab === 'rival') {
      setMobileTab(tab);
      setStoreMobileTab(tab);
    }
    if (tab === 'rival' || tab === 'all') {
      setUnreadRivalCount(0);
      if (session) {
        lastSeenRivalGuessesCount.current = session.rival.guesses.length;
      }
    }
  };

  const onExit = propsOnExit || storeExit;

  const { credits, setBalances } = usePlayerStore();
  const colorBlindMode = useSettingsStore((s) => s.colorBlindMode);

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
        if (prev <= 1) return session.guessClockMs ? Math.ceil(session.guessClockMs / 1000) : 20;
        return prev - 1;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [session?.status, session?.guessClockMs]);

  // Resync clocks when session updates
  useEffect(() => {
    if (session) {
      if (session.playerClockMs !== undefined) {
        setPlayerClockMs(session.playerClockMs);
      }
      if (session.rivalClockMs !== undefined) {
        setRivalClockMs(session.rivalClockMs);
      }
      if (session.turnClockSeconds !== undefined) {
        setTurnClock(session.turnClockSeconds);
      }
    }
  }, [session?.playerClockMs, session?.rivalClockMs, session?.turnClockSeconds]);

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
      setTurnClock(res.session.turnClockSeconds);
      setPlayerClockMs(res.session.playerClockMs || 20000);
      setRivalClockMs(res.session.rivalClockMs || 20000);

      // If duel finished and player won, sync net payout to player store
      if (res.session.status === 'player_won') {
        const newCredits = credits + res.session.netPot;
        setBalances(newCredits, usePlayerStore.getState().coins);
      }
    } catch (err: unknown) {
      console.error('Failed to submit duel guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [input, isSubmitting, session, activeCheat, isCasual, isStealthArmed, credits, setBalances]);

  // Handle keypad input
  const handleKeyPress = useCallback((digit: string) => {
    if (!session) return;
    if (session.pacingMode === 'turn_based' && session.currentTurn !== 'player') return;
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

    if (result.effectApplied === 'firewall_shield') {
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
    if (last.isStealth && !last.unmasked) return '[ENCRYPTED]';
    if (last.pans === 0 && last.pots === 0) return '0 PAN 0 POT';
    return `${last.pans > 0 ? `${last.pans} PAN ` : ''}${last.pots > 0 ? `${last.pots} POT` : ''}`.trim();
  }, [session]);

  if (!session) {
    return (
      <div data-testid="duel-console-loading" className="h-full flex items-center justify-center font-data text-accent text-xs">
        INITIALIZING DUEL MATRIX...
      </div>
    );
  }

  const isInputValid = validateGuess(input, session.digits, false);
  const orderedDigits = isScrambled ? SCRAMBLED_DIGITS : STANDARD_DIGITS;

  const guessClockMax = session.guessClockMs || 20000;
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
      className="flex flex-col h-full w-full bg-panel-dark text-panel-light overflow-hidden relative select-none"
    >
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
            onClick={onExit}
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
        className="flex-1 overflow-hidden flex flex-col relative"
      >
        <div
          data-testid="player-guess-stream"
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 relative"
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

          {filteredFeedEvents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-ink-muted font-data text-xs uppercase tracking-widest opacity-50">
              Awaiting initial matrix calculations...
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
                      {isYou ? 'YOU' : `RIVAL [${session.rival.handle}]`}
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
                      <span className="font-data font-black text-panel-light tracking-[0.25em]">
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
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. SCRAMBLE NOTIFICATION BANNER */}
      <ScrambleKeypadBanner active={isScrambled} />

      {/* 6. MODIFIER TOGGLES & PLAYER 20S GUESS CLOCK BAR */}
      <div className="px-3 py-1.5 bg-ink border-t border-line/50 flex flex-col gap-1.5 text-xs font-data">
        {/* Player 20s Guess Clock bar */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-accent-text flex items-center gap-1.5">
            <span>{isTurnBased ? (isPlayerTurn ? 'YOUR TURN' : 'WAITING FOR RIVAL...') : 'GUESS CLOCK'}</span>
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

        {/* Modifiers row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {isCasual ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={activeCheat ? 'danger' : 'secondary'}
                compact
                data-testid="casual-exploit-toggle"
                onClick={() => setActiveCheat(!activeCheat)}
                className="text-[11px] flex items-center gap-1.5"
              >
                {activeCheat && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                <span>{activeCheat ? 'CHEAT ARMED' : 'ARM CASUAL CHEAT'}</span>
              </Button>
              <span className="text-[10px] text-ink-muted hidden sm:inline">
                (Permitted in casual with &apos;cheat used&apos; flag)
              </span>
            </div>
          ) : (
            <div
              data-testid="exploits-disabled-badge"
              className="flex items-center gap-1.5 text-ink-muted text-[10px] uppercase tracking-wider"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>EXPLOITS STRICTLY DISABLED IN RANKED MATCHES</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isStealthArmed ? 'primary' : 'secondary'}
              compact
              data-testid="stealth-guess-toggle"
              disabled={session.status !== 'active' || credits < 150}
              onClick={() => setIsStealthArmed(!isStealthArmed)}
              className="text-[11px] flex items-center gap-1.5"
              aria-label="Toggle Stealth Guess"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                    className={`w-7 h-8 rounded border flex items-center justify-center font-data text-base font-black ${
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
        className="grid grid-cols-4 gap-1.5 p-2 bg-ink border-t border-line shrink-0"
      >
        {orderedDigits.slice(0, 8).map((digit) => {
          const isEntered = input.includes(digit);
          const isDead = deadDigits.has(digit);
          const isDisabled =
            isEntered || isDead || session.status !== 'active' || !isPlayerTurn;

          return (
            <Button
              key={`digit-${digit}`}
              type="button"
              variant="secondary"
              data-testid={`keypad-${digit}`}
              disabled={isDisabled}
              onClick={() => handleKeyPress(digit)}
              title={isDead ? `Digit ${digit} eliminated (0 pan, 0 pot)` : undefined}
              className={`min-h-[44px] h-11 font-data text-lg font-bold p-0 ${
                isDead
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
          const isDisabled =
            isEntered || isDead || session.status !== 'active' || !isPlayerTurn;

          return (
            <Button
              key={`digit-${digit}`}
              type="button"
              variant="secondary"
              data-testid={`keypad-${digit}`}
              disabled={isDisabled}
              onClick={() => handleKeyPress(digit)}
              title={isDead ? `Digit ${digit} eliminated (0 pan, 0 pot)` : undefined}
              className={`min-h-[44px] h-11 font-data text-lg font-bold p-0 ${
                isDead
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
}

const DuelClueDisplay: React.FC<DuelClueDisplayProps> = ({
  pans,
  pots,
  digits,
  colorBlindMode = false,
}) => {
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
