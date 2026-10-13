import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from '@/components/ui/Button';

interface ResultScreenProps {
  nodeId: string;
  nodeName?: string;
  payout?: number;
  fine?: number;
  secret?: string;
  guesses: { guess: string; pots: number; pans: number }[];
  timeTaken: number;
  maxAttempts: number;
  onReturnToMap: () => void;
  onNextNode?: () => void;
}

/* =========================================================================
   BREACH SUCCESS SCREEN (2.1)
   - Animated count-up into wallet (instant if reduced-motion)
   - Accuracy, time, unused attempts bonus, exploit deductions stub
   - Actions: Return to map or Next adjacent node
   - Short success animation
   ========================================================================= */
export const SuccessScreen: React.FC<ResultScreenProps> = ({
  payout = 0,
  guesses,
  timeTaken,
  maxAttempts,
  onReturnToMap,
  onNextNode,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const attemptsUsed = guesses.length;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);
  const efficiencyBonus = attemptsRemaining * 20; // $20 bonus per unused try
  const exploitDeductions = 0; // Stub
  const totalPayout = payout + efficiencyBonus - exploitDeductions;

  // Accuracy calculation based on hits per guess
  const totalPots = guesses.reduce((acc, g) => acc + g.pots, 0);
  const totalPans = guesses.reduce((acc, g) => acc + g.pans, 0);
  const accuracy = Math.min(
    100,
    Math.round(((totalPots * 2 + totalPans) / (attemptsUsed * 4 || 1)) * 100)
  );

  // Animated count-up for payout
  const [displayedPayout, setDisplayedPayout] = useState(prefersReducedMotion ? totalPayout : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedPayout(totalPayout);
      return;
    }

    const duration = 1200; // ms
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayedPayout(Math.floor(eased * totalPayout));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayedPayout(totalPayout);
      }
    };

    const handle = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(handle);
  }, [totalPayout, prefersReducedMotion]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-panel-dark/95 flex flex-col items-center justify-center p-4 overflow-y-auto"
    >
      {/* Short success animation: green pulse wave */}
      {!prefersReducedMotion && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute w-64 h-64 rounded-full border-4 border-accent pointer-events-none"
        />
      )}

      <motion.div
        initial={prefersReducedMotion ? false : { scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-panel-dark border border-accent rounded-md w-full max-w-sm p-6 flex flex-col gap-5 shadow-card relative overflow-hidden"
      >
        {/* Header Banner */}
        <div className="text-center flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-data text-[10px] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            CIPHER SOLVED
          </div>
          <h2 className="font-heading text-3xl font-bold text-accent tracking-tight">
            BREACH SUCCESSFUL
          </h2>
          <p className="font-data text-xs text-ink-muted">ICE BYPASS VERIFIED // CREDIT UPLINK OPEN</p>
        </div>

        {/* Payout Display */}
        <div className="bg-panel-dark border border-accent/30 rounded-md p-4 flex flex-col items-center text-center">
          <span className="font-data text-[11px] text-ink-muted uppercase tracking-wider">
            CREDITS ACQUIRED
          </span>
          <div className="font-heading text-4xl font-extrabold text-money mt-1">
            +${displayedPayout.toLocaleString()}
          </div>
          <span className="font-data text-[10px] text-accent mt-0.5">TRANSFER ROUTED TO WALLET</span>
        </div>

        {/* Breakdown Table */}
        <div className="bg-surface-dark p-3.5 rounded-md border border-ink-muted/30 flex flex-col gap-2 font-data text-xs">
          <div className="flex justify-between items-center text-ink-muted">
            <span>Base Bounty</span>
            <span className="text-panel-light font-bold">${payout}</span>
          </div>

          <div className="flex justify-between items-center text-ink-muted">
            <span>Efficiency Bonus ({attemptsRemaining} remaining)</span>
            <span className="text-accent">+${efficiencyBonus}</span>
          </div>

          <div className="flex justify-between items-center text-ink-muted">
            <span>Time Taken</span>
            <span className="text-panel-light">{timeTaken}s</span>
          </div>

          <div className="flex justify-between items-center text-ink-muted">
            <span>Cracking Accuracy</span>
            <span className="text-accent">{accuracy}%</span>
          </div>

          <div className="flex justify-between items-center text-ink-muted/50 border-t border-ink-muted/20 pt-1.5">
            <span>Exploit Deductions</span>
            <span className="text-ink-muted">-$0 (None)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-1">
          <Button
            variant="primary"
            fullWidth
            onClick={onReturnToMap}
          >
            RETURN TO MAP
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={onNextNode ?? onReturnToMap}
            className="!bg-panel-dark !text-accent !border-accent/40 hover:!bg-accent/10"
          >
            NEXT ADJACENT NODE
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =========================================================================
   BREACH FAILURE SCREEN (2.2)
   - Connection severed
   - Fine / lockout countdown
   - Trace increase bar
   - Nix post-mortem of the guess history in plain words
   - Action: Disconnect
   ========================================================================= */
export const FailureScreen: React.FC<
  ResultScreenProps & { errorReason?: string; lockoutSeconds?: number }
> = ({
  fine = 0,
  secret,
  guesses,
  errorReason,
  lockoutSeconds = 60,
  onReturnToMap,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [lockout, setLockout] = useState(lockoutSeconds);

  useEffect(() => {
    if (lockout <= 0) return;
    const interval = setInterval(() => {
      setLockout((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout]);

  // Nix post-mortem analysis in character
  const nixComment = generateNixPostMortem(guesses, errorReason);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-panel-dark/95 flex flex-col items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={prefersReducedMotion ? false : { scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-panel-dark border border-danger rounded-md w-full max-w-sm p-6 flex flex-col gap-5 shadow-card relative overflow-hidden"
      >
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-danger/20 border border-danger/40 text-danger font-data text-[10px] tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping" />
            TRACE CONFIRMED
          </div>
          <h2 className="font-heading text-3xl font-bold text-danger tracking-tight">
            CONNECTION SEVERED
          </h2>
          <p className="font-data text-xs text-ink-muted">
            {errorReason || 'NODE ICE TRIPPED // UPLINK PURGED'}
          </p>
        </div>

        {/* Penalty & Trace Card */}
        <div className="bg-panel-dark p-4 rounded-md border border-danger/30 flex flex-col gap-3 font-data">
          {/* Trace increase bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-ink-muted font-bold">SECTOR TRACE INCREASE</span>
              <span className="text-danger font-bold">+18%</span>
            </div>
            <div className="w-full h-2.5 bg-ink rounded-full overflow-hidden border border-danger/30">
              <motion.div
                initial={prefersReducedMotion ? { width: '65%' } : { width: '40%' }}
                animate={{ width: '65%' }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-danger rounded-full"
              />
            </div>
          </div>

          <div className="border-t border-danger/20 pt-2.5 flex justify-between items-center text-xs">
            <span className="text-ink-muted">Trace Penalty Fine</span>
            <span className="text-danger font-bold text-sm">-${fine}</span>
          </div>

          {secret && (
            <div className="border-t border-danger/20 pt-2 flex justify-between items-center text-xs">
              <span className="text-ink-muted">Protected Secret Was</span>
              <span className="font-data text-sm tracking-widest text-panel-light font-bold">
                {secret}
              </span>
            </div>
          )}

          <div className="border-t border-danger/20 pt-2 flex justify-between items-center text-xs">
            <span className="text-ink-muted">Node Lockout Timer</span>
            <span className="text-money font-bold">
              00:{lockout.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Nix Post-Mortem Card */}
        <div className="bg-surface-dark p-3.5 rounded-md border border-ink-muted/30 text-xs font-data flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-ink border border-accent shrink-0 flex items-center justify-center font-bold text-accent text-xs">
            NX
          </div>
          <div className="flex-1 text-ink-muted">
            <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-0.5">
              Nix Post-Mortem
            </div>
            <div className="italic text-panel-light leading-snug">
              &quot;{nixComment}&quot;
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mt-1">
          <Button
            variant="danger"
            fullWidth
            onClick={onReturnToMap}
          >
            DISCONNECT
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =========================================================================
   PAUSE / QUIT CONFIRMATION MODAL (5)
   - Explains forfeit penalty & trace risk
   - Resume or Forfeit actions
   ========================================================================= */
interface QuitModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmQuit: () => void;
}

export const QuitModal: React.FC<QuitModalProps> = ({ isOpen, onCancel, onConfirmQuit }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.92, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 10 }}
          className="bg-panel-dark border border-danger/60 rounded-md p-5 max-w-xs w-full flex flex-col gap-4 text-center shadow-card"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center text-danger font-bold text-lg">
              !
            </div>
            <h3 className="font-heading text-xl text-panel-light font-bold mt-1">
              ABORT INFILTRATION?
            </h3>
            <p className="font-data text-xs text-ink-muted leading-relaxed mt-1">
              Severing uplink prematurely will trigger an emergency ICE trace spike{' '}
              <span className="text-danger font-bold">(+10% Heat)</span> and forfeit this node access attempt.
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <Button
              variant="primary"
              fullWidth
              onClick={onCancel}
            >
              RESUME HACK
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={onConfirmQuit}
              className="!bg-panel-dark !text-danger !border-danger/40 hover:!bg-danger/10"
            >
              FORFEIT & DISCONNECT
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* =========================================================================
   HELPER: Generate Nix Post-Mortem in Plain Words
   ========================================================================= */
function generateNixPostMortem(
  guesses: { guess: string; pots: number; pans: number }[],
  reason?: string
): string {
  if (reason && reason.toLowerCase().includes('time')) {
    return 'The ICE timer beat you to the punch. Next time enter your probes faster and don’t overthink the first two attempts.';
  }

  if (guesses.length === 0) {
    return 'Connection dropped before you made a single probe. Check your deck signal.';
  }

  const bestGuess = guesses.reduce(
    (best, cur) => (cur.pots * 2 + cur.pans > best.pots * 2 + best.pans ? cur : best),
    guesses[0]
  );

  if (bestGuess.pots >= 2) {
    return `You had ${bestGuess.pots} numbers locked in the correct slot early on. You shifted away from your winners instead of pinning the remaining positions.`;
  }

  if (bestGuess.pans >= 2) {
    return `You had ${bestGuess.pans} right digits trapped in the wrong spots. You needed to rotate their slots rather than swapping in new numbers.`;
  }

  return 'You burned too many tries testing numbers that were already ruled out. Keep an eye on the dead keys so you don’t repeat zero-hit digits.';
}
