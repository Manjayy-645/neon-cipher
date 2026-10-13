'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialStep, ChapterData } from '@neon-cipher/game-rules/src/index';
import { useCampaignStore } from '@/stores/campaign-store';
import { Button } from '@/components/ui/Button';

export interface TutorialOverlayProps {
  chapter: ChapterData;
  activeStep?: TutorialStep;
  currentStepIndex: number;
  onAdvanceStep: () => void;
  onSkipTutorial: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  chapter,
  activeStep,
  currentStepIndex,
  onAdvanceStep,
  onSkipTutorial,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [guardWarning, setGuardWarning] = useState<string | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measure target DOM element whenever activeStep or window changes
  const updateRect = useCallback(() => {
    if (!activeStep?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(activeStep.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [activeStep?.targetSelector]);

  useEffect(() => {
    updateRect();
    const interval = setInterval(updateRect, 300);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    setGuardWarning('Target locked: Follow Nix’s guidance to proceed.');
    warningTimeoutRef.current = setTimeout(() => {
      setGuardWarning(null);
    }, 2000);
  };

  if (!activeStep) return null;

  const pad = activeStep.spotlightPadding || 8;
  const isTargetVisible = targetRect !== null;

  // Calculate spotlight box coordinates
  const top = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const left = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const width = targetRect ? targetRect.width + pad * 2 : 0;
  const height = targetRect ? targetRect.height + pad * 2 : 0;

  // Intelligent Nix callout bubble placement: above or below target
  const placeAbove = targetRect ? targetRect.top > window.innerHeight / 2 : false;
  const bubbleTop = targetRect
    ? placeAbove
      ? Math.max(70, targetRect.top - 180)
      : Math.min(window.innerHeight - 180, targetRect.bottom + 20)
    : 100;

  const totalSteps = chapter.tutorialSteps?.length || 1;

  return (
    <div
      data-testid="tutorial-overlay"
      className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden"
    >
      {/* Dark backdrop cutout with SVG mask */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={handleBackdropClick}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            {/* White covers all (opaque) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black hole cut out at target coordinates */}
            {isTargetVisible && (
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                rx="8"
                ry="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Semi-transparent dark curtain */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 14, 12, 0.72)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Target spotlight highlight ring (pointer-events-none so target underneath receives click) */}
      {isTargetVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute border-2 border-accent rounded-md pointer-events-none shadow-[0_0_15px_rgba(66,105,71,0.6)]"
          style={{
            top,
            left,
            width,
            height,
          }}
        >
          {/* Pulsing beacon in top corner */}
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent animate-ping" />
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent border-2 border-white" />
        </motion.div>
      )}

      {/* Input Guard Warning Banner */}
      <AnimatePresence>
        {guardWarning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-danger text-white text-xs font-data rounded-sm shadow-card border border-white/20 z-50 pointer-events-none uppercase tracking-wider text-center max-w-[90vw]"
          >
            {guardWarning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nix Tactical Guide Speech Bubble (Style Guide Section 5) */}
      <motion.div
        initial={{ opacity: 0, y: placeAbove ? 20 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        key={activeStep.id}
        transition={{ duration: 0.25 }}
        className="absolute left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] bg-panel-light p-4 rounded-md border border-line border-l-4 border-l-accent shadow-card z-50 pointer-events-auto"
        style={{ top: `${bubbleTop}px` }}
        data-testid="nix-tutorial-bubble"
      >
        <div className="flex items-start gap-3">
          {/* Round Nix portrait slot (Style Guide 36px round) */}
          <div className="w-10 h-10 rounded-full bg-panel border-2 border-accent overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 100 100" className="w-full h-full text-accent" fill="none">
              <rect width="100" height="100" fill="var(--surface-panel)" />
              <circle cx="50" cy="45" r="22" fill="var(--surface-panel-light)" stroke="var(--line)" strokeWidth="2" />
              <circle cx="43" cy="42" r="3.5" fill="var(--accent)" />
              <circle cx="57" cy="42" r="3.5" fill="var(--accent)" />
              <rect x="38" y="52" width="24" height="3" rx="1.5" fill="var(--accent)" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-heading text-xs font-bold text-accent-text tracking-wider uppercase">
                NIX // TACTICAL GUIDE
              </span>
              <span className="font-data text-[10px] font-bold text-ink-muted bg-panel px-2 py-0.5 rounded-full border border-line/60 tabular-nums">
                {currentStepIndex + 1}/{totalSteps}
              </span>
            </div>

            <h3 className="font-heading text-[16px] font-bold text-ink mb-1 leading-snug">
              {activeStep.title}
            </h3>

            <p className="font-data text-xs leading-relaxed text-ink font-normal">
              {activeStep.nixDialogue}
            </p>
          </div>
        </div>

        {/* Footer with step acknowledgment or dismiss action */}
        <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between gap-2">
          <span className="text-[10px] font-data text-ink-muted uppercase tracking-wider font-semibold">
            {activeStep.actionRequired === 'free-play'
              ? 'SOLVE CIPHER TO COMPLETE'
              : activeStep.actionRequired === 'dismiss-callout'
              ? 'TAP TO ACKNOWLEDGE'
              : 'ACT ON HIGHLIGHTED ELEMENT'}
          </span>

          {activeStep.actionRequired === 'dismiss-callout' ? (
            <Button
              variant="primary"
              compact
              arrow
              onClick={onAdvanceStep}
              data-testid="tutorial-advance-button"
            >
              UNDERSTOOD
            </Button>
          ) : activeStep.actionRequired === 'free-play' ? (
            <Button
              variant="primary"
              compact
              arrow
              onClick={onAdvanceStep}
              data-testid="tutorial-freeplay-button"
            >
              COMMENCE CRACK
            </Button>
          ) : null}
        </div>
      </motion.div>

      {/* Escape Hatch: SKIP TUTORIAL button (Top Right, min 44px hit target) */}
      <div className="absolute top-3 right-3 z-50 pointer-events-auto">
        <Button
          variant="secondary"
          compact
          onClick={onSkipTutorial}
          data-testid="skip-tutorial-button"
          aria-label="Skip guided tutorial"
          className="bg-panel-light border border-line text-ink font-semibold shadow-card hover:text-danger hover:border-danger hover:bg-panel px-3 py-2 text-[11px] tracking-[1px]"
        >
          <span>SKIP TUTORIAL</span>
          <span className="text-danger font-bold ml-1.5" aria-hidden="true">✕</span>
        </Button>
      </div>
    </div>
  );
};
