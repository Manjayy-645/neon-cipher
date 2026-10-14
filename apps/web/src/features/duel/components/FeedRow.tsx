'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FeedEvent } from '../duelFeed';
import { ClueMarks } from '@/features/terminal/components';

interface FeedRowProps {
  event: FeedEvent;
  length: number;
  isNew?: boolean;
}

export function FeedRow({ event, length, isNew = false }: FeedRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const [flashing, setFlashing] = useState(isNew && event.who === 'rival');

  useEffect(() => {
    if (flashing) {
      const timer = setTimeout(() => setFlashing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [flashing]);

  const isYou = event.who === 'you';
  const totalSeconds = Math.floor(event.t / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `+${minutes}:${String(seconds).padStart(2, '0')}`;

  const guessStr = event.guess ? event.guess.join(' ') : '';
  const pots = event.pots ?? 0;
  const pans = event.pans ?? 0;
  const misses = length - pots - pans;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : w.endsWith('ss') ? 'es' : 's'}`;

  const ariaLabel = isYou
    ? `You guessed ${guessStr}. ${plural(pans, 'pan')}, ${plural(pots, 'pot')}, ${plural(misses, 'miss')}.`
    : `Rival guessed ${guessStr}: ${plural(pans, 'pan')}, ${plural(pots, 'pot')}, ${plural(misses, 'miss')}.`;

  const summaryText =
    pans === 0 && pots === 0
      ? 'NO MATCH'
      : `${pans > 0 ? `${pans} PAN` : ''}${pans > 0 && pots > 0 ? ' ' : ''}${
          pots > 0 ? `${pots} POT` : ''
        }`;

  return (
    <motion.div
      initial={isNew && !shouldReduceMotion ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="listitem"
      aria-label={ariaLabel}
      className={`h-[56px] min-h-[56px] px-3 rounded-[6px] border flex items-center justify-between gap-3 bg-terminal-panel/60 relative overflow-hidden transition-colors ${
        flashing
          ? 'border-terminal-amber shadow-[0_0_14px_rgba(224,174,92,0.4)]'
          : 'border-terminal-line/60'
      }`}
    >
      {/* Left band: solid for you, hatched for rival */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isYou ? 'bg-terminal-phosphor' : ''
        }`}
        style={
          isYou
            ? undefined
            : {
                backgroundImage:
                  'repeating-linear-gradient(45deg, var(--terminal-amber), var(--terminal-amber) 2px, transparent 2px, transparent 4px)',
              }
        }
      />

      {/* Tag & Time */}
      <div className="flex items-center gap-1.5 pl-2 shrink-0">
        <span
          className={`font-data text-[10px] font-bold px-1 rounded-[3px] uppercase ${
            isYou
              ? 'text-terminal-phosphor bg-terminal-phosphor/15 border border-terminal-phosphor/30'
              : 'text-terminal-amber bg-terminal-amber/15 border border-terminal-amber/30'
          }`}
        >
          {isYou ? 'YOU' : 'RIVAL'}
        </span>
        <span className="font-data text-xs text-terminal-muted">{timeFormatted}</span>
      </div>

      {/* Digit Tiles */}
      <div className="flex items-center gap-1.5 shrink-0">
        {event.guess?.map((digit, i) => (
          <div
            key={i}
            className="w-[36px] h-[44px] rounded-[6px] border border-terminal-line bg-terminal-panel flex items-center justify-center font-data text-lg font-bold text-terminal-ink select-none"
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Clue Marks */}
      <div className="shrink-0">
        <ClueMarks pans={pans} pots={pots} length={length} animated={false} />
      </div>

      {/* Summary Text & NEW Chip */}
      <div className="flex items-center gap-2 shrink-0 min-w-[70px] justify-end">
        <span
          className={`font-data text-xs font-semibold uppercase tracking-wider ${
            pans === 0 && pots === 0
              ? 'text-terminal-muted'
              : pans > 0
              ? 'text-terminal-phosphor'
              : 'text-terminal-amber'
          }`}
        >
          {summaryText}
        </span>
        {isNew && !isYou && (
          <span className="font-data text-[9px] font-bold tracking-wider px-1 py-0.2 rounded bg-terminal-amber text-terminal-bg">
            NEW
          </span>
        )}
      </div>
    </motion.div>
  );
}
