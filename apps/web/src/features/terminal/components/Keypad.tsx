'use client';

import React, { useEffect, useState, useRef } from 'react';

interface KeypadProps {
  onDigit: (digit: number) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onClear: () => void;
  isSubmitDisabled: boolean;
  deadDigits: Set<number>;
  usedDigitsInEntry: number[];
  allowDuplicates: boolean;
  assistMode: 'rookie' | 'pro';
  onIllegalAttempt?: (reason: string) => void;
}

export function Keypad({
  onDigit,
  onBackspace,
  onSubmit,
  onClear,
  isSubmitDisabled,
  deadDigits,
  usedDigitsInEntry,
  allowDuplicates,
  assistMode,
  onIllegalAttempt,
}: KeypadProps) {
  const [hasSeenNixElimination, setHasSeenNixElimination] = useState(false);
  const [showNixBubble, setShowNixBubble] = useState(false);

  // Monitor first dead digit elimination for Rookie Assist
  useEffect(() => {
    if (assistMode === 'rookie' && deadDigits.size > 0 && !hasSeenNixElimination) {
      setHasSeenNixElimination(true);
      setShowNixBubble(true);
      const timer = setTimeout(() => {
        setShowNixBubble(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [assistMode, deadDigits.size, hasSeenNixElimination]);

  // Global keyboard shortcuts (digits, Backspace, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        const digit = parseInt(e.key, 10);
        if (deadDigits.has(digit)) {
          onIllegalAttempt?.('Digit eliminated — not in code');
          return;
        }
        if (!allowDuplicates && usedDigitsInEntry.includes(digit)) {
          onIllegalAttempt?.('No repeats on this tier');
          return;
        }
        onDigit(digit);
      } else if (e.key === 'Backspace') {
        onBackspace();
      } else if (e.key === 'Enter') {
        if (!isSubmitDisabled) {
          onSubmit();
        } else {
          onIllegalAttempt?.('Incomplete guess');
        }
      } else if (e.key === 'Escape') {
        onClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onDigit,
    onBackspace,
    onSubmit,
    onClear,
    isSubmitDisabled,
    allowDuplicates,
    usedDigitsInEntry,
    deadDigits,
    onIllegalAttempt,
  ]);

  const keys = [
    { label: '1', value: 1, type: 'digit' },
    { label: '2', value: 2, type: 'digit' },
    { label: '3', value: 3, type: 'digit' },
    { label: '4', value: 4, type: 'digit' },
    { label: '5', value: 5, type: 'digit' },
    { label: '6', value: 6, type: 'digit' },
    { label: '7', value: 7, type: 'digit' },
    { label: '8', value: 8, type: 'digit' },
    { label: '9', value: 9, type: 'digit' },
    { label: '⌫', value: 'backspace', type: 'backspace' },
    { label: '0', value: 0, type: 'digit' },
    { label: 'SUBMIT', value: 'submit', type: 'submit' },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-2 pb-4 px-4 shrink-0">
      {/* Rookie assist one-time Nix advice */}
      {showNixBubble && (
        <div
          role="status"
          aria-live="polite"
          className="w-full max-w-[360px] p-2.5 rounded-[8px] bg-terminal-panel border border-terminal-amber/50 text-terminal-amber font-data text-xs flex items-center justify-between gap-2 shadow-card"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-terminal-amber/60 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Character portraits/Nix.png" alt="Nix" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-bold text-terminal-ink">NIX: </span>
              <span>Dead number. I grayed that key out so you do not touch it again.</span>
            </div>
          </div>
          <button
            onClick={() => setShowNixBubble(false)}
            aria-label="Dismiss message"
            className="text-terminal-muted hover:text-terminal-ink text-sm p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3x4 Keypad Grid */}
      <div
        className="grid grid-cols-3 gap-2 w-full max-w-[360px]"
        role="group"
        aria-label="Terminal Keypad"
        data-tutorial="keypad"
        data-tour="keypad"
      >
        {keys.map((k) => {
          if (k.type === 'digit') {
            const digit = k.value as number;
            const isDead = deadDigits.has(digit);
            const isUsedInEntry = !allowDuplicates && usedDigitsInEntry.includes(digit);
            const isDisabled = isUsedInEntry || isDead;

            return (
              <button
                key={k.label}
                type="button"
                data-tour={isDead ? `key-${digit} dead-key` : `key-${digit}`}
                aria-label={
                  isDead
                    ? `${digit}, eliminated`
                    : isUsedInEntry
                    ? `${digit}, already used`
                    : `${digit}`
                }
                disabled={isDisabled}
                onClick={() => {
                  if (isDead) {
                    onIllegalAttempt?.('Digit eliminated — not in code');
                    return;
                  }
                  if (isUsedInEntry) {
                    onIllegalAttempt?.('No repeats on this tier');
                    return;
                  }
                  onDigit(digit);
                }}
                className={`relative h-[56px] keypad-btn-height min-h-[44px] min-w-[44px] rounded-[8px] border font-data text-xl font-bold transition-transform duration-120 flex items-center justify-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg ${
                  isDisabled
                    ? isDead
                      ? 'border-terminal-line/20 bg-terminal-panel/20 text-terminal-muted/30 line-through cursor-not-allowed opacity-40'
                      : 'border-terminal-line/30 bg-terminal-panel/20 text-terminal-muted/40 cursor-not-allowed'
                    : 'border-terminal-line bg-terminal-panel text-terminal-ink hover:border-terminal-phosphor/60 active:scale-[0.96]'
                }`}
              >
                <span>{k.label}</span>

                {/* Diagonal slash for dead key */}
                {isDead && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none stroke-terminal-danger/70"
                    viewBox="0 0 56 56"
                    preserveAspectRatio="none"
                  >
                    <line x1="10" y1="46" x2="46" y2="10" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            );
          }

          if (k.type === 'backspace') {
            return (
              <button
                key={k.label}
                type="button"
                aria-label="Backspace"
                onClick={onBackspace}
                className="h-[56px] keypad-btn-height min-h-[44px] min-w-[44px] rounded-[8px] border border-terminal-line bg-terminal-panel text-terminal-muted hover:text-terminal-ink font-data text-lg font-bold transition-transform duration-120 active:scale-[0.96] flex items-center justify-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
              >
                ⌫
              </button>
            );
          }

          if (k.type === 'submit') {
            return (
              <button
                key={k.label}
                type="button"
                id="submit-guess-button"
                aria-label="Submit Guess"
                data-tutorial="submit"
                disabled={isSubmitDisabled}
                onClick={onSubmit}
                className={`h-[56px] keypad-btn-height min-h-[44px] min-w-[44px] rounded-[8px] border font-data text-sm font-bold tracking-wider uppercase transition-transform duration-120 active:scale-[0.96] flex items-center justify-center select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-phosphor focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg ${
                  isSubmitDisabled
                    ? 'border-terminal-line/30 bg-terminal-panel/30 text-terminal-muted/40 cursor-not-allowed'
                    : 'border-terminal-phosphor bg-terminal-phosphor text-terminal-bg shadow-[0_0_12px_rgba(111,191,122,0.3)] hover:brightness-105'
                }`}
              >
                SUBMIT
              </button>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
