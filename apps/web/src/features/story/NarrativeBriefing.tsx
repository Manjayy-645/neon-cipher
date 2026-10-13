'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChapterData, getBrokerCharacter, getMentorCharacter } from '@neon-cipher/game-rules/src/index';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { useCampaignStore } from '@/stores/campaign-store';
import { Button } from '@/components/ui/Button';

export interface NarrativeBriefingProps {
  chapter: ChapterData;
  onAccept: () => void;
  onBack?: () => void;
}

export const NarrativeBriefing: React.FC<NarrativeBriefingProps> = ({
  chapter,
  onAccept,
  onBack,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const debt = useCampaignStore((s) => s.debt);

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const currentDialogue = chapter.briefingDialogue[dialogueIndex] || chapter.briefingDialogue[0];

  const speakerConfig =
    currentDialogue.speaker === 'glitch'
      ? getBrokerCharacter()
      : getMentorCharacter();

  const [displayedText, setDisplayedText] = useState(
    prefersReducedMotion ? currentDialogue.text : ''
  );
  const [isTypingComplete, setIsTypingComplete] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(currentDialogue.text);
      setIsTypingComplete(true);
      return;
    }

    setDisplayedText('');
    setIsTypingComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      index++;
      setDisplayedText(currentDialogue.text.slice(0, index));
      if (index >= currentDialogue.text.length) {
        setIsTypingComplete(true);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [currentDialogue.text, prefersReducedMotion]);

  const handleSkipOrNext = () => {
    if (!isTypingComplete) {
      // Complete current line
      setDisplayedText(currentDialogue.text);
      setIsTypingComplete(true);
    } else if (dialogueIndex < chapter.briefingDialogue.length - 1) {
      // Advance to next line
      setDialogueIndex((prev) => prev + 1);
    }
  };

  const handleAdvanceLine = () => {
    if (dialogueIndex < chapter.briefingDialogue.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    }
  };

  const debtPercent = Math.round((debt.paid / debt.initial) * 100);

  return (
    <div
      data-testid="narrative-briefing-screen"
      className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-panel-light text-ink overflow-y-auto"
    >
      {/* Top Bar: Chapter number & Back button */}
      <div className="flex items-center justify-between border-b border-line pb-3 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="icon"
              onClick={onBack}
              aria-label="Back to Chapter Select"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Button>
          )}
          <div>
            <div className="font-data text-[10px] tracking-widest text-ink-muted uppercase">
              ASSIGNMENT 0{chapter.number} // PROTOCOL BRIEFING
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-ink leading-tight">
              {chapter.title}
            </h1>
          </div>
        </div>

        <div className="text-right">
          <span className="font-data text-[11px] font-bold px-2.5 py-1 rounded-sm bg-panel border border-line text-ink-muted">
            TIER {chapter.rules.digits === 3 ? '1' : chapter.rules.digits === 4 ? '2' : '3'} NODE
          </span>
        </div>
      </div>

      {/* Debt Balance Progress Bar (Style Guide & Item 2) */}
      <div className="mt-3 p-3 bg-panel rounded-md border border-line shrink-0" data-testid="debt-progress-box">
        <div className="flex justify-between items-center text-xs font-data mb-1.5">
          <span className="text-ink-muted uppercase tracking-wider font-semibold">
            LOAN SHARK DEBT // {chapter.contract.creditor}
          </span>
          <span className="font-bold text-danger-text">
            ${debt.current.toLocaleString()} REMAINING
          </span>
        </div>
        <div className="w-full h-3 bg-heat-track rounded-pill overflow-hidden relative">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${debtPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            aria-valuenow={debtPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
        <div className="flex justify-between items-center mt-1 text-[10px] font-data text-ink-muted">
          <span>{debtPercent}% REPAID (${debt.paid.toLocaleString()} CLEARED)</span>
          <span className="text-accent-text font-semibold">
            THIS CONTRACT: -${chapter.contract.debtReduction.toLocaleString()} DEBT
          </span>
        </div>
      </div>

      {/* Character Dialogue Section with Large Portrait & Typewriter */}
      <div className="my-4 flex flex-col md:flex-row gap-4 items-center shrink-0">
        {/* Large Portrait (1:1 aspect ratio, min 120px) */}
        <div className="relative shrink-0" data-testid="briefing-portrait">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-md bg-panel-dark border border-line overflow-hidden shadow-card flex items-center justify-center relative">
            {speakerConfig.id === 'glitch' ? (
              // Cybernetic Glitch portrait SVG
              <svg viewBox="0 0 100 100" className="w-full h-full text-money" fill="none">
                <rect width="100" height="100" fill="var(--surface-dark)" />
                <path d="M15 95 Q50 60 85 95" fill="var(--surface-panel)" stroke="var(--line)" strokeWidth="2" />
                <circle cx="50" cy="45" r="22" fill="var(--surface-panel-light)" stroke="var(--line)" strokeWidth="2" />
                <rect x="34" y="38" width="32" height="10" rx="3" fill="var(--money)" fillOpacity="0.85" />
                <line x1="36" y1="43" x2="64" y2="43" stroke="var(--on-accent)" strokeWidth="1.5" />
                <path d="M26 40 L28 50 L34 52" stroke="var(--money-text)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="26" cy="40" r="3" fill="var(--money-text)" />
              </svg>
            ) : (
              // Cybernetic Nix portrait SVG
              <svg viewBox="0 0 100 100" className="w-full h-full text-accent" fill="none">
                <rect width="100" height="100" fill="var(--surface-dark)" />
                <path d="M15 95 Q50 60 85 95" fill="var(--surface-panel)" stroke="var(--line)" strokeWidth="2" />
                <circle cx="50" cy="45" r="22" fill="var(--surface-panel-light)" stroke="var(--line)" strokeWidth="2" />
                <circle cx="43" cy="42" r="3.5" fill="var(--accent)" />
                <circle cx="57" cy="42" r="3.5" fill="var(--accent)" />
                <rect x="38" y="52" width="24" height="3" rx="1.5" fill="var(--accent)" fillOpacity="0.6" />
                <path d="M72 40 L70 50 L64 52" stroke="var(--accent-text)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="74" cy="40" r="3" fill="var(--accent-text)" />
              </svg>
            )}
          </div>
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-ink text-panel-light px-3 py-0.5 rounded-pill border border-line text-center whitespace-nowrap">
            <span className="font-heading text-xs font-bold tracking-wider uppercase">
              {speakerConfig.name}
            </span>
          </div>
        </div>

        {/* Dialogue Card (Typewriter, Skippable) */}
        <div
          onClick={handleSkipOrNext}
          className="flex-1 w-full bg-panel p-4 rounded-md border border-line shadow-card cursor-pointer hover:border-ink-muted/50 transition-colors"
          data-testid="typewriter-dialogue-box"
        >
          <div className="flex justify-between items-center mb-1 text-[11px] font-data">
            <span className="text-ink-muted font-bold tracking-wider uppercase">
              {speakerConfig.title}
            </span>
            <span className="text-ink-muted">
              {dialogueIndex + 1} / {chapter.briefingDialogue.length}
            </span>
          </div>
          <p className="font-data text-sm leading-relaxed min-h-[58px] text-ink">
            {displayedText}
            {!isTypingComplete && (
              <span className="inline-block w-2 h-4 bg-accent ml-1 animate-pulse align-middle" />
            )}
          </p>

          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-line/50">
            {!isTypingComplete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkipOrNext();
                }}
                className="font-data text-[11px] font-semibold text-ink-muted hover:text-ink bg-panel-light px-2.5 py-1 rounded-[6px] border border-line/60 shadow-sm transition-colors cursor-pointer"
              >
                [CLICK TO REVEAL LINE]
              </button>
            ) : dialogueIndex < chapter.briefingDialogue.length - 1 ? (
              <Button
                variant="secondary"
                compact
                arrow
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdvanceLine();
                }}
              >
                NEXT LINE
              </Button>
            ) : (
              <span className="font-data text-[11px] text-accent-text font-bold flex items-center gap-1.5 bg-panel-light px-2.5 py-1 rounded-[6px] border border-line/60">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                [BRIEFING CONCLUDED]
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contract Terms Section (Specs & Loan Shark Stipulations) */}
      <div className="bg-panel p-4 rounded-md border border-line space-y-3 shrink-0" data-testid="contract-terms">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-data text-xs font-bold uppercase tracking-wider text-ink">
              CONTRACT TARGET // {chapter.target}
            </span>
          </div>
          <span className="font-data text-xs text-ink-muted">
            LOC: {chapter.mapLocation}
          </span>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-panel-light p-2 rounded-sm border border-line/60 flex flex-col items-center">
            <span className="text-[10px] font-bold text-ink-muted tracking-wider">DIGITS</span>
            <span className="font-heading text-lg font-bold">{chapter.rules.digits}</span>
            <span className="text-[9px] text-ink-muted uppercase">
              {chapter.rules.allowDuplicates ? 'Repeats' : 'Unique'}
            </span>
          </div>
          <div className="bg-panel-light p-2 rounded-sm border border-line/60 flex flex-col items-center">
            <span className="text-[10px] font-bold text-ink-muted tracking-wider">ATTEMPTS</span>
            <span className="font-heading text-lg font-bold">
              {chapter.rules.unlimitedTries ? '∞' : chapter.rules.attempts}
            </span>
            <span className="text-[9px] text-ink-muted uppercase">Max tries</span>
          </div>
          <div className="bg-panel-light p-2 rounded-sm border border-line/60 flex flex-col items-center">
            <span className="text-[10px] font-bold text-ink-muted tracking-wider">TRACE CLOCK</span>
            <span className="font-heading text-lg font-bold">
              {chapter.rules.timerSeconds > 0 ? `${chapter.rules.timerSeconds}s` : 'NONE'}
            </span>
            <span className="text-[9px] text-ink-muted uppercase">Lockout</span>
          </div>
          <div className="bg-panel-light p-2 rounded-sm border border-line/60 flex flex-col items-center">
            <span className="text-[10px] font-bold text-ink-muted tracking-wider">PAYOUT</span>
            <span className="font-heading text-lg font-bold text-money-text">
              ${chapter.contract.bounty}
            </span>
            <span className="text-[9px] text-money-text uppercase">Bounty</span>
          </div>
        </div>

        {/* Contract terms list */}
        <div className="space-y-1.5 pt-1">
          <span className="font-data text-[10px] uppercase font-bold text-ink-muted tracking-wider">
            MANDATORY PROTOCOL CLAUSES:
          </span>
          <ul className="space-y-1 text-xs font-data text-ink-muted">
            {chapter.contract.terms.map((term, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-accent font-bold">▪</span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Primary Action Button: ACCEPT ASSIGNMENT */}
      <div className="mt-4 shrink-0">
        <Button
          variant="primary"
          arrow
          fullWidth
          onClick={onAccept}
          data-testid="accept-assignment-button"
        >
          ACCEPT ASSIGNMENT
        </Button>
      </div>
    </div>
  );
};
