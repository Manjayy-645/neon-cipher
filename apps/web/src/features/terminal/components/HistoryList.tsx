'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GuessRecord, describeGuess } from '@neon-cipher/game-rules';
import { GuessRow } from './GuessRow';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

interface HistoryListProps {
  history: GuessRecord[];
  length: number;
}

export function HistoryList({ history, length }: HistoryListProps) {
  const reducedMotion = usePrefersReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const latestAnnouncement = history.length ? describeGuess(history[history.length - 1], length, history.length) : '';

  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({
        behavior: smooth && !reducedMotion ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, [reducedMotion]);

  // Check scroll position to display Jump to Latest pill
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowJumpToLatest(distanceFromBottom > 80);
  };

  // Auto-scroll when new guess is added
  useEffect(() => {
    if (history.length > 0) {
      scrollToBottom(true);
    }
  }, [history.length, length, scrollToBottom]);

  return (
    <div
      className="relative flex-1 min-h-0 w-full flex flex-col justify-end overflow-hidden"
      data-tutorial="history"
    >
      {/* Screen reader polite live region for new results */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {latestAnnouncement}
      </div>

      {history.length > 0 && (
        <div className="px-3 py-1 flex items-center justify-between text-[10px] font-data font-semibold text-terminal-muted/80 uppercase tracking-widest shrink-0 border-b border-terminal-line/40 bg-terminal-panel/30 select-none">
          <span className="w-24 flex items-center gap-1.5 text-terminal-phosphor">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-phosphor" />
            PROBE #{history.length}
          </span>
          <span className="text-center flex-1 text-terminal-muted">CLUES (PANS / POTS)</span>
          <span className="w-20 text-right text-terminal-muted">RESULT</span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-2.5 py-1.5 sm:px-3.5 sm:py-2 flex flex-col gap-1.5 scroll-smooth"
        role="list"
        aria-label="Guess history"
      >
        {history.length === 0 ? (
          <div className="m-auto w-full max-w-[340px] px-3.5 py-3 sm:py-4 rounded-[8px] border border-dashed border-terminal-line/60 bg-terminal-panel/20 text-center flex flex-col items-center gap-1.5 select-none">
            <div className="flex items-center gap-2 text-terminal-phosphor font-data text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-terminal-phosphor animate-pulse" />
              CIPHER TRACE ACTIVE
            </div>
            <p className="font-data text-xs text-terminal-ink leading-relaxed">
              Enter <span className="font-bold text-terminal-phosphor">{length} digits</span> to probe the target cipher.
            </p>
            <p className="text-[11px] text-terminal-muted leading-relaxed">Clues are total counts, not hints for the digit above each mark.</p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] font-data text-terminal-muted border-t border-terminal-line/30 w-full justify-center">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-terminal-phosphor inline-block" />
                <span className="text-terminal-ink font-semibold">PAN</span>: Exact
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-terminal-amber inline-block" />
                <span className="text-terminal-ink font-semibold">POT</span>: Wrong spot
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-[2px] bg-terminal-muted rounded-full inline-block" />
                <span className="text-terminal-ink font-semibold">MISS</span>
              </span>
            </div>
          </div>
        ) : (
          history.map((record, i) => (
            <GuessRow
              key={i}
              record={record}
              length={length}
              index={i + 1}
              isLatest={i === history.length - 1}
            />
          ))
        )}
        <div ref={bottomRef} className="h-0 w-full" />
      </div>

      {/* Jump to latest button if scrolled up */}
      {showJumpToLatest && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-terminal-panel border border-terminal-phosphor text-terminal-phosphor font-data text-[11px] font-bold shadow-card flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
          aria-label="Jump to latest guess"
        >
          <span>↓</span>
          <span>LATEST GUESS</span>
        </button>
      )}
    </div>
  );
}
