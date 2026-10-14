'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { STEPS } from '../steps';
import { useOnboardingStore } from '../onboardingStore';
import { track } from '../analytics';

const GLITCH_LINES = STEPS['glitch.intro'].lines;

export function GlitchIntroScene() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { advance } = useOnboardingStore();

  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDebtCard, setShowDebtCard] = useState(false);

  const currentLine = GLITCH_LINES[lineIndex] || '';

  // Typewriter effect
  useEffect(() => {
    if (showDebtCard || !currentLine) return;

    if (shouldReduceMotion) {
      setDisplayedText(currentLine);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const intervalMs = Math.max(12, Math.floor(700 / currentLine.length));
    const timer = setInterval(() => {
      index++;
      setDisplayedText(currentLine.slice(0, index));
      if (index >= currentLine.length) {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [lineIndex, currentLine, shouldReduceMotion, showDebtCard]);

  const handleNextLine = () => {
    if (showDebtCard) return;

    if (isTyping) {
      // If typing, tap finishes line immediately
      setDisplayedText(currentLine);
      setIsTyping(false);
      return;
    }

    if (lineIndex < GLITCH_LINES.length - 1) {
      setLineIndex((prev) => prev + 1);
    } else {
      setShowDebtCard(true);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDebtCard(true);
  };

  const handleContinue = () => {
    track('glitch_done');
    advance('profile.create');
    router.push('/onboarding/profile');
  };

  return (
    <div
      onClick={handleNextLine}
      className="flex-1 w-full bg-panel text-ink flex flex-col justify-between p-6 select-none relative overflow-hidden cursor-pointer"
      data-surface="panel"
    >
      {/* Header bar with SKIP button */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" aria-hidden="true" />
          <span className="font-data text-xs font-bold uppercase tracking-wider text-danger-text">
            INCOMING TRANSMISSION
          </span>
        </div>
        {!showDebtCard && (
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Skip intro dialogue"
            className="font-data text-xs text-ink-muted hover:text-ink uppercase tracking-wider min-h-[44px] min-w-[44px] px-2 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            SKIP
          </button>
        )}
      </div>

      {/* Main Dialogue Panel */}
      <div className="my-auto w-full max-w-sm mx-auto flex flex-col gap-6">
        {/* Character Tab & Portrait */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-[12px] bg-panel-light border border-line flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <span className="font-heading text-xl font-bold text-ink-muted">GL</span>
          </div>
          <div>
            <div className="inline-block px-2 py-0.5 rounded-[4px] bg-panel-light border border-line">
              <span className="font-data text-[11px] font-bold tracking-[1.5px] uppercase text-ink">
                GLITCH
              </span>
            </div>
            <p className="font-data text-[11px] text-ink-muted mt-0.5 uppercase tracking-wider">
              Syndicate Fixer
            </p>
          </div>
        </div>

        {/* Dialogue Card */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-panel-light border border-line shadow-card min-h-[110px] flex flex-col justify-between">
          <p
            aria-live="polite"
            className="font-data text-sm sm:text-base text-ink leading-relaxed"
          >
            {displayedText}
          </p>

          {!showDebtCard && (
            <div className="flex justify-end pt-3">
              <span className="font-data text-[10px] uppercase tracking-wider text-ink-muted">
                {isTyping ? 'TAP TO COMPLETE' : 'TAP TO CONTINUE ▶'}
              </span>
            </div>
          )}
        </div>

        {/* Debt Card Slide-In */}
        {showDebtCard && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="p-5 rounded-[12px] bg-panel-light border-2 border-danger/40 shadow-card flex flex-col items-center text-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-data text-[11px] font-bold tracking-[2px] uppercase text-ink-muted">
              KOVACS SYNDICATE
            </span>
            <div className="font-heading text-[28px] font-bold text-money-text leading-tight">
              DEBT $10,000
            </div>
            <p className="font-data text-xs text-ink-muted leading-tight">
              They do not take excuses. Crack targets, earn bounties, and clear your ledger.
            </p>
            <div className="w-full pt-2">
              <Button
                variant="primary"
                size="full"
                onClick={handleContinue}
                data-testid="glitch-continue-btn"
              >
                CONTINUE
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom spacing placeholder */}
      <div className="h-6 shrink-0" />
    </div>
  );
}
