'use client';

import { useFocusedFlow } from '@/stores/overlay-store';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { coopService, CoopSessionView, CoopHeistView } from './coopService';
import { usePlayerStore } from '@/stores/player-store';
import {
  getNixRoleBriefing,
  getNixCoopCallout,
  HEIST_STAGES,
  CoopRole,
  normalizeCoopRole,
  CoopTelemetryEvent,
  NixCoopCallout,
  DUAL_KEY_SYNC_WINDOW_MS,
} from '@neon-cipher/game-rules';

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

export function CoopConsole({ initialSession, onExit }: CoopConsoleProps = {}) {
  useFocusedFlow();
  // Session State (Server Authoritative)
  const [session, setSession] = useState<CoopSessionView>(initialSession || DEFAULT_SESSION);

  // Determine whether this session uses the 3-Stage Heist Engine
  const is3Stage = Boolean(session.heist);
  const heist = session.heist;

  // Active Role View ('alpha' | 'bravo' | 'split')
  const [activeRole, setActiveRole] = useState<'split' | 'alpha' | 'beta'>('split');
  const [playerRole, setPlayerRole] = useState<'ALPHA' | 'BRAVO'>(
    heist?.playerRole ? normalizeCoopRole(heist.playerRole) : 'BRAVO'
  );
  const [showBriefingCard, setShowBriefingCard] = useState<boolean>(!initialSession);

  // Countdown clock state
  const [secondsLeft, setSecondsLeft] = useState<number>(
    heist ? Math.floor(heist.sharedClockMsRemaining / 1000) : session.timeLimitSeconds
  );
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Sync window countdown for Stage 1 (ms remaining)
  const [syncMsLeft, setSyncMsLeft] = useState<number | null>(
    heist?.stage1.syncWindowMsRemaining ?? null
  );

  // Stage transition hardware latch banner display
  const [showStageLatchBanner, setShowStageLatchBanner] = useState<boolean>(false);
  const [prevStage, setPrevStage] = useState<number>(heist?.currentStage || 1);

  // Active Nix Guidance Callout
  const [nixCallout, setNixCallout] = useState<NixCoopCallout | null>(
    heist?.latestTelemetryEvent
      ? getNixCoopCallout(heist.latestTelemetryEvent, playerRole)
      : null
  );

  // Local input buffers
  const [stage1Guess, setStage1Guess] = useState<string>('');
  const [stage2Guess, setStage2Guess] = useState<string>('');
  const [stage3Guess, setStage3Guess] = useState<string>('');
  const [alphaGuess, setAlphaGuess] = useState<string>('');
  const [betaGuess, setBetaGuess] = useState<string>('');
  const [partnerLog, setPartnerLog] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { credits, setBalances } = usePlayerStore();

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      if (initialSession.heist) {
        setSecondsLeft(Math.floor(initialSession.heist.sharedClockMsRemaining / 1000));
        setSyncMsLeft(initialSession.heist.stage1.syncWindowMsRemaining);
        setPlayerRole(normalizeCoopRole(initialSession.heist.playerRole));
      } else {
        setSecondsLeft(initialSession.timeLimitSeconds);
      }
    }
  }, [initialSession]);

  // Stage transition banner detection
  useEffect(() => {
    if (heist && heist.currentStage !== prevStage) {
      setPrevStage(heist.currentStage);
      setShowStageLatchBanner(true);
      const timer = setTimeout(() => setShowStageLatchBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [heist?.currentStage, prevStage]);

  // Shared Trace Clock Timer
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

      // Stage 1 sync window tick
      if (heist?.currentStage === 1 && syncMsLeft !== null && syncMsLeft > 0) {
        setSyncMsLeft((prev) => {
          if (prev === null) return null;
          const next = Math.max(0, prev - 1000);
          if (next === 0) {
            // Trigger server sync timeout tick
            coopService.syncTick(session.id, 1000).then((res) => {
              if (res.session) setSession(res.session);
            });
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, session.status, heist?.currentStage, syncMsLeft, session.id]);

  // Update Nix callout whenever telemetry changes
  useEffect(() => {
    if (heist?.latestTelemetryEvent) {
      const callout = getNixCoopCallout(heist.latestTelemetryEvent, playerRole);
      if (callout) setNixCallout(callout);
    }
  }, [heist?.latestTelemetryEvent, playerRole]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addPartnerMessage = (msg: string) => {
    setPartnerLog((prev) => [msg, ...prev.slice(0, 8)]);
  };

  // Launch 3-Stage Heist Session
  const handleStartHeist = async (selectedRole: 'ALPHA' | 'BRAVO') => {
    setIsSubmitting(true);
    try {
      const newSession = await coopService.startSession({
        playerRole: selectedRole,
        mode: '3-stage',
        isBotPartner: true,
      });
      setSession(newSession);
      setPlayerRole(selectedRole);
      setShowBriefingCard(false);
      setTimerActive(true);
      if (newSession.heist) {
        setSecondsLeft(Math.floor(newSession.heist.sharedClockMsRemaining / 1000));
      }
    } catch (err: unknown) {
      console.error('Failed to start heist session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 1 Guess Submit
  const handleStage1Submit = async () => {
    if (!heist || stage1Guess.length !== 3 || isSubmitting || session.status !== 'active') return;
    setIsSubmitting(true);
    try {
      const res = await coopService.submitGuess({
        sessionId: session.id,
        role: playerRole,
        guess: stage1Guess,
      });
      setSession(res.session);
      setStage1Guess('');
      if (res.rewardMessage) addPartnerMessage(res.rewardMessage);
      if (res.event) {
        const callout = getNixCoopCallout(res.event, playerRole);
        if (callout) setNixCallout(callout);
      }
    } catch (err: unknown) {
      console.error('Stage 1 guess failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 2 Bravo Guess Submit
  const handleStage2Submit = async () => {
    if (!heist || stage2Guess.length !== 4 || isSubmitting || session.status !== 'active') return;
    setIsSubmitting(true);
    try {
      const res = await coopService.submitGuess({
        sessionId: session.id,
        role: 'BRAVO',
        guess: stage2Guess,
      });
      setSession(res.session);
      setStage2Guess('');
      if (res.rewardMessage) addPartnerMessage(res.rewardMessage);
      if (res.event) {
        const callout = getNixCoopCallout(res.event, playerRole);
        if (callout) setNixCallout(callout);
      }
    } catch (err: unknown) {
      console.error('Stage 2 guess failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 2 Alpha Scanner Actions
  const handlePingDigit = async (digit: number) => {
    if (!heist || isSubmitting || session.status !== 'active') return;
    setIsSubmitting(true);
    try {
      const res = await coopService.pingDigit(session.id, digit);
      setSession(res.session);
      addPartnerMessage(res.message);
      if (res.event) {
        const callout = getNixCoopCallout(res.event, playerRole);
        if (callout) setNixCallout(callout);
      }
    } catch (err: unknown) {
      console.error('Ping digit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlushIce = async () => {
    if (!heist || isSubmitting || session.status !== 'active') return;
    setIsSubmitting(true);
    try {
      const res = await coopService.flushIce(session.id);
      setSession(res.session);
      addPartnerMessage(res.message);
      if (res.event) {
        const callout = getNixCoopCallout(res.event, playerRole);
        if (callout) setNixCallout(callout);
      }
    } catch (err: unknown) {
      console.error('Flush ICE failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 3 Master Vault Guess Submit
  const handleStage3Submit = async () => {
    if (!heist || stage3Guess.length !== 5 || isSubmitting || session.status !== 'active') return;
    setIsSubmitting(true);
    try {
      const res = await coopService.submitGuess({
        sessionId: session.id,
        role: playerRole,
        guess: stage3Guess,
      });
      setSession(res.session);
      setStage3Guess('');
      if (res.rewardMessage) addPartnerMessage(res.rewardMessage);
      if (res.event) {
        const callout = getNixCoopCallout(res.event, playerRole);
        if (callout) setNixCallout(callout);
      }
      if (res.session.status === 'won' && res.session.payout) {
        setBalances(credits + res.session.payout.eachPlayerShare, usePlayerStore.getState().coins);
      }
    } catch (err: unknown) {
      console.error('Stage 3 guess failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 3 Overdrive Trigger
  const handleTriggerOverdrive = async () => {
    if (!heist || isSubmitting || session.status !== 'active') return;
    setIsSubmitting(true);
    try {
      const res = await coopService.triggerOverdrive(session.id);
      setSession(res.session);
      addPartnerMessage(res.message);
      setSecondsLeft((prev) => prev + 10);
      if (res.event) {
        const callout = getNixCoopCallout(res.event, playerRole);
        if (callout) setNixCallout(callout);
      }
    } catch (err: unknown) {
      console.error('Overdrive failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy Alpha Submit
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
      if (res.rewardMessage) addPartnerMessage(res.rewardMessage);
      if (res.session.status !== 'active') setTimerActive(false);
      if (res.session.status === 'won' && res.session.payout) {
        setBalances(credits + res.session.payout.eachPlayerShare, usePlayerStore.getState().coins);
      }
    } catch (err: unknown) {
      console.error('Failed to submit alpha guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy Beta Submit
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
      if (res.rewardMessage) addPartnerMessage(res.rewardMessage);
    } catch (err: unknown) {
      console.error('Failed to submit beta guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Partner Bot Solve Stage (Support)
  const handleSimulatePartnerSolve = async () => {
    if (session.status !== 'active' || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await coopService.simulatePartnerStage(session.id);
      setSession(res.session);
      if (res.rewardMessage) addPartnerMessage(res.rewardMessage);
    } catch (err: unknown) {
      console.error('Failed to simulate partner solve:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW LAYER 1: PRE-HEIST ROLE SELECTION & DUTY BRIEFING CARD
  // =========================================================================
  if (showBriefingCard) {
    const alphaInfo = getNixRoleBriefing('ALPHA');
    const bravoInfo = getNixRoleBriefing('BRAVO');

    return (
      <div
        data-surface="terminal"
        className="w-full flex-1 min-h-0 flex flex-col items-center justify-center p-4 bg-ground text-ink overflow-y-auto"
      >
        <div className="w-full max-w-xl bg-panel border border-line rounded-md p-6 shadow-card flex flex-col gap-6">
          {/* Header */}
          <div className="border-b border-line pb-4">
            <span className="font-data text-[10px] uppercase tracking-[2px] text-accent-text block">
              SYNDICATE COOPERATIVE INTRUSION // PRE-HEIST BRIEFING
            </span>
            <h1 className="font-heading text-xl font-bold text-ink pt-1">
              Select Your Heist Operative
            </h1>
            <p className="font-data text-xs text-ink-muted pt-1">
              Two operatives infiltrate in parallel across 3 high-security corporate vault stages.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 gap-4">
            {/* Alpha Card */}
            <div
              onClick={() => setPlayerRole('ALPHA')}
              className={`p-4 rounded-md border cursor-pointer transition-colors flex flex-col gap-2 min-h-[140px] ${
                playerRole === 'ALPHA'
                  ? 'bg-accent/15 border-accent ring-1 ring-accent'
                  : 'bg-panel-light border-line hover:border-ink-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-bold text-ink">OPERATIVE ALPHA</span>
                <span className="font-data text-[10px] font-bold uppercase bg-accent/20 text-accent-text px-2 py-0.5 rounded-pill">
                  RECON & SCANNER
                </span>
              </div>
              <p className="font-data text-xs text-ink-muted leading-relaxed">
                {alphaInfo.briefing}
              </p>
            </div>

            {/* Bravo Card */}
            <div
              onClick={() => setPlayerRole('BRAVO')}
              className={`p-4 rounded-md border cursor-pointer transition-colors flex flex-col gap-2 min-h-[140px] ${
                playerRole === 'BRAVO'
                  ? 'bg-accent/15 border-accent ring-1 ring-accent'
                  : 'bg-panel-light border-line hover:border-ink-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-bold text-ink">OPERATIVE BRAVO</span>
                <span className="font-data text-[10px] font-bold uppercase bg-money/20 text-money-text px-2 py-0.5 rounded-pill">
                  BREAKER & EXECUTION
                </span>
              </div>
              <p className="font-data text-xs text-ink-muted leading-relaxed">
                {bravoInfo.briefing}
              </p>
            </div>
          </div>

          {/* Nix Briefing Bubble */}
          <div className="bg-panel-light border border-line p-3 rounded-sm flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent-text flex items-center justify-center font-bold text-xs shrink-0 font-data">
              NIX
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-data text-[10px] uppercase font-bold text-accent-text">
                NIX // TACTICAL ADVISORY
              </span>
              <p className="font-data text-xs text-ink leading-relaxed">
                {playerRole === 'ALPHA' ? alphaInfo.briefing : bravoInfo.briefing}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {onExit && (
              <Button type="button" variant="secondary" onClick={onExit}>
                CANCEL
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              disabled={isSubmitting}
              onClick={() => handleStartHeist(playerRole)}
              data-testid="jack-in-heist-button"
              className="min-h-[44px] px-6 text-sm font-bold tracking-wider"
            >
              JACK IN // INITIATE HEIST
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW LAYER 2: ACTIVE HEIST TERMINAL
  // =========================================================================
  const currentBetaStage = session.beta.stages[session.beta.currentStageIndex];
  const stageInfo = heist ? HEIST_STAGES[heist.currentStage] : null;

  return (
    <div
      data-surface="terminal"
      className="scene-ground w-full flex-1 min-h-0 flex flex-col text-ink overflow-y-auto pb-24 pb-safe-bottom select-none"
    >
      {/* ============================================================ */}
      {/* TOP HEADER & LIVE PARTNER TELEMETRY RAIL (HUD) */}
      {/* ============================================================ */}
      <div className="bg-panel-light border-b border-line px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-data text-[10px] uppercase tracking-[1.5px] text-ink-muted block">
              CO-OP HEIST CONSOLE // TWO-MAN RIG LINK
            </span>
            <h1 className="font-heading text-base font-bold text-ink">
              {stageInfo ? stageInfo.title : 'Synchronized Heist'}
            </h1>
          </div>

          {/* Role Badge */}
          {heist && (
            <span
              data-testid="player-role-badge"
              className="font-data text-[11px] font-bold px-2 py-0.5 rounded-sm bg-accent/20 text-accent-text border border-accent/40"
            >
              OPERATIVE {playerRole}
            </span>
          )}
        </div>

        {/* Telemetry Rail HUD */}
        <div className="flex items-center gap-2">
          {/* Partner Status Rail */}
          {heist && (
            <div
              data-testid="partner-telemetry-rail"
              className="hidden sm:flex items-center gap-2 px-3 py-1 bg-panel border border-line rounded-sm text-xs font-data"
            >
              <span className="text-ink-muted text-[10px] uppercase font-bold">PARTNER:</span>
              <span className="text-accent-text font-bold">{heist.partnerCallsign}</span>
              <span className="text-ink-muted">›</span>
              <span className="text-ink italic max-w-[180px] truncate">
                {heist.partnerAction}
              </span>
            </div>
          )}

          {/* Stage 1 Dual-Key Sync Window Countdown */}
          {heist?.currentStage === 1 && heist.stage1.syncWindowMsRemaining !== null && (
            <div
              data-testid="sync-window-timer"
              className="px-2.5 py-1 rounded-sm bg-danger/20 border border-danger text-danger-text font-data text-xs font-bold animate-pulse flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
              <span>SYNC: {((syncMsLeft || 0) / 1000).toFixed(1)}s</span>
            </div>
          )}

          {/* SHARED TRACE CLOCK TIMER */}
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
      </div>

      {/* ============================================================ */}
      {/* HARDWARE LATCH STAGE TRANSITION BANNER (Requirement 2) */}
      {/* ============================================================ */}
      {showStageLatchBanner && stageInfo && (
        <div
          data-testid="stage-transition-latch-banner"
          className="bg-accent text-white px-4 py-2 font-data text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-md animate-fade-in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
          <span>{stageInfo.ruleChangeNotice}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONTEXTUAL NIX CO-OP GUIDANCE PROMPT (Requirement 3) */}
      {/* ============================================================ */}
      {nixCallout && (
        <div
          data-testid="nix-coop-callout"
          className={`mx-4 mt-3 p-3 rounded-md border flex items-start gap-3 shadow-card ${
            nixCallout.mood === 'urgent'
              ? 'bg-danger/15 border-danger text-danger-text'
              : nixCallout.mood === 'warning'
              ? 'bg-accent/15 border-accent text-accent-text'
              : 'bg-panel-light border-line text-ink'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-accent/20 text-accent-text flex items-center justify-center font-bold text-xs shrink-0 font-data">
            NIX
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="font-data text-[10px] uppercase font-bold tracking-wider text-ink-muted">
                {nixCallout.title}
              </span>
              {nixCallout.actionPrompt && (
                <span className="font-data text-[10px] uppercase font-bold px-2 py-0.5 rounded-pill bg-accent text-white">
                  {nixCallout.actionPrompt}
                </span>
              )}
            </div>
            <p className="font-data text-xs font-semibold leading-relaxed">
              {nixCallout.dialogue}
            </p>
          </div>
        </div>
      )}

      {/* View Switcher Bar (Split, Alpha, Beta) */}
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
            Alpha {is3Stage ? '(Recon)' : '(Infiltrator)'}
          </Button>
          <Button
            type="button"
            variant={activeRole === 'beta' ? 'primary' : 'secondary'}
            compact
            onClick={() => setActiveRole('beta')}
            data-testid="view-beta-button"
          >
            {is3Stage ? 'Bravo (Breaker)' : 'Beta (Support)'}
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
          <span>Nix Partner Bot Action</span>
        </Button>
      </div>

      {/* Outcome Banners */}
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
          <span>VAULT BREACH SUCCESSFUL // Dividend Payout: {session.payout?.eachPlayerShare ?? 0} CR Split 50/50!</span>
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

      {/* ============================================================ */}
      {/* 3-STAGE ASYMMETRIC HEIST CONSOLE */}
      {/* ============================================================ */}
      {is3Stage && heist ? (
        <div className="flex-1 flex flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
          {/* STAGE 1: PERIMETER HANDSHAKE */}
          {heist.currentStage === 1 && (
            <div
              data-testid="stage-1-container"
              className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div>
                  <span className="font-data text-[10px] uppercase tracking-wider text-accent-text font-bold block">
                    STAGE 1 // PERIMETER HANDSHAKE (SYNCHRONIZED DUAL LOCKS)
                  </span>
                  <h2 className="font-heading text-base font-bold text-ink">
                    Crack Your 3-Digit Outer Perimeter Lock
                  </h2>
                </div>
                {heist.stage1.syncWindowMsRemaining !== null ? (
                  <span className="font-data text-xs font-bold bg-danger/20 text-danger-text border border-danger px-2.5 py-1 rounded-pill animate-pulse">
                    SYNC WINDOW: {((syncMsLeft || 0) / 1000).toFixed(1)}s
                  </span>
                ) : (
                  <span className="font-data text-xs font-bold text-ink-muted">
                    DUAL-KEY SYNC REQUIRED
                  </span>
                )}
              </div>

              {/* Status Latch */}
              <div className="grid grid-cols-2 gap-3 bg-panel p-3 rounded-sm border border-line">
                <div className="flex flex-col gap-1">
                  <span className="font-data text-[10px] uppercase text-ink-muted">ALPHA PERIMETER:</span>
                  <span className="font-data text-xs font-bold text-ink">
                    {heist.stage1.alpha.solved ? '● LOCKED IN (CLEARED)' : `${heist.stage1.alpha.guesses.length} Probes Injected`}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-data text-[10px] uppercase text-ink-muted">BRAVO PERIMETER:</span>
                  <span className="font-data text-xs font-bold text-ink">
                    {heist.stage1.bravo.solved ? '● LOCKED IN (CLEARED)' : `${heist.stage1.bravo.guesses.length} Probes Injected`}
                  </span>
                </div>
              </div>

              {/* Input for Stage 1 */}
              {!(playerRole === 'ALPHA' ? heist.stage1.alpha.solved : heist.stage1.bravo.solved) ? (
                <div className="flex flex-col gap-2 bg-panel p-3 rounded-sm border border-line">
                  <span className="font-data text-xs text-ink-muted">ENTER 3-DIGIT PERIMETER CODE:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={3}
                      value={stage1Guess}
                      onChange={(e) => setStage1Guess(e.target.value.replace(/\D/g, ''))}
                      placeholder="---"
                      disabled={session.status !== 'active' || isSubmitting}
                      data-testid="stage1-guess-input"
                      className="flex-1 min-h-[44px] px-3 bg-panel-light border border-line text-center font-data text-xl font-bold tracking-[6px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                      aria-label="Stage 1 guess"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      compact
                      onClick={handleStage1Submit}
                      disabled={stage1Guess.length !== 3 || session.status !== 'active' || isSubmitting}
                      data-testid="stage1-submit-button"
                    >
                      PUNCH CODE
                    </Button>
                  </div>

                  {/* Stage 1 Keypad */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {'0123456789'.split('').map((d) => (
                      <Button
                        key={d}
                        type="button"
                        variant="secondary"
                        compact
                        disabled={stage1Guess.length >= 3 || session.status !== 'active' || isSubmitting}
                        onClick={() => setStage1Guess((prev) => prev + d)}
                        className="min-h-[40px] p-0 text-xs font-bold"
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-accent/15 border border-accent rounded-sm text-center font-data text-xs font-bold text-accent-text">
                  YOU ARE LOCKED IN! Holding sync connection for partner confirmation.
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: AIRGAP TUNNELING (ASYMMETRIC RELAY) */}
          {heist.currentStage === 2 && (
            <div
              data-testid="stage-2-container"
              className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div>
                  <span className="font-data text-[10px] uppercase tracking-wider text-money-text font-bold block">
                    STAGE 2 // AIRGAP TUNNELING (ASYMMETRIC RELAY)
                  </span>
                  <h2 className="font-heading text-base font-bold text-ink">
                    {playerRole === 'ALPHA' ? 'Carrier-Wave Scanner Console' : 'Airgap Breach Pad'}
                  </h2>
                </div>
                <span className="font-data text-xs font-bold bg-panel border border-line px-2.5 py-1 rounded-sm">
                  RECON CHARGES: {heist.stage2.reconChargesRemaining} / {heist.stage2.maxReconCharges}
                </span>
              </div>

              {/* ALPHA RECON SCANNER CONTROLS */}
              {playerRole === 'ALPHA' ? (
                <div className="flex flex-col gap-4">
                  <div className="bg-panel p-3 rounded-sm border border-line flex flex-col gap-2">
                    <span className="font-data text-xs text-ink-muted">
                      CARRIER-WAVE FREQUENCY SCANNER (ALPHA ONLY):
                    </span>
                    <p className="font-data text-[11px] text-ink-muted">
                      Use [PING DIGIT] to test whether a number is in the vault code, or hit [FLUSH ICE] to clean Bravo's distorted readouts.
                    </p>
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {'0123456789'.split('').map((d) => {
                        const digitNum = Number(d);
                        const status = heist.stage2.pingedDigits[digitNum];
                        return (
                          <Button
                            key={d}
                            type="button"
                            variant={status === 'CONFIRMED_PRESENT' ? 'primary' : 'secondary'}
                            disabled={heist.stage2.reconChargesRemaining <= 0 || status !== undefined || isSubmitting}
                            onClick={() => handlePingDigit(digitNum)}
                            data-testid={`ping-digit-${d}`}
                            className={`min-h-[44px] text-xs font-bold ${
                              status === 'CONFIRMED_DEAD' ? 'opacity-40 line-through' : ''
                            }`}
                          >
                            {status === 'CONFIRMED_PRESENT' ? `✓ ${d}` : status === 'CONFIRMED_DEAD' ? `✕ ${d}` : `PING ${d}`}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flush ICE Action */}
                  <div className="bg-panel p-3 rounded-sm border border-line flex items-center justify-between">
                    <div>
                      <span className="font-heading text-xs font-bold text-ink block">
                        PARITY PURGE // FLUSH ICE
                      </span>
                      <span className="font-data text-[11px] text-ink-muted">
                        Cleanses active Liar ICE from Bravo for next 2 rows.
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleFlushIce}
                      disabled={heist.stage2.reconChargesRemaining <= 0 || isSubmitting}
                      data-testid="flush-ice-button"
                      className="min-h-[44px] px-4 font-bold"
                    >
                      FLUSH ICE
                    </Button>
                  </div>
                </div>
              ) : (
                /* BRAVO BREAKER CRACKING PAD */
                <div className="flex flex-col gap-2 bg-panel p-3 rounded-sm border border-line">
                  <span className="font-data text-xs text-ink-muted">
                    ENTER 4-DIGIT AIRGAP RELAY CODE:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={stage2Guess}
                      onChange={(e) => setStage2Guess(e.target.value.replace(/\D/g, ''))}
                      placeholder="----"
                      disabled={session.status !== 'active' || isSubmitting}
                      data-testid="stage2-guess-input"
                      className="flex-1 min-h-[44px] px-3 bg-panel-light border border-line text-center font-data text-xl font-bold tracking-[6px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                      aria-label="Stage 2 guess"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      compact
                      onClick={handleStage2Submit}
                      disabled={stage2Guess.length !== 4 || session.status !== 'active' || isSubmitting}
                      data-testid="stage2-submit-button"
                    >
                      BREACH
                    </Button>
                  </div>

                  {/* Bravo Keypad with Telemetry Highlighting */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {'0123456789'.split('').map((d) => {
                      const digitNum = Number(d);
                      const pingStatus = heist.stage2.pingedDigits[digitNum];
                      const isPresent = pingStatus === 'CONFIRMED_PRESENT';
                      const isDead = pingStatus === 'CONFIRMED_DEAD';

                      return (
                        <Button
                          key={d}
                          type="button"
                          variant="secondary"
                          compact
                          disabled={isDead || stage2Guess.length >= 4 || session.status !== 'active' || isSubmitting}
                          onClick={() => setStage2Guess((prev) => prev + d)}
                          data-testid={`bravo-key-${d}`}
                          className={`min-h-[40px] p-0 text-xs font-bold ${
                            isPresent
                              ? 'bg-accent/25 border-accent text-accent-text ring-1 ring-accent'
                              : isDead
                              ? 'opacity-30 line-through'
                              : ''
                          }`}
                        >
                          {isPresent ? `● ${d}` : d}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: THE CORE VAULT (5-DIGIT MASTER LOCK) */}
          {heist.currentStage === 3 && (
            <div
              data-testid="stage-3-container"
              className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div>
                  <span className="font-data text-[10px] uppercase tracking-wider text-danger-text font-bold block">
                    STAGE 3 // THE CORE VAULT (5-DIGIT MASTER CODE)
                  </span>
                  <h2 className="font-heading text-base font-bold text-ink">
                    Master Code Intrusion
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    data-testid="stage3-attempts-left"
                    className="font-data text-xs font-bold bg-danger/15 text-danger-text border border-danger/40 px-2.5 py-1 rounded-pill"
                  >
                    {heist.stage3.attemptsRemaining} / {heist.stage3.maxAttempts} ATTEMPTS
                  </span>
                  <span className="font-data text-xs font-bold bg-panel border border-line px-2 py-1 rounded-sm text-ink-muted">
                    TURN: {heist.stage3.activeTurn}
                  </span>
                </div>
              </div>

              {/* Overdrive Breaker (Bravo only) */}
              {playerRole === 'BRAVO' && !heist.stage3.overdriveUsed && (
                <div className="bg-panel p-3 rounded-sm border border-danger/40 flex items-center justify-between">
                  <div>
                    <span className="font-heading text-xs font-bold text-danger-text block">
                      OVERDRIVE MODULE AVAILABLE
                    </span>
                    <span className="font-data text-[11px] text-ink-muted">
                      Freeze the shared trace countdown for 10.0 seconds (Single use per heist).
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleTriggerOverdrive}
                    disabled={isSubmitting}
                    data-testid="overdrive-button"
                    className="min-h-[44px] px-4 font-bold bg-danger hover:bg-danger/90 text-white"
                  >
                    OVERDRIVE (+10s)
                  </Button>
                </div>
              )}

              {/* Stage 3 5-Digit Input */}
              <div className="flex flex-col gap-2 bg-panel p-3 rounded-sm border border-line">
                <span className="font-data text-xs text-ink-muted">
                  ENTER 5-DIGIT MASTER VAULT CODE:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={stage3Guess}
                    onChange={(e) => setStage3Guess(e.target.value.replace(/\D/g, ''))}
                    placeholder="-----"
                    disabled={session.status !== 'active' || isSubmitting}
                    data-testid="stage3-guess-input"
                    className="flex-1 min-h-[44px] px-3 bg-panel-light border border-line text-center font-data text-xl font-bold tracking-[6px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                    aria-label="Stage 3 guess"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    compact
                    onClick={handleStage3Submit}
                    disabled={stage3Guess.length !== 5 || session.status !== 'active' || isSubmitting}
                    data-testid="stage3-submit-button"
                  >
                    INTRUDE
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
                      disabled={stage3Guess.length >= 5 || session.status !== 'active' || isSubmitting}
                      onClick={() => setStage3Guess((prev) => prev + d)}
                      className="min-h-[40px] p-0 text-xs font-bold"
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* LEGACY SPLIT CONSOLE (Maintains 100% test compatibility) */
        /* ============================================================ */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-4xl mx-auto w-full">
          {/* ROLE ALPHA (INFILTRATOR) VIEW */}
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

              {session.alpha.eliminatedDigits.length > 0 && (
                <div
                  data-testid="eliminated-digits-banner"
                  className="bg-accent/10 border border-accent/30 text-accent-text p-2 rounded-sm font-data text-[11px] flex items-center justify-between"
                >
                  <span>SUPPORT BUFF: Dead Digits Purged</span>
                  <span className="font-bold">[{session.alpha.eliminatedDigits.join(', ')}]</span>
                </div>
              )}

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

          {/* ROLE BETA (SUPPORT) VIEW */}
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

              <div className="bg-panel p-3 rounded-sm border border-line flex flex-col gap-1">
                <span className="font-heading text-sm font-bold text-ink">
                  {currentBetaStage?.name || 'All Subroutines Cleared'}
                </span>
                <span className="font-data text-xs text-accent-text font-semibold">
                  REWARD: {currentBetaStage?.rewardDescription || 'Full support online'}
                </span>
              </div>

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
      )}

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
              <span className="text-ink-muted italic">
                Secure audio channel linked. Operatives online.
              </span>
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
