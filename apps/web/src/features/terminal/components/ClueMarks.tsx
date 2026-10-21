'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { clueMarks } from '@neon-cipher/game-rules';

interface ClueMarksProps {
  pans: number;
  pots: number;
  length: number;
  animated?: boolean;
}

export function ClueMarks({ pans, pots, length, animated = false }: ClueMarksProps) {
  const marks = clueMarks(pans, pots, length);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-1 sm:gap-1.5" aria-hidden="true">
      {marks.map((mark, index) => {
        const renderMarkShape = () => {
          switch (mark) {
            case 'pan':
              // Pan: filled circle (phosphor) - right digit, right spot!
              return (
                <div
                  data-clue="pan"
                  title="Pan: correct digit & spot"
                  className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px] rounded-full bg-terminal-phosphor shadow-[0_0_8px_rgba(111,191,122,0.4)] shrink-0"
                />
              );
            case 'pot':
              // Pot: ring, 2px stroke (amber) - right digit, wrong spot!
              return (
                <div
                  data-clue="pot"
                  title="Pot: correct digit, wrong spot"
                  className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px] rounded-full border-2 border-terminal-amber bg-terminal-amber/20 shrink-0"
                />
              );
            case 'miss':
            default:
              // Miss: short dash (muted)
              return (
                <div
                  data-clue="miss"
                  title="Miss: not in cipher"
                  className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px] flex items-center justify-center shrink-0"
                >
                  <div className="w-[10px] h-[2.5px] bg-terminal-muted/80 rounded-full" />
                </div>
              );
          }
        };

        if (animated && !shouldReduceMotion) {
          return (
            <motion.div
              key={index}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: index * 0.09,
                duration: 0.15,
                ease: 'easeOut',
              }}
            >
              {renderMarkShape()}
            </motion.div>
          );
        }

        return <div key={index}>{renderMarkShape()}</div>;
      })}
    </div>
  );
}
