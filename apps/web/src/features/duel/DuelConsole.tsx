'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DuelSession, DuelGuess, DuelMatchType } from './types';
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
import { validateGuess, isExploitAllowed } from '@neon-cipher/game-rules/src/index';

import { useDuelStore } from '@/stores/duel-store';
import { Button } from '@/components/ui/Button';

export interface DuelConsoleProps {
  initialSession?: DuelSession;
  onExit?: () => void;
}

// Scrambled keypad order when under scramble_keypad attack
const SCRAMBLED_DIGITS = ['7', '2', '9', '4', '0', '6', '1', '8', '3', '5'];
const STANDARD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const DuelConsole: React.FC<DuelConsoleProps> = ({ initialSession, onExit: propsOnExit } = {}) => {
  const storeSession = useDuelStore((s) => s.activeSession);
  const storeExit = useDuelStore((s) => s.exitDuel);
  const storeMobileTab = useDuelStore((s) => s.activeMobileTab);
  const setStoreMobileTab = useDuelStore((s) => s.setMobileTab);
  const activeSessionFromStore = initialSession || storeSession;

  const [session, setSession] = useState<DuelSession | null>(activeSessionFromStore);
  const [mobileTab, setMobileTab] = useState<'player' | 'rival'>(storeMobileTab || 'player');
  const [input, setInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [turnClock, setTurnClock] = useState<number>(activeSessionFromStore?.turnClockSeconds || 30);
  const [activeCheat, setActiveCheat] = useState<boolean>(false);
  const [drainAlert, setDrainAlert] = useState<boolean>(false);
  const [isStealthArmed, setIsStealthArmed] = useState<boolean>(false);

  useEffect(() => {
    if (activeSessionFromStore) {
      setSession(activeSessionFromStore);
    }
  }, [activeSessionFromStore]);

  useEffect(() => {
    if (storeMobileTab) {
      setMobileTab(storeMobileTab);
    }
  }, [storeMobileTab]);

  const handleTabChange = (tab: 'player' | 'rival') => {
    setMobileTab(tab);
    setStoreMobileTab(tab);
  };

  const onExit = propsOnExit || storeExit;

  const { credits, setBalances } = usePlayerStore();
  const colorBlindMode = useSettingsStore((s) => s.colorBlindMode);

  const isScrambled = session?.player.activeEffects.includes('scramble_keypad') ?? false;
  const hasStatic = session?.player.activeEffects.includes('static_history') ?? false;
  const isShielded = session?.player.shieldActive ?? false;
  const isCasual = session?.matchType === 'casual';
  const exploitCheck = session ? isExploitAllowed(session.matchType) : { allowed: false };

  // Turn clock countdown
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const interval = setInterval(() => {
      setTurnClock((prev) => {
        if (prev <= 1) {
          return 30; // Reset turn clock
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.status]);

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

  if (!session) {
    return (
      <div data-testid="duel-console-loading" className="h-full flex items-center justify-center font-data text-accent text-xs">
        INITIALIZING DUEL MATRIX...
      </div>
    );
  }

  const isInputValid = validateGuess(input, session.digits, false);

  // Keypad keys layout (reorders when scrambled)
  const orderedDigits = isScrambled ? SCRAMBLED_DIGITS : STANDARD_DIGITS;

  return (
    <div
      data-testid="duel-console"
      data-surface="terminal"
      className="flex flex-col h-full w-full bg-panel-dark text-panel-light overflow-hidden relative select-none"
    >
      {/* 1. STATUS BAR: Opponent handle, attempts left, server clock, shield */}
      <header
        data-testid="duel-status-bar"
        className="flex justify-between items-center px-2.5 sm:px-3 py-2 bg-ink border-b border-line shrink-0 z-20 gap-2"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-panel-dark border border-line flex items-center justify-center text-sm shrink-0">
            {session.rival.avatar}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-data text-xs font-bold text-panel-light truncate max-w-[85px] sm:max-w-[140px]">
                {session.rival.handle}
              </span>
              <span className="font-data text-[8px] sm:text-[9px] uppercase px-1 py-0.2 rounded bg-danger/20 text-danger border border-danger/30 shrink-0">
                AI
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

          {/* Shared Attempts Pool */}
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

      {/* 2. MOBILE SEGMENTED TOGGLE (Visible on small screens only) */}
      <div className="md:hidden flex border-b border-line bg-ink/70 shrink-0">
        <Button
          type="button"
          variant="ghost"
          data-testid="tab-you"
          onClick={() => handleTabChange('player')}
          className={`flex-1 min-h-[44px] py-2 px-3 font-data text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-none border-t-0 border-l-0 border-r-0 ${
            mobileTab === 'player'
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
          className={`flex-1 min-h-[44px] py-2 px-3 font-data text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-none border-t-0 border-l-0 border-r-0 ${
            mobileTab === 'rival'
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
        </Button>
      </div>

      {/* 3. GUESS STREAMS: Mobile shows selected tab; md+ shows side-by-side */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line relative">
        {/* PLAYER FEED */}
        <div
          data-testid="player-stream"
          className={`flex flex-col h-full overflow-hidden relative ${
            mobileTab === 'player' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="px-3 py-1.5 bg-ink/40 border-b border-line/40 flex justify-between items-center text-xs font-data text-accent">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-accent/40 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.player.avatar || '/Character portraits/Player avatars.png'}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="uppercase font-bold tracking-wider">YOUR CRACK STREAM</span>
            </div>
            <span className="text-[10px] text-ink-muted">
              {session.player.guesses.length} TRIES
            </span>
          </div>

          <div
            data-testid="player-guess-stream"
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 relative"
          >
            {/* Sabotage static overlay over player history */}
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

            {session.player.guesses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-muted font-data text-xs uppercase tracking-widest opacity-50">
                Awaiting initial input
              </div>
            ) : (
              session.player.guesses.map((g, idx) => (
                <div
                  key={`player-guess-${idx}`}
                  data-testid={`player-guess-row-${idx}`}
                  className="flex items-center justify-between bg-panel-dark/80 px-3 py-2 rounded border border-line text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-data font-black text-panel-light tracking-[0.25em]">
                      {g.guess}
                    </span>
                    {g.cheatUsed && (
                      <span className="font-data text-[9px] px-1 py-0.2 bg-danger/20 text-danger border border-danger/40 rounded uppercase">
                        CHEAT
                      </span>
                    )}
                    {g.isStealth && (
                      <span className="font-data text-[9px] px-1 py-0.2 bg-accent/20 text-accent border border-accent/40 rounded uppercase">
                        STEALTH
                      </span>
                    )}
                    {g.falsified && (
                      <span className="font-data text-[9px] px-1 py-0.2 bg-money/20 text-money-text border border-money/40 rounded uppercase">
                        SPOOFED
                      </span>
                    )}
                  </div>

                  <GuessClueDisplay pots={g.pots} pans={g.pans} digits={session.digits} colorBlindMode={colorBlindMode} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIVAL FEED */}
        <div
          data-testid="rival-stream"
          className={`flex flex-col h-full overflow-hidden relative ${
            mobileTab === 'rival' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="px-3 py-1.5 bg-ink/40 border-b border-line/40 flex justify-between items-center text-xs font-data text-danger-text">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-danger/40 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Character portraits/Null_Byte.png"
                  alt={session.rival.handle}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="uppercase font-bold tracking-wider">
                RIVAL STREAM [{session.rival.handle}]
              </span>
            </div>
            <span className="text-[10px] text-ink-muted">
              {session.rival.guesses.length} TRIES
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {session.rival.guesses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-muted font-data text-xs uppercase tracking-widest opacity-50">
                Opponent analyzing node...
              </div>
            ) : (
              session.rival.guesses.map((g, idx) => (
                <div
                  key={`rival-guess-${idx}`}
                  data-testid={`rival-guess-row-${idx}`}
                  className="flex items-center justify-between bg-panel-dark/80 px-3 py-2 rounded border border-danger/30 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {g.isStealth && !g.unmasked ? (
                      <span className="font-data font-bold text-ink-muted italic text-xs tracking-wider">
                        [ENCRYPTED MOVE]
                      </span>
                    ) : (
                      <span className="font-data font-black text-panel-light tracking-[0.25em]">
                        {g.guess}
                      </span>
                    )}
                    {g.isStealth && (
                      <span className="font-data text-[9px] px-1 py-0.2 bg-accent/20 text-accent border border-accent/40 rounded uppercase">
                        {g.unmasked ? 'UNMASKED' : 'STEALTH'}
                      </span>
                    )}
                  </div>

                  <GuessClueDisplay pots={g.pots} pans={g.pans} digits={session.digits} colorBlindMode={colorBlindMode} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. SCRAMBLE NOTIFICATION BANNER */}
      <ScrambleKeypadBanner active={isScrambled} />

      {/* 5. EXPLOIT TOGGLE (CASUAL ONLY) / EXPLOIT RESTRICTION BADGE (RANKED) */}
      <div className="px-3 py-1 bg-ink border-t border-line/50 flex items-center justify-between text-xs font-data">
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

      {/* 6. KEYPAD */}
      <div
        data-testid="duel-keypad"
        className="grid grid-cols-4 gap-1.5 p-2 bg-ink border-t border-line shrink-0"
      >
        {orderedDigits.slice(0, 8).map((digit) => {
          const isEntered = input.includes(digit);
          return (
            <Button
              key={`digit-${digit}`}
              type="button"
              variant="secondary"
              data-testid={`keypad-${digit}`}
              disabled={isEntered || session.status !== 'active'}
              onClick={() => handleKeyPress(digit)}
              className="min-h-[44px] h-11 font-data text-lg font-bold bg-panel-dark border-line text-panel-light p-0"
            >
              {digit}
            </Button>
          );
        })}

        {/* 9, 0, CLR, ENT */}
        {orderedDigits.slice(8, 10).map((digit) => {
          const isEntered = input.includes(digit);
          return (
            <Button
              key={`digit-${digit}`}
              type="button"
              variant="secondary"
              data-testid={`keypad-${digit}`}
              disabled={isEntered || session.status !== 'active'}
              onClick={() => handleKeyPress(digit)}
              className="min-h-[44px] h-11 font-data text-lg font-bold bg-panel-dark border-line text-panel-light p-0"
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
          disabled={session.status !== 'active' || input.length === 0}
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
          disabled={!isInputValid || isSubmitting || session.status !== 'active'}
          loading={isSubmitting}
          onClick={handleSubmit}
          aria-label="Submit Guess"
          className="min-h-[44px] h-11 font-data text-sm font-bold p-0"
        >
          ENT
        </Button>
      </div>

      {/* 7. SABOTAGE PROTOCOL BAR */}
      <SabotageBar
        duelId={session.id}
        playerCredits={credits}
        shieldActive={isShielded}
        disabled={session.status !== 'active'}
        onSabotageResult={handleSabotageResult}
      />

      {/* 8. RESOLUTION MODAL */}
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

interface GuessClueDisplayProps {
  pots: number;
  pans: number;
  digits: number;
  colorBlindMode: boolean;
}

const GuessClueDisplay: React.FC<GuessClueDisplayProps> = ({
  pots,
  pans,
  digits,
  colorBlindMode,
}) => {
  const misses = Math.max(0, digits - (pots + pans));

  if (colorBlindMode) {
    return (
      <div className="flex gap-1.5 items-center">
        {/* Pot = solid square */}
        {Array.from({ length: pots }).map((_, p) => (
          <div
            key={`cb-pot-${p}`}
            title="Pot"
            className="w-3.5 h-3.5 bg-panel-light text-ink rounded-[2px] flex items-center justify-center font-data text-[9px] font-black"
          >
            ■
          </div>
        ))}
        {/* Pan = ring */}
        {Array.from({ length: pans }).map((_, p) => (
          <div
            key={`cb-pan-${p}`}
            title="Pan"
            className="w-3.5 h-3.5 rounded-full border-2 border-panel-light flex items-center justify-center text-[8px]"
          >
            ○
          </div>
        ))}
        {/* Miss = dash */}
        {Array.from({ length: misses }).map((_, p) => (
          <div key={`cb-miss-${p}`} className="w-3.5 h-3.5 flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-ink-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 items-center">
      {/* Pots: filled circle */}
      {Array.from({ length: pots }).map((_, p) => (
        <div
          key={`pot-${p}`}
          title="Pot (Correct slot)"
          className="w-3 h-3 rounded-full bg-accent"
        />
      ))}
      {/* Pans: hollow ring */}
      {Array.from({ length: pans }).map((_, p) => (
        <div
          key={`pan-${p}`}
          title="Pan (Wrong slot)"
          className="w-3 h-3 rounded-full border-2 border-money"
        />
      ))}
      {/* Misses: dash */}
      {Array.from({ length: misses }).map((_, p) => (
        <div key={`miss-${p}`} className="w-3 h-3 flex items-center justify-center">
          <div className="w-2 h-0.5 bg-ink-muted" />
        </div>
      ))}
    </div>
  );
};
