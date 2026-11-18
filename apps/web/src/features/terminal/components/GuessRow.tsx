'use client';

import React from 'react';
import styles from '../TerminalWorkspace.module.css';
import { motion, useReducedMotion } from 'framer-motion';
import { GuessRecord, describeGuess } from '@neon-cipher/game-rules';
import { ClueMarks } from './ClueMarks';

interface GuessRowProps {
  record: GuessRecord;
  length: number;
  index: number;
  isLatest?: boolean;
}

export function GuessRow({ record, length, index, isLatest = false }: GuessRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const isBreached = record.pans === length;

  const attemptNumberFormatted = `#${String(index).padStart(2, '0')}`;
  const ariaLabel = describeGuess(record, length, index);

  const summaryText =
    record.pans === 0 && record.pots === 0
      ? 'NO MATCH'
      : `${record.pans > 0 ? `${record.pans} PAN` : ''}${
          record.pans > 0 && record.pots > 0 ? ' ' : ''
        }${record.pots > 0 ? `${record.pots} POT` : ''}`;

  return (
    <div
      role="listitem"
      aria-label={ariaLabel}
      className={`${styles.guessRow} min-h-[38px] sm:min-h-[42px] py-1 px-2 sm:px-3 rounded-[6px] border flex items-center justify-between gap-1 sm:gap-2 transition-colors ${
        isBreached
          ? 'border-terminal-phosphor bg-terminal-phosphor/10 shadow-[0_0_12px_rgba(111,191,122,0.25)]'
          : isLatest
          ? 'border-terminal-phosphor/60 bg-terminal-panel shadow-xs border-l-[3px] border-l-terminal-phosphor'
          : 'border-terminal-line/60 bg-terminal-panel/60'
      }`}
    >
      {/* Left: Attempt Number */}
      <span className="font-data text-[11px] sm:text-xs font-semibold text-terminal-muted w-6 sm:w-7 shrink-0 font-mono">
        {attemptNumberFormatted}
      </span>

      {/* Digit Tiles */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {record.guess.map((digit, i) => (
          <div
            key={i}
            className={`w-[26px] h-[30px] sm:w-[30px] sm:h-[34px] rounded-[5px] border flex items-center justify-center font-data text-sm sm:text-base font-bold select-none ${
              isBreached
                ? 'border-terminal-phosphor bg-terminal-panel text-terminal-phosphor'
                : isLatest
                ? 'border-terminal-line/90 bg-terminal-bg text-terminal-ink'
                : 'border-terminal-line/60 bg-terminal-bg/80 text-terminal-ink'
            }`}
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Clue Marks */}
      <div className="shrink-0 flex items-center justify-center px-0.5 sm:px-1" data-tour={isLatest ? 'clue-marks-latest' : undefined}>
        <ClueMarks
          pans={record.pans}
          pots={record.pots}
          length={length}
          animated={isLatest}
        />
      </div>

      {/* Right: Text Summary */}
      <div className="min-w-[62px] sm:min-w-[76px] text-right shrink-0">
        {isLatest && !shouldReduceMotion ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: length * 0.09 + 0.1, duration: 0.2 }}
            className={`font-data text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
              record.pans === 0 && record.pots === 0
                ? 'text-terminal-muted/80'
                : record.pans > 0
                ? 'text-terminal-phosphor'
                : 'text-terminal-amber'
            }`}
          >
            {summaryText}
          </motion.span>
        ) : (
          <span
            className={`font-data text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
              record.pans === 0 && record.pots === 0
                ? 'text-terminal-muted/80'
                : record.pans > 0
                ? 'text-terminal-phosphor'
                : 'text-terminal-amber'
            }`}
          >
            {summaryText}
          </span>
        )}
      </div>
    </div>
  );
}
