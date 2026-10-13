'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { clueMarks, Clue } from '@neon-cipher/game-rules';

interface ClueMarksProps {
  pots: number;
  pans: number;
  length: number;
  animated?: boolean;
}

export function ClueMarks({ pots, pans, length, animated = false }: ClueMarksProps) {
  const marks = clueMarks(pots, pans, length);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-[6px]" aria-hidden="true">
      {marks.map((mark, index) => {
        const renderMarkShape = () => {
          switch (mark) {
            case 'pot':
              // Pot: filled circle (phosphor)
              return (
                <div
                  data-clue="pot"
                  className="w-[14px] h-[14px] rounded-full bg-terminal-phosphor shadow-[0_0_8px_rgba(111,191,122,0.25)]"
                />
              );
            case 'pan':
              // Pan: ring, 2px stroke (amber)
              return (
                <div
                  data-clue="pan"
                  className="w-[14px] h-[14px] rounded-full border-2 border-terminal-amber bg-transparent"
                />
              );
            case 'miss':
            default:
              // Miss: short dash (muted)
              return (
                <div
                  data-clue="miss"
                  className="w-[14px] h-[14px] flex items-center justify-center"
                >
                  <div className="w-[10px] h-[2px] bg-terminal-muted rounded-full" />
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
