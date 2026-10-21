'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface GuessEntryProps {
  digits: number;
  entry: number[];
  validationError: string | null;
  shakeKey: number;
  hint?: string | null;
  revealedSlots?: Array<{ slotIndex: number; digit: string }>;
}

export function GuessEntry({
  digits,
  entry,
  validationError,
  shakeKey,
  hint,
  revealedSlots,
}: GuessEntryProps) {
  const shouldReduceMotion = useReducedMotion();

  // 3-cycle 4px shake: [-4, 4, -4, 4, -2, 2, 0]
  const shakeVariants = {
    shake: {
      x: [-4, 4, -4, 4, -2, 2, 0],
      transition: { duration: 0.28 },
    },
    still: { x: 0 },
  };

  return (
    <div className="w-full flex flex-col items-center gap-1 py-1 px-3 shrink-0">
      <motion.div
        key={shakeKey}
        variants={shakeVariants}
        animate={shakeKey > 0 && !shouldReduceMotion ? 'shake' : 'still'}
        className="flex items-center justify-center gap-1.5"
        role="group"
        aria-label={`Digit entry, ${entry.length} of ${digits} digits filled`}
      >
        {Array.from({ length: digits }).map((_, i) => {
          const isFilled = i < entry.length;
          const isActive = i === entry.length;
          const digit = isFilled ? entry[i] : null;
          const revealed = revealedSlots?.find((r) => r.slotIndex === i);

          return (
            <div
              key={i}
              data-testid={`digit-slot-${i}`}
              className={`w-[34px] h-[38px] sm:w-[40px] sm:h-[44px] rounded-[6px] border flex flex-col items-center justify-center relative bg-terminal-panel transition-colors ${
                isActive
                  ? 'border-terminal-phosphor shadow-[0_0_8px_rgba(111,191,122,0.2)]'
                  : revealed
                  ? 'border-terminal-phosphor/80 bg-terminal-phosphor/10 shadow-[0_0_6px_rgba(111,191,122,0.15)]'
                  : isFilled
                  ? 'border-terminal-line/80'
                  : 'border-terminal-line/50'
              }`}
            >
              {digit !== null ? (
                <span className="font-data text-xl sm:text-2xl font-bold text-terminal-ink select-none">
                  {digit}
                </span>
              ) : revealed ? (
                <span
                  data-testid={`revealed-slot-${i}`}
                  className="font-data text-xl sm:text-2xl font-bold text-terminal-phosphor/75 select-none animate-pulse"
                >
                  {revealed.digit}
                </span>
              ) : (
                <span className="font-data text-xl sm:text-2xl font-bold text-terminal-ink select-none" />
              )}

              {/* Cursor underline for active slot */}
              {isActive && (
                <div
                  className={`absolute bottom-2 w-5 h-[2px] bg-terminal-phosphor ${
                    shouldReduceMotion ? '' : 'animate-pulse'
                  }`}
                />
              )}

              {/* Unmasked Peek Badge */}
              {revealed && (
                <div
                  data-testid={`slot-unmasked-badge-${i}`}
                  className="absolute -top-1.5 -right-1 px-1 rounded-[3px] bg-terminal-phosphor text-terminal-bg text-[8px] font-bold font-data uppercase tracking-tighter"
                >
                  PEEK
                </div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Validation status / reason text or tactical hint */}
      <div className="h-4 flex items-center justify-center">
        {validationError ? (
          <span
            role="alert"
            className="font-data text-xs text-terminal-danger font-medium tracking-wide animate-fadeIn"
          >
            {validationError}
          </span>
        ) : hint && entry.length === 0 ? (
          <span className="font-data text-[11px] text-terminal-amber font-semibold tracking-wide animate-fadeIn">
            {hint}
          </span>
        ) : (
          <span className="font-data text-[11px] text-terminal-muted/60 tracking-wider">
            {entry.length === digits
              ? 'Ready to submit'
              : `Enter ${digits - entry.length} more digit${
                  digits - entry.length === 1 ? '' : 's'
                }`}
          </span>
        )}
      </div>
    </div>
  );
}
