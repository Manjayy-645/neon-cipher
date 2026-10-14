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
  const { addCredits, subtractCredits, equippedTools, inventory, syncWallet } = usePlayerStore();
  const rookieAssist = useSettingsStore((s) => s.rookieAssist);
  const assistMode: 'rookie' | 'pro' = rookieAssist ? 'rookie' : 'pro';

  const [toolFeedback, setToolFeedback] = useState<string | null>(null);
  const [isActivatingTool, setIsActivatingTool] = useState(false);
  const [iceShieldArmed, setIceShieldArmed] = useState(false);
  const [eliminatedByTools, setEliminatedByTools] = useState<string[]>([]);
  const [activatedTools, setActivatedTools] = useState<string[]>([]);
  const [isTimerFrozen, setIsTimerFrozen] = useState(false);
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
    if (!session || !session.config.timerSeconds || session.config.timerSeconds === 0 || status !== 'playing' || isTimerFrozen) return;

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
  }, [session, status, nodeId, subtractCredits, isTimerFrozen]);

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
    const fromPreConfig = (session?.config.eliminatedDigits || []).map((d) => parseInt(d, 10));
    const fromTools = eliminatedByTools.map((d) => parseInt(d, 10));
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
    [status, session, entry, deadDigits]
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
  const node = getNodeById(nodeId);
  const nodeName =
    config.nodeName ||
    node?.name ||
    (nodeId === NIX_RECOVERY_NODE_ID ? "Nix's Recovery Run" : `Node: ${nodeId}`);
  const nodeType = config.nodeType || node?.type || 'vending';

  const usedAttempts = config.attempts != null ? config.attempts - attemptsLeft : history.length;
  const isSubmitDisabled =
    entry.length !== config.digits ||
    (!config.allowDuplicates && new Set(entry).size !== entry.length);

  return (
    <TerminalFrame tier={config.tier} nodeName={nodeName} nodeType={nodeType}>
      <div
        className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-terminal-bg text-terminal-ink overflow-hidden relative md:grid md:grid-cols-12 md:grid-rows-1"
        data-surface="terminal"
      >
        {/* CRT Scanline Layer (3% opacity) */}
        <div className="terminal-scanline absolute inset-0 pointer-events-none z-10" />

        {/* Left Column (Mobile: Top rows, Desktop: 7 cols) */}
        <div className="flex flex-col min-h-0 flex-1 md:col-span-7 md:h-full md:border-r md:border-terminal-line/40 overflow-hidden">
          {/* 1. Header (72px / 48px compact) */}
          <TerminalHeader
            nodeName={nodeName}
            nodeId={nodeId}
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
        </div>

        {/* Right Column (Mobile: Pinned Control Deck, Desktop: 5 cols) */}
        <div className="flex flex-col shrink-0 md:col-span-5 md:h-full md:justify-between md:overflow-y-auto z-10">
          <div className="flex flex-col shrink-0">
            {/* 4. Guess Entry Row */}
            <GuessEntry
              digits={config.digits}
              entry={entry}
              validationError={validationError}
              shakeKey={shakeKey}
              hint={tacticalHint}
              revealedSlots={revealedSlots}
            />

            {/* 5. Tool Slots Row (Equipped intrusion tools) */}
            <TerminalToolSlots
              equippedTools={equippedTools}
              inventory={inventory}
              onActivateTool={handleActivateTool}
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
                className="mx-4 mt-2 px-3 py-1.5 rounded-[6px] bg-terminal-panel border border-terminal-phosphor/70 flex items-center justify-between text-terminal-phosphor font-data text-xs shadow-xs"
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
          </div>

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
