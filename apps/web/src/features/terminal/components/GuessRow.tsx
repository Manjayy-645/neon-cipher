'use client';

import React from 'react';
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
      className={`h-[56px] min-h-[56px] px-3 rounded-[6px] border flex items-center justify-between gap-3 bg-terminal-panel/60 transition-colors ${
        isBreached
          ? 'border-terminal-phosphor shadow-[0_0_12px_rgba(111,191,122,0.25)]'
          : 'border-terminal-line/60'
      }`}
    >
      {/* Left: Attempt Number */}
      <span className="font-data text-xs text-terminal-muted w-7 shrink-0">
        {attemptNumberFormatted}
      </span>

      {/* Digit Tiles */}
      <div className="flex items-center gap-1.5 shrink-0">
        {record.guess.map((digit, i) => (
          <div
            key={i}
            className={`w-[36px] h-[44px] rounded-[6px] border flex items-center justify-center font-data text-lg font-bold select-none ${
              isBreached
                ? 'border-terminal-phosphor bg-terminal-panel text-terminal-phosphor'
                : 'border-terminal-line bg-terminal-panel text-terminal-ink'
            }`}
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Clue Marks */}
      <div className="shrink-0" data-tour={isLatest ? 'clue-marks-latest' : undefined}>
        <ClueMarks
          pans={record.pans}
          pots={record.pots}
          length={length}
          animated={isLatest}
        />
      </div>

      {/* Right: Text Summary */}
      <div className="min-w-[80px] text-right shrink-0">
        {isLatest && !shouldReduceMotion ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: length * 0.09 + 0.1, duration: 0.2 }}
            className={`font-data text-xs font-semibold uppercase tracking-wider ${
              record.pans === 0 && record.pots === 0
                ? 'text-terminal-muted'
                : record.pans > 0
                ? 'text-terminal-phosphor'
                : 'text-terminal-amber'
            }`}
          >
            {summaryText}
          </motion.span>
        ) : (
          <span
            className={`font-data text-xs font-semibold uppercase tracking-wider ${
              record.pans === 0 && record.pots === 0
                ? 'text-terminal-muted'
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
