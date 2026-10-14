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
      className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden"
    >
      {isTargetVisible && (
        <svg
          data-testid="tutorial-curtain"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                rx="8"
                ry="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(10, 14, 12, 0.72)"
            mask="url(#tutorial-spotlight-mask)"
          />
        </svg>
      )}

      {isTargetVisible ? (
        <>
          <div
            aria-hidden="true"
            data-testid="tutorial-backdrop-guard"
            className="absolute left-0 right-0 top-0 pointer-events-auto"
            style={{ height: top }}
            onClick={handleBackdropClick}
          />
          <div
            aria-hidden="true"
            data-testid="tutorial-backdrop-guard"
            className="absolute bottom-0 left-0 right-0 pointer-events-auto"
            style={{ top: top + height }}
            onClick={handleBackdropClick}
          />
          <div
            aria-hidden="true"
            data-testid="tutorial-backdrop-guard"
            className="absolute left-0 pointer-events-auto"
            style={{ top, width: left, height }}
            onClick={handleBackdropClick}
          />
          <div
            aria-hidden="true"
            data-testid="tutorial-backdrop-guard"
            className="absolute right-0 pointer-events-auto"
            style={{ top, left: left + width, height }}
            onClick={handleBackdropClick}
          />
        </>
      ) : null}

      {/* Target spotlight highlight ring (pointer-events-none so target underneath receives click) */}
      {isTargetVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          role="img"
          aria-label={`Nix target: ${activeStep.title}`}
          data-testid="tutorial-target-highlight"
          className="absolute rounded-md border-2 border-accent pointer-events-none"
          style={{
            top,
            left,
            width,
            height,
            outline: '2px solid var(--surface-panel-light)',
            outlineOffset: '2px',
          }}
        >
          <span className="absolute -top-3 -right-2 rounded-sm border border-panel-light bg-accent px-2 py-1 font-data text-[10px] font-semibold tracking-[1px] text-on-accent shadow-card">
            NIX TARGET
          </span>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Character portraits/Nix.png"
              alt="Nix"
              className="w-full h-full object-cover"
            />
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
          className="bg-panel-light border border-line text-ink font-semibold shadow-card hover:text-danger hover:border-danger hover:bg-panel px-3 py-2 text-[11px] tracking-[1px] flex items-center gap-1.5"
        >
          <span>SKIP TUTORIAL</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger shrink-0" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  );
};
