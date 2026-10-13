'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface GuessEntryProps {
  digits: number;
  entry: number[];
  validationError: string | null;
  shakeKey: number;
}

export function GuessEntry({
  digits,
  entry,
  validationError,
  shakeKey,
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
    <div className="w-full flex flex-col items-center gap-2 py-2 px-4 shrink-0">
      <motion.div
        key={shakeKey}
        variants={shakeVariants}
        animate={shakeKey > 0 && !shouldReduceMotion ? 'shake' : 'still'}
        className="flex items-center justify-center gap-2"
        role="group"
        aria-label={`Digit entry, ${entry.length} of ${digits} digits filled`}
      >
        {Array.from({ length: digits }).map((_, i) => {
          const isFilled = i < entry.length;
          const isActive = i === entry.length;
          const digit = isFilled ? entry[i] : null;

          return (
            <div
              key={i}
              className={`w-[48px] h-[56px] rounded-[6px] border flex flex-col items-center justify-center relative bg-terminal-panel transition-colors ${
                isActive
                  ? 'border-terminal-phosphor shadow-[0_0_8px_rgba(111,191,122,0.2)]'
                  : isFilled
                  ? 'border-terminal-line/80'
                  : 'border-terminal-line/50'
              }`}
            >
              <span className="font-data text-2xl font-bold text-terminal-ink select-none">
                {digit !== null ? digit : ''}
              </span>

              {/* Cursor underline for active slot */}
              {isActive && (
                <div
                  className={`absolute bottom-2 w-5 h-[2px] bg-terminal-phosphor ${
                    shouldReduceMotion ? '' : 'animate-pulse'
                  }`}
                />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Validation status / reason text */}
      <div className="h-4 flex items-center justify-center">
        {validationError ? (
          <span
            role="alert"
            className="font-data text-xs text-terminal-danger font-medium tracking-wide animate-fadeIn"
          >
            {validationError}
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
