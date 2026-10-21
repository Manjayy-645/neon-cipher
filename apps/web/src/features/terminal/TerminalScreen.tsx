'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { validateGuess, bestGuess, provenDeadDigits, GuessRecord } from '@neon-cipher/game-rules';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useCampaignStore } from '@/stores/campaign-store';
import { useMapStore } from '@/stores/map-store';
import { getChapterById } from '@neon-cipher/game-rules';
import { terminalService, SessionData } from './terminalService';
import { TerminalFrame } from './TerminalFrame';
import { getNodeById } from '@/features/map/nodeService';
import {
  TerminalHeader,
  ProgressStrip,
  HistoryList,
  GuessEntry,
  Keypad,
  ClueLegendDrawer,
  BreachBanner,
  TerminalToolSlots,
  ToolInspectorModal,
} from './components';
import { soundFx } from '@/lib/audio';
import { TutorialOverlay } from '@/features/story/TutorialOverlay';
import { QuitModal } from './TerminalScreens';
import { emit } from '@/features/onboarding/events';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { TUTORIAL, CH2_NODE_ID } from '@/features/onboarding/steps';
import { campaignService } from '@/features/story/campaignService';
import { NIX_RECOVERY_NODE_ID } from '@/features/story/recoveryQuest';
import { triggerToast } from '@/stores/toast-store';
import { isSameNode, NODE_ALIAS_MAP, getCanonicalNodeId } from '@/features/map/nodeService';

export default function TerminalScreen({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const { addCredits, subtractCredits, equippedTools, inventory, syncWallet } = usePlayerStore();
  const rookieAssist = useSettingsStore((s) => s.rookieAssist);
  const assistMode: 'rookie' | 'pro' = rookieAssist ? 'rookie' : 'pro';

  const [toolFeedback, setToolFeedback] = useState<string | null>(null);
  const [isActivatingTool, setIsActivatingTool] = useState(false);
  const [iceShieldArmed, setIceShieldArmed] = useState(false);
  const [eliminatedByTools, setEliminatedByTools] = useState<string[]>([]);
  const [activatedTools, setActivatedTools] = useState<string[]>([]);
  const [isTimerFrozen, setIsTimerFrozen] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [inspectedToolId, setInspectedToolId] = useState<string | null>(null);
  const [revealedSlots, setRevealedSlots] = useState<Array<{ slotIndex: number; digit: string }>>([]);
  const [showParityTooltip, setShowParityTooltip] = useState(false);

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [entry, setEntry] = useState<number[]>([]);
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [payout, setPayout] = useState<number | undefined>(undefined);
  const [fine, setFine] = useState<number | undefined>(undefined);
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [failureReason, setFailureReason] = useState<'TRACE TIMEOUT' | 'ATTEMPTS EXHAUSTED' | null>(null);

  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  // Campaign / Tutorial integration
  const {
    activeChapterId,
    tutorialActive,
    tutorialStepIndex,
    nextTutorialStep,
    setTutorialActive,
    skipTutorial,
    completeChapter,
  } = useCampaignStore();

  const chapter = activeChapterId ? getChapterById(activeChapterId) : null;
  const isCampaignTarget = Boolean(chapter && isSameNode(chapter.mapNodeId, nodeId));
  const isCampaignNode = isCampaignTarget && tutorialActive;
  const activeTutorialStep =
    isCampaignNode && chapter && chapter.tutorialSteps ? chapter.tutorialSteps[tutorialStepIndex] : null;
  const isTutorial =
    nodeId === TUTORIAL.terminalId ||
    nodeId === 'tutorial-soda' ||
    Boolean(isCampaignNode);

  const [showExitTutorialModal, setShowExitTutorialModal] = useState(false);

  // Check if a blocking modal or pause overlay is covering the terminal
  const isInputModalOpen = Boolean(
    isManualPaused ||
    isLegendOpen ||
    showExitTutorialModal ||
    inspectedToolId !== null
  );

  // Auto-pause timer when any Nix overlay, Clue Legend, Tool Inspector, or manual pause is open
  const isOverlayOpen = Boolean(
    isInputModalOpen ||
    (activeTutorialStep && activeTutorialStep.phase === 'terminal')
  );

  const pauseStartedAtRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (isOverlayOpen) {
      if (pauseStartedAtRef.current === null) {
        pauseStartedAtRef.current = Date.now();
      }
    } else {
      if (pauseStartedAtRef.current !== null) {
        const pausedDuration = Date.now() - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
        setSession((prev) =>
          prev ? { ...prev, startedAt: prev.startedAt + pausedDuration } : prev
        );
      }
    }
  }, [isOverlayOpen]);

  const handleExitTutorial = useCallback(() => {
    setShowExitTutorialModal(true);
  }, []);

  const handleConfirmExitTutorial = useCallback(() => {
    setShowExitTutorialModal(false);
    if (nodeId === TUTORIAL.terminalId || nodeId === 'tutorial-soda') {
      campaignService.completeChapter(1).catch(() => {});
      useCampaignStore.getState().completeChapter('chapter-1').catch(() => {});
      useOnboardingStore.getState().crackNode(TUTORIAL.mapNodeId, TUTORIAL.cooldownMs);
      useOnboardingStore.getState().skip();
      const { callsign, setProfile, guestId } = useOnboardingStore.getState();
      if (!callsign) {
        const fallbackCallsign = 'DECKER_' + guestId.slice(0, 4).toUpperCase();
        setProfile(fallbackCallsign, 'avatar-nx');
        usePlayerStore.setState({
          handle: fallbackCallsign,
          avatarUrl: '/Character portraits/Player avatars.png',
        });
      }
    } else if (chapter && isCampaignTarget) {
      skipTutorial(chapter.id);
    }
    triggerToast('Tutorial skipped. Transceiver locked to City Map.');
    router.push('/map');
  }, [nodeId, chapter, isCampaignTarget, skipTutorial, router]);

  // Start session from server (secret never sent to client)
  useEffect(() => {
    let mounted = true;
    const isCourtesyNode = nodeId === CH2_NODE_ID && useOnboardingStore.getState().ch2Fails === 0;
    terminalService
      .startSession(nodeId, { courtesy: isCourtesyNode })
      .then((data) => {
        if (!mounted) return;
        setSession(data);
        setAttemptsLeft(data.config.attempts ?? 999);
        if (data.config.bounty != null) {
          setPayout(data.config.bounty);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to establish quantum link');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [nodeId]);

  // Client-side timer calculated from single server startedAt timestamp (no polling)
  useEffect(() => {
    if (
      !session ||
      !session.config.timerSeconds ||
      session.config.timerSeconds === 0 ||
      status !== 'playing' ||
      isTimerFrozen ||
      isOverlayOpen
    ) {
      return;
    }

    const checkTimeout = () => {
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      setElapsedSeconds(elapsed);

      const clockMsRemaining = (session.config.timerSeconds ?? 0) * 1000 - (Date.now() - session.startedAt);

      if (clockMsRemaining <= 0) {
        setStatus('lost');
        setFailureReason('TRACE TIMEOUT');
        setValidationError('Time expired');
        emit({ type: 'terminal:lost', nodeId });
        usePlayerStore.getState().recordBreach(false, 0, 25);

        terminalService
          .submitGuess(session.sessionId, 'timeout')
          .then((res) => {
            if (res.secret) setSecret(res.secret);
            if (res.fine) {
              setFine(res.fine);
              subtractCredits(res.fine);
            }
          })
          .catch(() => {});
        return true;
      }
      return false;
    };

    if (checkTimeout()) return;

    const interval = setInterval(() => {
      if (checkTimeout()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, status, nodeId, subtractCredits, isTimerFrozen, isOverlayOpen]);

  // Auto-advance tutorial if input completed
  useEffect(() => {
    if (!activeTutorialStep || !session) return;
    if (
      activeTutorialStep.actionRequired === 'input-digits' &&
      entry.length === session.config.digits
    ) {
      nextTutorialStep();
    }
  }, [entry, activeTutorialStep, session, nextTutorialStep]);

  // Derived state
  const best = useMemo(() => bestGuess(history), [history]);
  const deadDigits = useMemo(() => {
    const fromHistory = assistMode === 'rookie' ? Array.from(provenDeadDigits(history)) : [];
    const fromPreConfig = (session?.config.eliminatedDigits || [])
      .map((d) => parseInt(String(d), 10))
      .filter((n) => !isNaN(n));
    const fromTools = eliminatedByTools
      .map((d) => parseInt(String(d), 10))
      .filter((n) => !isNaN(n));
    return new Set([...fromHistory, ...fromPreConfig, ...fromTools]);
  }, [history, session, eliminatedByTools, assistMode]);
  const latestRecord = history.length > 0 ? history[history.length - 1] : null;
  const tacticalHint = useMemo(() => {
    if (!latestRecord || !session) return null;
    const { digits } = session.config;
    if (latestRecord.pans === 0 && latestRecord.pots === digits) {
      return `All ${digits} digits found! Swap positions to breach.`;
    }
    return null;
  }, [latestRecord, session]);

  const handleActivateTool = useCallback(
    async (toolId: string) => {
      if (!session || status !== 'playing' || isActivatingTool || activatedTools.includes(toolId)) return;
      setIsActivatingTool(true);
      setToolFeedback(null);

      try {
        const res = await terminalService.useTool(session.sessionId, toolId);
        setIsActivatingTool(false);

        // Record tool usage in this breach (max 1 use per slot per run)
        setActivatedTools((prev) => [...prev, toolId]);

        if (res.inventory) {
          syncWallet({
            credits: usePlayerStore.getState().credits,
            coins: usePlayerStore.getState().coins,
            inventory: res.inventory,
            equippedTools: res.equippedTools,
          });
        }

        if (res.message) {
          setToolFeedback(res.message);
        }

        if (res.eliminatedDigit) {
          setEliminatedByTools((prev) => [...prev, res.eliminatedDigit!]);
        }

        if (res.shieldArmed) {
          setIceShieldArmed(true);
        }

        if (res.timerFrozenSeconds || res.effectType === 'freeze_timer') {
          const freezeSec = res.timerFrozenSeconds || 15;
          setIsTimerFrozen(true);
          // Advance startedAt by the freeze window so resume is seamless
          setSession((prev) =>
            prev ? { ...prev, startedAt: prev.startedAt + freezeSec * 1000 } : prev
          );
          setTimeout(() => {
            setIsTimerFrozen(false);
          }, freezeSec * 1000);
        } else if (res.timeAddedSeconds) {
          setSession((prev) =>
            prev ? { ...prev, startedAt: prev.startedAt + (res.timeAddedSeconds || 0) * 1000 } : prev
          );
          setElapsedSeconds((prev) => Math.max(0, prev - (res.timeAddedSeconds || 0)));
        }

        if (res.cleanseIce) {
          triggerToast(res.message || 'ICE purged for 2 turns. Real clue values confirmed.');
          if (res.uncorruptedScore && history.length > 0) {
            setHistory((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last) {
                updated[updated.length - 1] = {
                  ...last,
                  pans: res.uncorruptedScore!.pans,
                  pots: res.uncorruptedScore!.pots,
                };
              }
              return updated;
            });
          }
        }

        if (res.revealedSlot) {
          setRevealedSlots((prev) => [...prev, res.revealedSlot!]);
        }

        if (res.extraAttempts) {
          setAttemptsLeft((prev) => prev + (res.extraAttempts || 0));
          setSession((prev) => {
            if (!prev) return prev;
            const newAttempts = (prev.config.attempts ?? 0) + (res.extraAttempts || 0);
            return {
              ...prev,
              config: {
                ...prev.config,
                attempts: newAttempts,
                maxAttempts: newAttempts,
              },
            };
          });
        }

        if (res.autoCrack && res.secret) {
          setStatus('won');
          setSecret(res.secret);
          setPayout(0);
          usePlayerStore.getState().recordBreach(true, 0, 50);
          emit({ type: 'terminal:won', nodeId, guesses: 1 });
        }
      } catch (err: any) {
        setIsActivatingTool(false);
        setToolFeedback(err.message || 'Failed to deploy intrusion tool');
      }
    },
    [session, status, isActivatingTool, activatedTools, syncWallet, nodeId]
  );

  const handleDigit = useCallback(
    (digit: number) => {
      if (status !== 'playing' || !session) return;

      if (deadDigits.has(digit)) {
        setValidationError('Digit eliminated — not in code');
        setShakeKey((k) => k + 1);
        return;
      }

      let errorMsg: string | null = null;
      setEntry((prev) => {
        if (prev.length >= session.config.digits) {
          errorMsg = `Needs ${session.config.digits} digits`;
          return prev;
        }
        if (!session.config.allowDuplicates && prev.includes(digit)) {
          errorMsg = 'No repeats on this tier';
          return prev;
        }
        return [...prev, digit];
      });

      if (errorMsg) {
        setValidationError(errorMsg);
        setShakeKey((k) => k + 1);
      } else {
        setValidationError(null);
      }
    },
    [status, session, deadDigits]
  );

  const handleBackspace = useCallback(() => {
    if (status !== 'playing') return;
    setEntry((prev) => prev.slice(0, -1));
    setValidationError(null);
  }, [status]);

  const handleClear = useCallback(() => {
    if (status !== 'playing') return;
    setEntry([]);
    setValidationError(null);
  }, [status]);

  const handleIllegalAttempt = useCallback((reason: string) => {
    setValidationError(reason);
    setShakeKey((k) => k + 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (status !== 'playing' || !session) return;

    if (entry.length !== session.config.digits) {
      setValidationError(`Needs ${session.config.digits} digits`);
      setShakeKey((k) => k + 1);
      return;
    }

    const guessStr = entry.join('');
    const isValid = validateGuess(
      guessStr,
      session.config.digits,
      session.config.allowDuplicates
    );

    if (!isValid) {
      const reason = !session.config.allowDuplicates
        ? 'No repeats on this tier'
        : `Needs ${session.config.digits} digits`;
      setValidationError(reason);
      setShakeKey((k) => k + 1);
      return;
    }

    try {
      const res = await terminalService.submitGuess(session.sessionId, guessStr);
      if (res.error && res.status !== 'won' && res.status !== 'lost') {
        setValidationError(res.error);
        setShakeKey((k) => k + 1);
        return;
      }

      const newRecord: GuessRecord = {
        guess: [...entry],
        pans: res.pans ?? 0,
        pots: res.pots ?? 0,
      };

      const newHistory = [...history, newRecord];
      const deadDigitsNow = provenDeadDigits(newHistory);
      const isWon = res.status === 'won';
      const isLost = res.status === 'lost';

      emit({
        type: 'terminal:guess',
        count: newHistory.length,
        hasDeadDigit: deadDigitsNow.size > 0,
        solved: isWon,
      });

      if (isWon) {
        emit({
          type: 'terminal:won',
          nodeId,
          guesses: newHistory.length,
        });
      } else if (isLost) {
        emit({
          type: 'terminal:lost',
          nodeId,
        });
      }

      setHistory(newHistory);
      setAttemptsLeft(res.attemptsLeft ?? attemptsLeft - 1);
      setEntry([]);
      setValidationError(null);

      if (res.firstTurnBonus) {
        addCredits(res.firstTurnBonus);
        triggerToast(`Syndicate Skimmer: +$${res.firstTurnBonus} CR bonus!`);
      }
      if (res.refundedAttempt) {
        triggerToast('Neural Reflex Capacitor: Rapid guess refunded attempt!');
      }

      // Advance tutorial if awaiting submit
      if (activeTutorialStep?.actionRequired === 'submit-guess') {
        nextTutorialStep();
      }

      const nextStatus =
        res.status === 'won' ? 'won' : res.status === 'lost' ? 'lost' : 'playing';

      if (nextStatus !== 'playing') {
        setStatus(nextStatus);

        if (nextStatus === 'won') {
          const finalPayout = typeof res.payout === 'number' ? res.payout : (payout ?? 0);
          usePlayerStore.getState().recordBreach(true, finalPayout, 150);
          setPayout(finalPayout);
          if (finalPayout > 0) {
            addCredits(finalPayout);
          }
          if (res.secret) setSecret(res.secret);
          if (chapter && isSameNode(chapter.mapNodeId, nodeId)) {
            completeChapter(chapter.id);
          }
          if (nodeId === TUTORIAL.terminalId || nodeId === 'tutorial-soda') {
            campaignService.completeChapter(1).catch(() => {});
            useOnboardingStore.getState().crackNode(TUTORIAL.mapNodeId, TUTORIAL.cooldownMs);
          }
          // Record breach for map status
          useOnboardingStore.getState().crackNode(nodeId, 0);
          const canonicalId = getCanonicalNodeId(nodeId);
          const aliasId = NODE_ALIAS_MAP[nodeId.toLowerCase()];
          if (canonicalId && canonicalId !== nodeId) {
            useOnboardingStore.getState().crackNode(canonicalId, 0);
          }
          if (aliasId && aliasId !== nodeId) {
            useOnboardingStore.getState().crackNode(aliasId, 0);
          }
        } else if (nextStatus === 'lost') {
          usePlayerStore.getState().recordBreach(false, 0, 25);
          const nowMsRemaining = session.config.timerSeconds
            ? session.config.timerSeconds * 1000 - (Date.now() - session.startedAt)
            : null;
          const isTimeout =
            res.error === 'Time expired' ||
            (nowMsRemaining !== null && nowMsRemaining <= 0);

          setFailureReason(isTimeout ? 'TRACE TIMEOUT' : 'ATTEMPTS EXHAUSTED');

          if (res.fine) {
            setFine(res.fine);
            subtractCredits(res.fine);
          }
          if (res.secret) setSecret(res.secret);
          if (isCampaignTarget) {
            setTutorialActive(false);
          }
        }
      }
    } catch (err: any) {
      setValidationError(err.message || 'Transmission error');
      setShakeKey((k) => k + 1);
    }
  }, [
    status,
    session,
    entry,
    attemptsLeft,
    addCredits,
    subtractCredits,
    activeTutorialStep,
    nextTutorialStep,
    setTutorialActive,
    chapter,
    isCampaignTarget,
    nodeId,
    completeChapter,
  ]);

  const digits = session?.config.digits ?? 0;
  const allowDuplicates = session?.config.allowDuplicates ?? true;
  const isSubmitDisabled =
    !session ||
    entry.length !== digits ||
    (!allowDuplicates && new Set(entry).size !== entry.length);

  const handleSubmitRef = React.useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  const handleDigitRef = React.useRef(handleDigit);
  handleDigitRef.current = handleDigit;

  const handleBackspaceRef = React.useRef(handleBackspace);
  handleBackspaceRef.current = handleBackspace;

  const handleClearRef = React.useRef(handleClear);
  handleClearRef.current = handleClear;

  // Physical Keyboard Input (desktop support for 0-9, Backspace, Delete, Enter, Escape)
  useEffect(() => {
    if (status !== 'playing' || isInputModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

      const numpadMatch = e.code?.match(/^Numpad([0-9])$/);
      if (/^[0-9]$/.test(e.key) || numpadMatch) {
        e.preventDefault();
        soundFx.playKeystroke();
        const digit = numpadMatch ? parseInt(numpadMatch[1], 10) : parseInt(e.key, 10);
        handleDigitRef.current(digit);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        soundFx.playKeystroke();
        handleBackspaceRef.current();
      } else if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        handleSubmitRef.current();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isInputModalOpen]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center font-data text-terminal-phosphor bg-terminal-bg gap-3 p-6">
        <div className="w-8 h-8 border-2 border-terminal-phosphor border-t-transparent rounded-full animate-spin" />
        <span className="tracking-widest uppercase text-xs">
          ESTABLISHING QUANTUM LINK...
        </span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-terminal-bg text-terminal-danger font-data p-6 text-center gap-4">
        <div className="text-xl font-bold tracking-wider">CONNECTION FAILED</div>
        <div className="text-xs opacity-80">{error}</div>
        <button
          onClick={() => router.push('/map')}
          className="px-6 py-2 rounded-[6px] border border-terminal-danger bg-terminal-panel text-terminal-danger font-data text-xs uppercase font-bold"
        >
          ABORT TO MAP
        </button>
      </div>
    );
  }

  const { config } = session;
  const node = getNodeById(nodeId);
  const nodeName =
    config.nodeName ||
    node?.name ||
    (nodeId === NIX_RECOVERY_NODE_ID ? "Nix's Recovery Run" : `Node: ${nodeId}`);
  const nodeType = config.nodeType || node?.type || 'vending';

  const clockMsRemaining = session.config.timerSeconds
    ? session.config.timerSeconds * 1000 - (Date.now() - session.startedAt)
    : null;

  const isTimeoutLoss =
    status === 'lost' &&
    (failureReason === 'TRACE TIMEOUT' || (clockMsRemaining !== null && clockMsRemaining <= 0));

  const effectiveFailureReason: 'TRACE TIMEOUT' | 'ATTEMPTS EXHAUSTED' | null =
    status === 'lost'
      ? failureReason || (isTimeoutLoss ? 'TRACE TIMEOUT' : 'ATTEMPTS EXHAUSTED')
      : null;

  const usedAttempts = isTimeoutLoss
    ? history.length
    : config.attempts != null
      ? Math.max(0, config.attempts - attemptsLeft)
      : history.length;


  return (
    <TerminalFrame tier={config.tier} nodeName={nodeName} nodeType={nodeType}>
      <div
        className="flex flex-col h-full max-h-[100dvh] w-full max-w-[480px] mx-auto bg-terminal-bg text-terminal-ink overflow-hidden relative shadow-2xl md:border-x md:border-terminal-line/40"
        data-surface="terminal"
      >
        {/* CRT Scanline Layer (3% opacity) */}
        <div className="terminal-scanline absolute inset-0 pointer-events-none z-10" />

        {/* 1. Header (72px / 48px compact) */}
        <TerminalHeader
          nodeName={nodeName}
          nodeId={nodeId}
          config={config}
          usedAttempts={usedAttempts}
          elapsedSeconds={elapsedSeconds}
          onOpenLegend={() => setIsLegendOpen(true)}
          onExit={isTutorial ? handleExitTutorial : undefined}
          exitLabel="EXIT TUTORIAL"
          onTogglePause={() => setIsManualPaused((v) => !v)}
          isPaused={isManualPaused}
        />

        {/* 2. Progress Strip (32px) */}
        <ProgressStrip
          currentAttempt={usedAttempts + (status === 'playing' ? 1 : 0)}
          maxAttempts={config.attempts}
          best={best}
          totalSeconds={config.timerSeconds}
          elapsedSeconds={elapsedSeconds}
        />

        {/* 3. History (Flex-fills and scrolls, newest at bottom, visible & clear) */}
        <HistoryList history={history} length={config.digits} />

        {/* 4. Pinned Control Deck */}
        <div className="flex flex-col shrink-0 w-full z-10 bg-terminal-bg/95 border-t border-terminal-line/40">
          {/* Guess Entry Row */}
          <GuessEntry
            digits={config.digits}
            entry={entry}
            validationError={validationError}
            shakeKey={shakeKey}
            hint={tacticalHint}
            revealedSlots={revealedSlots}
          />

          {/* Tool Slots Row (Equipped intrusion tools) */}
          <TerminalToolSlots
            equippedTools={equippedTools}
            inventory={inventory}
            onActivateTool={handleActivateTool}
            onInspectTool={(toolId) => setInspectedToolId(toolId)}
            isActivating={isActivatingTool}
            disabled={status !== 'playing'}
            toolFeedback={toolFeedback}
            onClearFeedback={() => setToolFeedback(null)}
            iceShieldArmed={iceShieldArmed}
            activatedTools={activatedTools}
            isTimerFrozen={isTimerFrozen}
          />

          {/* Tactile Stencil Readout Banner for Parity Scanner ASIC */}
          {config.parityDistribution && (
            <div
              data-testid="carrier-parity-banner"
              className="mx-3 mt-0.5 px-2.5 py-0.5 rounded-[5px] bg-terminal-panel border border-terminal-phosphor/70 flex items-center justify-between text-terminal-phosphor font-data text-xs shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-phosphor animate-pulse" />
                <span className="font-bold tracking-wider uppercase font-data">
                  {config.parityDistribution.stencilFormatted || `CARRIER PARITY: [ ${config.parityDistribution.evenCount} EVEN // ${config.parityDistribution.oddCount} ODD ]`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowParityTooltip((v) => !v)}
                aria-label="Explain parity distribution"
                data-testid="parity-tooltip-trigger"
                className="w-5 h-5 rounded-full border border-terminal-phosphor/60 hover:bg-terminal-phosphor/20 flex items-center justify-center text-[11px] font-bold text-terminal-phosphor transition-colors shrink-0"
              >
                ?
              </button>
            </div>
          )}

          {/* Parity Tooltip Explainer Popover */}
          {config.parityDistribution && showParityTooltip && (
            <div
              data-testid="parity-tooltip-popover"
              className="mx-4 mt-1 p-2.5 rounded-[6px] bg-terminal-bg border border-terminal-phosphor text-terminal-phosphor font-data text-xs flex items-start gap-2 shadow-card"
            >
              <div className="w-6 h-6 rounded-full border border-terminal-phosphor overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Character portraits/Nix.png" alt="Nix" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wider text-[10px] block text-terminal-phosphor">
                  NIX TACTICAL MENTOR
                </span>
                <p className="text-[11px] leading-tight text-terminal-ink mt-0.5">
                  Even numbers are 0, 2, 4, 6, 8. Odd numbers are 1, 3, 5, 7, 9.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowParityTooltip(false)}
                className="text-terminal-muted hover:text-terminal-ink text-xs p-0.5"
                aria-label="Dismiss parity explanation"
              >
                ✕
              </button>
            </div>
          )}

          {/* 6. Keypad (3x4, 56px keys, radius 8, 8px gaps) */}
          <Keypad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
            onClear={handleClear}
            isSubmitDisabled={isSubmitDisabled}
            deadDigits={deadDigits}
            usedDigitsInEntry={entry}
            allowDuplicates={config.allowDuplicates}
            assistMode={assistMode}
            onIllegalAttempt={handleIllegalAttempt}
          />
        </div>

        {/* Clue Legend Drawer */}
        <ClueLegendDrawer
          isOpen={isLegendOpen}
          onClose={() => setIsLegendOpen(false)}
        />

        {/* End State Banners */}
        {status !== 'playing' && (
          <BreachBanner
            status={status}
            secret={secret}
            payout={payout}
            fine={fine}
            attemptsUsed={usedAttempts}
            maxAttempts={config.attempts}
            failureReason={effectiveFailureReason ?? undefined}
            isRecoveryRun={nodeId === NIX_RECOVERY_NODE_ID}
            onStartRecovery={
              status === 'lost' &&
              (nodeId === NIX_RECOVERY_NODE_ID || isCampaignTarget)
                ? () => router.push(`/terminal/${NIX_RECOVERY_NODE_ID}`)
                : undefined
            }
            recoveryActionLabel={
              nodeId === NIX_RECOVERY_NODE_ID
                ? 'TRY PRACTICE AGAIN'
                : "START NIX'S RECOVERY RUN"
            }
            returnActionLabel={
              nodeId === NIX_RECOVERY_NODE_ID && status === 'won'
                ? 'RETURN TO CAMPAIGN'
                : 'RETURN TO MAP'
            }
            onReturnToMap={() => {
              if (nodeId === NIX_RECOVERY_NODE_ID && status === 'won') {
                router.push(chapter ? `/terminal/${chapter.mapNodeId}` : '/map');
              } else if (nodeId === TUTORIAL.terminalId || nodeId === 'tutorial-soda') {
                useOnboardingStore.getState().advance('glitch.intro');
                router.push('/onboarding/glitch');
              } else if (isSameNode(nodeId, CH2_NODE_ID) && status === 'won') {
                triggerToast('Black Market unlocked');
                campaignService.completeChapter(2).catch(() => {});
                useOnboardingStore.getState().advance('market.gate');
                router.push('/market');
              } else if (isSameNode(nodeId, 'n7') && status === 'won') {
                triggerToast('River Bridge Access unlocked');
                campaignService.completeChapter(3).catch(() => {});
                router.push('/map');
              } else if (isSameNode(nodeId, 'n10') && status === 'won') {
                triggerToast('Syndicate Debt Extinguished! Online Play (Duel) unlocked');
                campaignService.completeChapter(4).catch(() => {});
                router.push('/comms');
              } else {
                if (status === 'won' && payout) {
                  triggerToast(`Breached: +$${payout}`);
                } else if (status === 'lost' && fine) {
                  triggerToast(`Trace penalty: -$${fine}`);
                }
                router.push('/map');
              }
            }}
          />
        )}

        {/* Guided Tutorial Overlay (if in tutorial) */}
        {activeTutorialStep && activeTutorialStep.phase === 'terminal' && status === 'playing' && chapter && (
          <TutorialOverlay
            chapter={chapter}
            activeStep={activeTutorialStep}
            currentStepIndex={tutorialStepIndex}
            onAdvanceStep={nextTutorialStep}
            onSkipTutorial={handleExitTutorial}
          />
        )}

        {/* Tool Inspector Modal */}
        {inspectedToolId && (
          <ToolInspectorModal
            toolId={inspectedToolId}
            onClose={() => setInspectedToolId(null)}
            onActivate={handleActivateTool}
            canActivate={
              (inventory[inspectedToolId] || 0) > 0 &&
              !isActivatingTool &&
              !activatedTools.includes(inspectedToolId) &&
              status === 'playing'
            }
            inventoryCount={inventory[inspectedToolId] || 0}
          />
        )}

        {/* Manual Pause Blur & Mask Overlay */}
        {isManualPaused && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terminal-pause-title"
            data-testid="terminal-pause-overlay"
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-xs w-full p-6 rounded-[8px] bg-terminal-panel border border-terminal-phosphor shadow-card flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-terminal-phosphor bg-terminal-phosphor/10 flex items-center justify-center text-terminal-phosphor text-xl font-bold animate-pulse">
                ⏸
              </div>
              <div>
                <h2 id="terminal-pause-title" className="font-heading text-lg font-bold text-terminal-phosphor tracking-wider uppercase">
                  BREACH PAUSED
                </h2>
                <p className="font-data text-xs text-terminal-muted mt-1 leading-relaxed">
                  Tactical countdown frozen. Guess history and keypad masked.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsManualPaused(false)}
                data-testid="resume-breach-button"
                className="w-full h-12 min-h-[44px] rounded-[6px] bg-terminal-phosphor text-black font-data font-bold text-xs uppercase tracking-widest hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-terminal-phosphor"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>RESUME BREACH</span>
              </button>
            </div>
          </div>
        )}

        {/* Exit Tutorial Confirmation Modal */}
        {showExitTutorialModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-tutorial-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-data select-none"
          >
            <div className="w-full max-w-xs rounded-md border border-line bg-panel-light p-5 shadow-card text-ink flex flex-col gap-4 text-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center text-danger font-bold text-lg">
                  ✕
                </div>
                <h3 id="exit-tutorial-title" className="font-heading text-lg text-ink font-bold tracking-wider uppercase mt-1">
                  EXIT NIX TUTORIAL?
                </h3>
                <p className="font-data text-xs text-ink-muted leading-relaxed">
                  Bypass the introductory tutorial cipher. The target will be marked as cleared and your transceiver will link directly to the City Map.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmExitTutorial}
                  data-testid="confirm-exit-tutorial-btn"
                  className="w-full h-11 min-h-[44px] px-4 rounded-[6px] bg-danger text-white hover:bg-danger/90 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center"
                >
                  SKIP TUTORIAL & GO TO MAP
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitTutorialModal(false)}
                  data-testid="cancel-exit-tutorial-btn"
                  className="w-full h-11 min-h-[44px] px-4 rounded-[6px] border border-line bg-panel text-ink-muted hover:text-ink font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center"
                >
                  RESUME CRACKING
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TerminalFrame>
  );
}
