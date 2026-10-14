'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { validateGuess, bestGuess, provenDeadDigits, GuessRecord } from '@neon-cipher/game-rules';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useCampaignStore } from '@/stores/campaign-store';
import { getChapterById } from '@neon-cipher/game-rules';
import { terminalService, SessionData } from './terminalService';
import { TerminalFrame } from './TerminalFrame';
import {
  TerminalHeader,
  ProgressStrip,
  HistoryList,
  GuessEntry,
  Keypad,
  ClueLegendDrawer,
  BreachBanner,
} from './components';
import { TutorialOverlay } from '@/features/story/TutorialOverlay';
import { QuitModal } from './TerminalScreens';
import { emit } from '@/features/onboarding/events';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { TUTORIAL, CH2_NODE_ID } from '@/features/onboarding/steps';
import { campaignService } from '@/features/story/campaignService';
import { NIX_RECOVERY_NODE_ID } from '@/features/story/recoveryQuest';
import { triggerToast } from '@/stores/toast-store';

export default function TerminalScreen({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const { addCredits, subtractCredits } = usePlayerStore();
  const rookieAssist = useSettingsStore((s) => s.rookieAssist);
  const assistMode: 'rookie' | 'pro' = rookieAssist ? 'rookie' : 'pro';

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
  const isCampaignTarget = chapter && chapter.mapNodeId === nodeId;
  const isCampaignNode = isCampaignTarget && tutorialActive;
  const activeTutorialStep =
    isCampaignNode && chapter.tutorialSteps ? chapter.tutorialSteps[tutorialStepIndex] : null;

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
    if (!session || !session.config.timerSeconds || session.config.timerSeconds === 0 || status !== 'playing') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      setElapsedSeconds(elapsed);

      if (elapsed >= (session.config.timerSeconds ?? 0)) {
        clearInterval(interval);
        setStatus('lost');
        setAttemptsLeft(0);
        setValidationError('Time expired');
        emit({ type: 'terminal:lost', nodeId });

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
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, status, nodeId, subtractCredits]);

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
  const deadDigits = useMemo(() => provenDeadDigits(history), [history]);
  const latestRecord = history.length > 0 ? history[history.length - 1] : null;
  const tacticalHint = useMemo(() => {
    if (!latestRecord || !session) return null;
    const { digits } = session.config;
    if (latestRecord.pans === 0 && latestRecord.pots === digits) {
      return `All ${digits} digits found! Swap positions to breach.`;
    }
    return null;
  }, [latestRecord, session]);

  const handleDigit = useCallback(
    (digit: number) => {
      if (status !== 'playing' || !session) return;

      if (entry.length >= session.config.digits) {
        setValidationError(`Needs ${session.config.digits} digits`);
        setShakeKey((k) => k + 1);
        return;
      }

      if (!session.config.allowDuplicates && entry.includes(digit)) {
        setValidationError('No repeats on this tier');
        setShakeKey((k) => k + 1);
        return;
      }

      setEntry((prev) => [...prev, digit]);
      setValidationError(null);
    },
    [status, session, entry]
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

      // Advance tutorial if awaiting submit
      if (activeTutorialStep?.actionRequired === 'submit-guess') {
        nextTutorialStep();
      }

      const nextStatus =
        res.status === 'won' ? 'won' : res.status === 'lost' ? 'lost' : 'playing';

      if (nextStatus !== 'playing') {
        setStatus(nextStatus);

        if (nextStatus === 'won') {
          if (res.payout) {
            setPayout(res.payout);
            addCredits(res.payout);
          }
          if (res.secret) setSecret(res.secret);
          if (chapter && chapter.mapNodeId === nodeId) {
            completeChapter(chapter.id);
          }
          if (nodeId === TUTORIAL.terminalId || nodeId === 'tutorial-soda') {
            campaignService.completeChapter(1).catch(() => {});
            useOnboardingStore.getState().crackNode(TUTORIAL.mapNodeId, TUTORIAL.cooldownMs);
          }
        } else if (nextStatus === 'lost') {
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
  const usedAttempts = config.attempts != null ? config.attempts - attemptsLeft : history.length;
  const isSubmitDisabled =
    entry.length !== config.digits ||
    (!config.allowDuplicates && new Set(entry).size !== entry.length);

  return (
    <TerminalFrame tier={config.tier}>
      <div
        className="flex flex-col h-full w-full bg-terminal-bg text-terminal-ink overflow-hidden relative"
        data-surface="terminal"
      >
        {/* CRT Scanline Layer (3% opacity) */}
        <div className="terminal-scanline absolute inset-0 pointer-events-none z-10" />

        {/* 1. Header (72px) */}
        <TerminalHeader
          nodeName={nodeId === NIX_RECOVERY_NODE_ID ? "Nix's Recovery Run" : `Node: ${nodeId}`}
          config={config}
          usedAttempts={usedAttempts}
          elapsedSeconds={elapsedSeconds}
          onOpenLegend={() => setIsLegendOpen(true)}
        />

        {/* 2. Progress Strip (32px) */}
        <ProgressStrip
          currentAttempt={usedAttempts + (status === 'playing' ? 1 : 0)}
          maxAttempts={config.attempts}
          best={best}
          totalSeconds={config.timerSeconds}
          elapsedSeconds={elapsedSeconds}
        />

        {/* 3. History (Flex-fills and scrolls, newest at bottom) */}
        <HistoryList history={history} length={config.digits} />

        {/* 4. Guess Entry Row */}
        <GuessEntry
          digits={config.digits}
          entry={entry}
          validationError={validationError}
          shakeKey={shakeKey}
          hint={tacticalHint}
        />

        {/* 5. Keypad (3x4, 56px keys, radius 8, 8px gaps) */}
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
              } else if (nodeId === CH2_NODE_ID && status === 'won') {
                triggerToast('Black Market unlocked');
                campaignService.completeChapter(2).catch(() => {});
                useOnboardingStore.getState().advance('market.gate');
                router.push('/market');
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
            onSkipTutorial={() => skipTutorial(chapter.id)}
          />
        )}
      </div>
    </TerminalFrame>
  );
}
