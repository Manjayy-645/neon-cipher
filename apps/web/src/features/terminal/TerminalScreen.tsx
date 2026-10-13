'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TerminalKeypad from './TerminalKeypad';
import TerminalHistory from './TerminalHistory';
import { terminalService, SessionData } from './terminalService';
import { validateGuess } from '@neon-cipher/game-rules/src/index';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/player-store';
import { useSettingsStore } from '@/stores/settings-store';
import { calculateDeadKeys } from './rookieAssist';
import { TerminalFrame } from './TerminalFrame';
import { IceIndicator } from './IceIndicator';
import { SuccessScreen, FailureScreen, QuitModal } from './TerminalScreens';
import { useCampaignStore } from '@/stores/campaign-store';
import { getChapterById } from '@neon-cipher/game-rules/src/index';
import { TutorialOverlay } from '@/features/story/TutorialOverlay';
import { Button } from '@/components/ui/Button';

export default function TerminalScreen({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const { addCredits, subtractCredits } = usePlayerStore();
  const { rookieAssist } = useSettingsStore();

  const [session, setSession] = useState<SessionData | null>(null);
  const [input, setInput] = useState('');
  const [guesses, setGuesses] = useState<{ guess: string; pots: number; pans: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<'active' | 'won' | 'lost'>('active');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [nixWarning, setNixWarning] = useState<string | null>(null);
  const [payout, setPayout] = useState<number>(0);
  const [fine, setFine] = useState<number>(0);
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [failureReason, setFailureReason] = useState<string | undefined>(undefined);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  // Rookie Assist: calculate dead keys (active unless user selected Pro Mode in settings)
  const proMode = !rookieAssist;

  const {
    activeChapterId,
    tutorialActive,
    tutorialStepIndex,
    nextTutorialStep,
    skipTutorial,
    completeChapter,
  } = useCampaignStore();

  const chapter = activeChapterId ? getChapterById(activeChapterId) : null;
  const isCampaignNode = chapter && chapter.mapNodeId === nodeId && tutorialActive;
  const activeTutorialStep =
    isCampaignNode && chapter.tutorialSteps ? chapter.tutorialSteps[tutorialStepIndex] : null;

  // Auto-advance tutorial when digits are filled
  useEffect(() => {
    if (!activeTutorialStep || !session) return;
    if (
      activeTutorialStep.actionRequired === 'input-digits' &&
      input.length === session.config.digits
    ) {
      nextTutorialStep();
    }
  }, [input, activeTutorialStep, session, nextTutorialStep]);

  useEffect(() => {
    let mounted = true;
    terminalService
      .startSession(nodeId)
      .then((sess) => {
        if (!mounted) return;
        setSession(sess);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [nodeId]);

  // Client-side timer from single server startedAt timestamp
  useEffect(() => {
    if (!session || session.config.timerSeconds === 0 || status !== 'active') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      const rem = session.config.timerSeconds - elapsed;
      if (rem <= 0) {
        setTimeLeft(0);
        setStatus('lost');
        setFailureReason('ICE TRACE REACHED 100% — TIME EXPIRED');
        setFine(Math.floor(100)); // Standard timeout penalty
        setTimeTaken(session.config.timerSeconds);
        clearInterval(interval);
      } else {
        setTimeLeft(rem);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, status]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (status !== 'active' || !session) return;
      if (input.length < session.config.digits) {
        setInput((prev) => prev + key);
        setNixWarning(null);
      }
    },
    [input, session, status]
  );

  const handleBackspace = useCallback(() => {
    if (status !== 'active') return;
    setInput((prev) => prev.slice(0, -1));
    setNixWarning(null);
  }, [status]);

  const handleSubmit = useCallback(async () => {
    if (status !== 'active' || !session) return;
    if (!validateGuess(input, session.config.digits, session.config.allowDuplicates)) return;

    // Contextual Nix warning when player repeats a previous guess
    const isRepeat = guesses.some((g) => g.guess === input);
    if (isRepeat) {
      setNixWarning("You've already tested that code sequence. Don't waste an attempt!");
      setInput('');
      return;
    }

    try {
      const res = await terminalService.submitGuess(session.sessionId, input);
      if (res.error) {
        setError(res.error);
        return;
      }

      const nextGuesses = [
        ...guesses,
        {
          guess: input,
          pots: res.pots ?? 0,
          pans: res.pans ?? 0,
        },
      ];
      setGuesses(nextGuesses);

      // Advance tutorial if awaiting submit
      if (activeTutorialStep?.actionRequired === 'submit-guess') {
        nextTutorialStep();
      }

      if (res.status !== 'active') {
        setStatus(res.status);
        const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
        setTimeTaken(elapsed);

        if (res.status === 'won') {
          if (res.payout) {
            setPayout(res.payout);
            addCredits(res.payout);
          }
          if (res.secret) setSecret(res.secret);

          // Mark campaign chapter completed
          if (chapter && chapter.mapNodeId === nodeId) {
            completeChapter(chapter.id);
          }
        } else if (res.status === 'lost') {
          if (res.fine) {
            setFine(res.fine);
            subtractCredits(res.fine);
          }
          if (res.secret) setSecret(res.secret);
          setFailureReason(res.error || 'MAX ATTEMPTS EXCEEDED // LOCKOUT');
        }
      }
      setInput('');
    } catch (err: any) {
      setError(err.message);
    }
  }, [input, session, status, guesses, addCredits, subtractCredits, activeTutorialStep, nextTutorialStep, chapter, nodeId, completeChapter]);

  // Desktop keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'active' || isQuitModalOpen) return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setIsQuitModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, handleSubmit, status, isQuitModalOpen]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center font-data text-accent bg-panel-dark gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="tracking-widest uppercase text-xs">ESTABLISHING QUANTUM LINK...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-panel-dark text-danger-text font-data p-6 text-center gap-4">
        <div className="text-xl font-bold tracking-wider">CONNECTION FAILED</div>
        <div className="text-sm opacity-80">{error}</div>
        <Button
          variant="danger"
          onClick={() => router.push('/map')}
          className="px-6 py-2"
        >
          ABORT TO MAP
        </Button>
      </div>
    );
  }

  const { config } = session;
  const isInputValid = validateGuess(input, config.digits, config.allowDuplicates);
  const deadKeys = useMemo(() => {
    const calculated = calculateDeadKeys(guesses, proMode);
    if (!config.eliminatedDigits || proMode) return calculated;
    return Array.from(new Set([...calculated, ...config.eliminatedDigits])).sort();
  }, [guesses, proMode, config.eliminatedDigits]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <TerminalFrame tier={config.tier}>
      <div className="flex flex-col h-full w-full bg-panel-dark text-panel-light overflow-hidden relative">
        {/* Header Bar */}
        <header className="flex justify-between items-center px-4 py-2.5 bg-ink border-b border-ink-muted/40 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Abort / Pause button */}
            <Button
              variant="ghost"
              compact
              onClick={() => setIsQuitModalOpen(true)}
              className="p-1.5 !min-h-[32px] !w-[32px] !rounded bg-ink-muted/20 border-ink-muted/30 text-ink-muted hover:text-danger hover:border-danger text-xs font-data transition-colors focus-visible:ring-2 focus-visible:ring-danger outline-none"
              aria-label="Pause or abort session"
              title="Pause / Abort"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </Button>

            <div className="min-w-0">
              <h1 className="font-heading text-base text-panel-light truncate">Node: {nodeId}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-data text-[9px] text-accent tracking-widest uppercase">
                  TIER {config.tier} • {config.allowDuplicates ? 'REPEAT' : 'UNIQUE'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* ICE Indicator chip with info popover */}
            <IceIndicator ice={config.ice} />

            {/* ICE Timer bar / readout */}
            <div className="text-right" data-tutorial="terminal-timer">
              {config.timerSeconds > 0 ? (
                <>
                  <div
                    className={`font-data text-lg font-bold leading-none ${
                      timeLeft !== null && timeLeft <= 15
                        ? 'text-danger-text animate-pulse'
                        : 'text-accent'
                    }`}
                  >
                    {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                  </div>
                  <div className="font-data text-[9px] text-ink-muted tracking-widest uppercase mt-0.5">
                    ICE TRACE
                  </div>
                </>
              ) : (
                <div className="font-data text-[9px] text-ink-muted tracking-widest uppercase">
                  NO ICE
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Attempt Pips */}
        <div
          data-tutorial="attempt-pips"
          className="flex justify-center gap-1.5 py-2 bg-[var(--terminal-bg,#0e120f)] px-4 shrink-0 border-b border-ink/40"
        >
          {Array.from({ length: config.attempts }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < guesses.length ? 'bg-danger' : 'bg-ink-muted/30'
              }`}
            />
          ))}
        </div>

        {/* Current Digit Input Slots */}
        <div className="flex justify-center items-center py-4 shrink-0 relative bg-panel-dark/50">
          <div className="flex gap-2.5 sm:gap-3 p-3 bg-ink/90 rounded-md border border-ink-muted/50 shadow-card">
            {Array.from({ length: config.digits }).map((_, index) => (
              <div
                key={index}
                className="w-11 h-14 sm:w-12 sm:h-16 flex items-center justify-center border-b-4 border-accent bg-[var(--terminal-panel,#121814)] rounded-md font-data text-3xl sm:text-4xl text-panel-light font-bold"
              >
                {input[index] || ''}
              </div>
            ))}
          </div>

          {/* Tool slots (disabled stubs) */}
          <div className="absolute right-3 flex flex-col gap-1.5">
            <Button
              variant="secondary"
              compact
              disabled
              className="!w-8 !h-8 !min-h-[32px] !p-0 !rounded bg-ink/60 border border-ink-muted/40 flex items-center justify-center !opacity-40 cursor-not-allowed"
              title="Tool slot 1 (Empty)"
              aria-label="Tool slot 1"
            >
              <div className="w-3.5 h-3.5 border border-ink-muted/60 rounded-xs" />
            </Button>
            <Button
              variant="secondary"
              compact
              disabled
              className="!w-8 !h-8 !min-h-[32px] !p-0 !rounded bg-ink/60 border border-ink-muted/40 flex items-center justify-center !opacity-40 cursor-not-allowed"
              title="Tool slot 2 (Empty)"
              aria-label="Tool slot 2"
            >
              <div className="w-3.5 h-3.5 border border-ink-muted/60 rounded-full" />
            </Button>
          </div>

          {/* Nix Pip corner icon */}
          <div className="absolute left-3 bottom-2 flex items-center gap-1 opacity-70">
            <div className="w-5 h-5 rounded-full bg-ink border border-accent flex items-center justify-center text-[9px] font-bold text-accent">
              NX
            </div>
            <span className="font-data text-[8px] text-ink-muted uppercase hidden sm:inline">
              ROOKIE
            </span>
          </div>
        </div>

        {/* Guess History with Pot/Pan/Miss & ICE rules */}
        <TerminalHistory guesses={guesses} digits={config.digits} ice={config.ice} />

        {/* Nix Context Warning (impossible repeats, etc.) */}
        <AnimatePresence>
          {nixWarning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-[240px] left-4 right-4 bg-panel-dark border-l-4 border-accent text-panel-light p-3 rounded-md shadow-card font-data text-xs z-30 flex items-center gap-2.5 border border-ink-muted"
            >
              <div className="w-7 h-7 rounded-full bg-ink border border-accent flex items-center justify-center font-bold text-accent shrink-0 text-xs">
                NX
              </div>
              <div className="flex-1 italic leading-tight text-panel-light/90">{nixWarning}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breach Success Screen (2.1) */}
        {status === 'won' && (
          <SuccessScreen
            nodeId={nodeId}
            payout={payout}
            guesses={guesses}
            timeTaken={timeTaken}
            maxAttempts={config.attempts}
            onReturnToMap={() => router.push('/map')}
            onNextNode={() => router.push('/map')}
          />
        )}

        {/* Breach Failure Screen (2.2) */}
        {status === 'lost' && (
          <FailureScreen
            nodeId={nodeId}
            fine={fine}
            secret={secret}
            guesses={guesses}
            timeTaken={timeTaken}
            maxAttempts={config.attempts}
            errorReason={failureReason}
            onReturnToMap={() => router.push('/map')}
          />
        )}

        {/* Pause/Quit Confirmation Modal (5) */}
        <QuitModal
          isOpen={isQuitModalOpen}
          onCancel={() => setIsQuitModalOpen(false)}
          onConfirmQuit={() => {
            setIsQuitModalOpen(false);
            router.push('/map');
          }}
        />

        {/* Keypad */}
        <TerminalKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onSubmit={handleSubmit}
          disabledKeys={deadKeys}
          isSubmitDisabled={!isInputValid}
        />

        {/* Guided Tutorial Overlay (Task 10) */}
        {activeTutorialStep && activeTutorialStep.phase === 'terminal' && status === 'active' && chapter && (
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
