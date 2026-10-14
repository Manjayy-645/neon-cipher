'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClueLegendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClueLegendDrawer({ isOpen, onClose }: ClueLegendDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legend-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          {/* Backdrop click */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-t-[16px] sm:rounded-[12px] bg-terminal-panel border border-terminal-line p-5 shadow-sheet flex flex-col gap-4 text-terminal-ink z-10"
          >
            <div className="flex items-center justify-between border-b border-terminal-line/60 pb-3">
              <h2
                id="legend-title"
                className="font-heading text-lg text-terminal-ink font-semibold"
              >
                Clue Legend
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close clue legend"
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[6px] border border-terminal-line/40 text-terminal-muted hover:text-terminal-ink hover:border-terminal-line"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 font-data text-xs">
              {/* PAN */}
              <div className="flex items-center gap-3 p-2 rounded-[6px] bg-terminal-bg/40 border border-terminal-line/30">
                <div className="w-[18px] h-[18px] rounded-full bg-terminal-phosphor shrink-0 shadow-[0_0_8px_rgba(111,191,122,0.3)]" />
                <div>
                  <span className="font-bold text-terminal-phosphor tracking-wide">
                    PAN (CORRECT SLOT)
                  </span>
                  <p className="text-terminal-muted text-[11px] mt-0.5">
                    Right digit in the right position.
                  </p>
                </div>
              </div>

              {/* POT */}
              <div className="flex items-center gap-3 p-2 rounded-[6px] bg-terminal-bg/40 border border-terminal-line/30">
                <div className="w-[18px] h-[18px] rounded-full border-2 border-terminal-amber bg-transparent shrink-0" />
                <div>
                  <span className="font-bold text-terminal-amber tracking-wide">
                    POT (WRONG SLOT)
                  </span>
                  <p className="text-terminal-muted text-[11px] mt-0.5">
                    Right digit in the wrong position.
                  </p>
                </div>
              </div>

              {/* MISS */}
              <div className="flex items-center gap-3 p-2 rounded-[6px] bg-terminal-bg/40 border border-terminal-line/30">
                <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-[2px] bg-terminal-muted rounded-full" />
                </div>
                <div>
                  <span className="font-bold text-terminal-muted tracking-wide">
                    MISS (NOT IN CODE)
                  </span>
                  <p className="text-terminal-muted text-[11px] mt-0.5">
                    Digit does not appear in the target cipher.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-[11px] border-t border-terminal-line/40 pt-2.5 font-data">
              <span className="text-terminal-phosphor font-semibold">
                BREACH WIN CONDITION: ALL PANS (all digits in correct slots).
              </span>
              <span className="text-terminal-amber">
                Note: ALL POTS means you found all correct digits, but in the wrong slots—swap positions to win!
              </span>
              <span className="text-terminal-muted/80 italic text-[10px]">
                Marks show overall counts (Pans first, then Pots) and are not ordered by slot position.
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 min-h-[44px] rounded-[6px] border border-terminal-line bg-terminal-bg text-terminal-ink hover:border-terminal-phosphor font-data text-xs font-bold uppercase tracking-wider"
            >
              GOT IT
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
