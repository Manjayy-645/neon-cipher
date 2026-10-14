'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { coopService, CoopSessionView } from './coopService';
import { usePlayerStore } from '@/stores/player-store';

export interface CoopConsoleProps {
  initialSession?: CoopSessionView;
  onExit?: () => void;
}

const DEFAULT_SESSION: CoopSessionView = {
  id: 'coop-initial-session',
  status: 'active',
  startedAt: Date.now(),
  timeLimitSeconds: 180,
  bounty: 2500,
  alpha: {
    digits: 4,
    attemptsLeft: 4,
    maxAttempts: 4,
    guesses: [],
    eliminatedDigits: [],
  },
  beta: {
    currentStageIndex: 0,
    guesses: [],
    stages: [
      {
        id: 1,
        name: 'Subroutine 01: Firewall Bypass',
        digits: 3,
        rewardType: 'remove_dead_digit',
        rewardDescription: 'Eliminates 1 dead digit from Alpha keypad',
        completed: false,
      },
      {
        id: 2,
        name: 'Subroutine 02: Buffer Overflow',
        digits: 3,
        rewardType: 'extra_attempt',
        rewardDescription: 'Grants +1 guess attempt to Alpha',
        completed: false,
      },
      {
        id: 3,
        name: 'Subroutine 03: Shroud Override',
        digits: 3,
        rewardType: 'extra_attempt',
        rewardDescription: 'Grants +1 guess attempt to Alpha',
        completed: false,
      },
    ],
  },
};

export function CoopConsole({ initialSession, onExit: _onExit }: CoopConsoleProps = {}) {
  // Session State (Server Authoritative)
  const [session, setSession] = useState<CoopSessionView>(initialSession || DEFAULT_SESSION);

  // Shared Timer (180s countdown)
  const [secondsLeft, setSecondsLeft] = useState<number>(session.timeLimitSeconds);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Active Role View ('alpha' | 'beta' | 'split')
  const [activeRole, setActiveRole] = useState<'split' | 'alpha' | 'beta'>('split');
  const [partnerLog, setPartnerLog] = useState<string[]>([]);

  // Alpha (Infiltrator) State
  const [alphaGuess, setAlphaGuess] = useState<string>('');

  // Beta (Support) State
  const [betaGuess, setBetaGuess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { credits, setBalances } = usePlayerStore();

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      setSecondsLeft(initialSession.timeLimitSeconds);
    }
  }, [initialSession]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || session.status !== 'active') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          setSession((s) => ({ ...s, status: 'lost' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, session.status]);

  // Format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addPartnerMessage = (msg: string) => {
    setPartnerLog((prev) => [msg, ...prev.slice(0, 8)]);
  };

  // Mock Partner automated action simulation (if idle)
  const partnerSimRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (session.status !== 'active') return;

    partnerSimRef.current = setTimeout(() => {
      if (session.beta.currentStageIndex === 0 && !session.beta.stages[0]?.completed) {
        addPartnerMessage('Partner Glitch (Beta) scanning Subroutine 01 carrier waves...');
      }
    }, 10000);

    return () => {
      if (partnerSimRef.current) clearTimeout(partnerSimRef.current);
    };
  }, [session.beta.currentStageIndex, session.beta.stages, session.status]);

  // Alpha Guess Submission
  const handleAlphaSubmit = async () => {
    if (
      alphaGuess.length !== session.alpha.digits ||
      session.alpha.attemptsLeft <= 0 ||
      session.status !== 'active' ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await coopService.submitGuess({
        sessionId: session.id,
        role: 'alpha',
        guess: alphaGuess,
      });

      setSession(res.session);
      setAlphaGuess('');

      if (res.rewardMessage) {
        addPartnerMessage(res.rewardMessage);
      }

      if (res.session.status !== 'active') {
        setTimerActive(false);
      }

      if (res.session.status === 'won' && res.session.payout) {
        setBalances(credits + res.session.payout.eachPlayerShare, usePlayerStore.getState().coins);
      }
    } catch (err: unknown) {
      console.error('Failed to submit alpha guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Beta Guess Submission
  const handleBetaSubmit = async () => {
    const stage = session.beta.stages[session.beta.currentStageIndex];
    if (
      !stage ||
      stage.completed ||
      betaGuess.length !== stage.digits ||
      session.status !== 'active' ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await coopService.submitGuess({
        sessionId: session.id,
        role: 'beta',
        guess: betaGuess,
      });

      setSession(res.session);
      setBetaGuess('');

      if (res.rewardMessage) {
        addPartnerMessage(res.rewardMessage);
      }
    } catch (err: unknown) {
      console.error('Failed to submit beta guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick bot solve for Beta (Simulate partner cracking)
  const handleSimulatePartnerSolve = async () => {
    if (session.status !== 'active' || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await coopService.simulatePartnerStage(session.id);
      setSession(res.session);
      if (res.rewardMessage) {
        addPartnerMessage(res.rewardMessage);
      }
    } catch (err: unknown) {
      console.error('Failed to simulate partner solve:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBetaStage = session.beta.stages[session.beta.currentStageIndex];

  return (
    <div className="scene-ground w-full flex-1 flex flex-col text-ink overflow-y-auto pb-[env(safe-area-inset-bottom)] select-none">
      {/* Top Console Header & Shared Timer (Requirement 2) */}
      <div className="bg-panel-light border-b border-line px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <span className="font-data text-[10px] uppercase tracking-[1.5px] text-ink-muted block">
            CO-OP HEIST CONSOLE // TWO-MAN RIG LINK
          </span>
          <h1 className="font-heading text-lg font-bold text-ink">
            Synchronized Heist
          </h1>
        </div>

        {/* SHARED COUNTDOWN TIMER */}
        <div
          data-testid="shared-countdown"
          className={`px-3 py-1.5 rounded-sm border font-data text-xs font-bold tracking-wider flex items-center gap-2 ${
            secondsLeft < 30
              ? 'bg-danger/20 border-danger text-danger-text animate-pulse'
              : 'bg-panel border-line text-ink'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span>CREW TIME: {formatTime(secondsLeft)}</span>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="bg-panel border-b border-line px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={activeRole === 'split' ? 'primary' : 'secondary'}
            compact
            onClick={() => setActiveRole('split')}
            data-testid="view-split-button"
          >
            Split Console
          </Button>
          <Button
            type="button"
            variant={activeRole === 'alpha' ? 'primary' : 'secondary'}
            compact
            onClick={() => setActiveRole('alpha')}
            data-testid="view-alpha-button"
          >
            Alpha (Infiltrator)
          </Button>
          <Button
            type="button"
            variant={activeRole === 'beta' ? 'primary' : 'secondary'}
            compact
            onClick={() => setActiveRole('beta')}
            data-testid="view-beta-button"
          >
            Beta (Support)
          </Button>
        </div>

        {/* Partner Action Simulator */}
        <Button
          type="button"
          variant="secondary"
          compact
          onClick={handleSimulatePartnerSolve}
          disabled={session.status !== 'active' || isSubmitting}
          data-testid="partner-solve-button"
          className="text-accent-text flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Partner Bot Solve Stage</span>
        </Button>
      </div>

      {/* Heist Outcome Banner */}
      {session.status === 'won' && (
        <div
          data-testid="heist-won-banner"
          className="bg-accent text-white p-3 font-data text-xs font-bold uppercase text-center shrink-0 tracking-wider flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
            <path d="M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4Z" />
          </svg>
          <span>VAULT BREACH SUCCESSFUL // All syndicate dividends secured!</span>
        </div>
      )}
      {session.status === 'lost' && (
        <div
          data-testid="heist-lost-banner"
          className="bg-danger text-white p-3 font-data text-xs font-bold uppercase text-center shrink-0 tracking-wider flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>HEIST TRACED // Connection terminated by counter-ICE.</span>
        </div>
      )}

      {/* Console Feeds Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-4xl mx-auto w-full">
        {/* ============================================================ */}
        {/* ROLE ALPHA (INFILTRATOR) VIEW */}
        {/* ============================================================ */}
        {(activeRole === 'split' || activeRole === 'alpha') && (
          <div
            data-testid="role-alpha-container"
            className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3"
          >
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <span className="font-data text-[10px] uppercase tracking-wider text-accent-text font-bold block">
                  ROLE ALPHA // INFILTRATOR
                </span>
                <h2 className="font-heading text-base font-bold text-ink">
                  Central Vault Master Code
                </h2>
              </div>
              <span
                data-testid="alpha-attempts-left"
                className="font-data text-xs font-bold bg-accent/15 text-accent-text border border-accent/40 px-2.5 py-1 rounded-pill"
              >
                {session.alpha.attemptsLeft} ATTEMPTS LEFT
              </span>
            </div>

            {/* Eliminated Dead Digits from Beta Support */}
            {session.alpha.eliminatedDigits.length > 0 && (
              <div
                data-testid="eliminated-digits-banner"
                className="bg-accent/10 border border-accent/30 text-accent-text p-2 rounded-sm font-data text-[11px] flex items-center justify-between"
              >
                <span>SUPPORT BUFF: Dead Digits Purged</span>
                <span className="font-bold">[{session.alpha.eliminatedDigits.join(', ')}]</span>
              </div>
            )}

            {/* Alpha Code Input */}
            <div className="flex flex-col gap-2 bg-panel p-3 rounded-sm border border-line">
              <span className="font-data text-xs text-ink-muted">ENTER 4-DIGIT CODE:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={alphaGuess}
                  onChange={(e) => setAlphaGuess(e.target.value.replace(/\D/g, ''))}
                  placeholder="----"
                  disabled={session.status !== 'active' || isSubmitting}
                  data-testid="alpha-guess-input"
                  className="flex-1 min-h-[44px] px-3 bg-panel-light border border-line text-center font-data text-xl font-bold tracking-[6px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  aria-label="Alpha guess code"
                />
                <Button
                  type="button"
                  variant="primary"
                  compact
                  onClick={handleAlphaSubmit}
                  disabled={alphaGuess.length !== 4 || session.status !== 'active' || isSubmitting}
                  data-testid="alpha-submit-button"
                >
                  INJECT
                </Button>
              </div>

              {/* Keypad Digits */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {'0123456789'.split('').map((d) => {
                  const isDead = session.alpha.eliminatedDigits.includes(d);
                  return (
                    <Button
                      key={d}
                      type="button"
                      variant="secondary"
                      compact
                      disabled={isDead || alphaGuess.length >= 4 || session.status !== 'active' || isSubmitting}
                      onClick={() => setAlphaGuess((prev) => prev + d)}
                      className={`min-h-[40px] p-0 text-xs font-bold ${
                        isDead ? 'line-through opacity-40' : ''
                      }`}
                    >
                      {d}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Alpha Guess History */}
            <div className="flex-1 flex flex-col gap-1 min-h-[120px] max-h-[200px] overflow-y-auto">
              <span className="font-data text-[10px] uppercase text-ink-muted">INFILTRATOR PROBE LOG:</span>
              {session.alpha.guesses.length === 0 ? (
                <span className="font-data text-xs text-ink-muted italic">Awaiting initial guess...</span>
              ) : (
                [...session.alpha.guesses].reverse().map((rec, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center font-data text-xs p-1.5 bg-panel border border-line rounded-sm"
                  >
                    <span className="font-bold tracking-wider">{rec.guess}</span>
                    <div className="flex gap-2">
                      <span className="text-accent-text font-bold">● {rec.pots} POT</span>
                      <span className="text-money-text font-bold">○ {rec.pans} PAN</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROLE BETA (SUPPORT) VIEW */}
        {/* ============================================================ */}
        {(activeRole === 'split' || activeRole === 'beta') && (
          <div
            data-testid="role-beta-container"
            className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3"
          >
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <span className="font-data text-[10px] uppercase tracking-wider text-money-text font-bold block">
                  ROLE BETA // SUPPORT HACKER
                </span>
                <h2 className="font-heading text-base font-bold text-ink">
                  Auxiliary Subroutines
                </h2>
              </div>
              <span className="font-data text-xs font-bold text-ink-muted">
                STAGE {Math.min(session.beta.currentStageIndex + 1, session.beta.stages.length)} / {session.beta.stages.length}
              </span>
            </div>

            {/* Current Beta Stage Info */}
            <div className="bg-panel p-3 rounded-sm border border-line flex flex-col gap-1">
              <span className="font-heading text-sm font-bold text-ink">
                {currentBetaStage?.name || 'All Subroutines Cleared'}
              </span>
              <span className="font-data text-xs text-accent-text font-semibold">
                REWARD: {currentBetaStage?.rewardDescription || 'Full support online'}
              </span>
            </div>

            {/* Beta Code Input */}
            <div className="flex flex-col gap-2 bg-panel p-3 rounded-sm border border-line">
              <span className="font-data text-xs text-ink-muted">
                SOLVE 3-DIGIT AUXILIARY CODE:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={betaGuess}
                  onChange={(e) => setBetaGuess(e.target.value.replace(/\D/g, ''))}
                  placeholder="---"
                  disabled={session.status !== 'active' || !currentBetaStage || currentBetaStage.completed || isSubmitting}
                  data-testid="beta-guess-input"
                  className="flex-1 min-h-[44px] px-3 bg-panel-light border border-line text-center font-data text-xl font-bold tracking-[6px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  aria-label="Beta guess code"
                />
                <Button
                  type="button"
                  variant="primary"
                  compact
                  onClick={handleBetaSubmit}
                  disabled={betaGuess.length !== 3 || session.status !== 'active' || isSubmitting}
                  data-testid="beta-submit-button"
                >
                  BYPASS
                </Button>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {'0123456789'.split('').map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="secondary"
                    compact
                    disabled={betaGuess.length >= 3 || session.status !== 'active' || isSubmitting}
                    onClick={() => setBetaGuess((prev) => prev + d)}
                    className="min-h-[40px] p-0 text-xs font-bold"
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>

            {/* Beta Log */}
            <div className="flex-1 flex flex-col gap-1 min-h-[120px] max-h-[200px] overflow-y-auto">
              <span className="font-data text-[10px] uppercase text-ink-muted">SUBROUTINE BYPASS LOG:</span>
              {session.beta.guesses.length === 0 ? (
                <span className="font-data text-xs text-ink-muted italic">Crack this stage to empower Alpha...</span>
              ) : (
                [...session.beta.guesses].reverse().map((rec, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center font-data text-xs p-1.5 bg-panel border border-line rounded-sm"
                  >
                    <span className="font-bold tracking-wider">{rec.guess}</span>
                    <div className="flex gap-2">
                      <span className="text-accent-text font-bold">● {rec.pots} POT</span>
                      <span className="text-money-text font-bold">○ {rec.pans} PAN</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Crew Comms Feed Log */}
      <div className="px-4 pb-4 max-w-4xl mx-auto w-full">
        <div
          data-testid="coop-comms-feed"
          className="bg-panel-light p-3 rounded-md border border-line shadow-card flex flex-col gap-1.5"
        >
          <span className="font-data text-[10px] uppercase tracking-wider text-ink-muted font-bold">
            CREW COMMS // LIVE DATA LINK
          </span>
          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto text-xs font-data">
            {partnerLog.length === 0 ? (
              <span className="text-ink-muted italic">Secure audio channel linked. Glitch standing by on Support.</span>
            ) : (
              partnerLog.map((log, i) => (
                <div key={i} className="text-ink flex items-center gap-2">
                  <span className="text-accent font-bold">›</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
