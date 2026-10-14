'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GuessRecord, describeGuess } from '@neon-cipher/game-rules';
import { GuessRow } from './GuessRow';

interface HistoryListProps {
  history: GuessRecord[];
  length: number;
}

export function HistoryList({ history, length }: HistoryListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState('');

  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

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
      const latest = history[history.length - 1];
      setLatestAnnouncement(describeGuess(latest, length, history.length));
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
        <div className="px-5 pt-1.5 pb-1 flex items-center justify-between text-[10px] font-data text-terminal-muted/60 uppercase tracking-widest shrink-0 border-b border-terminal-line/30 bg-terminal-panel/20 select-none">
          <span className="w-20">Attempt</span>
          <span className="text-center flex-1">Clues (Unordered)</span>
          <span className="w-20 text-right">Result</span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 scroll-smooth"
        role="list"
        aria-label="Guess history"
      >
        {history.length === 0 ? (
          <div className="m-auto text-center py-8">
            <span className="font-data text-xs text-terminal-muted/60 uppercase tracking-widest block">
              Awaiting Initial Breach Attempt
            </span>
            <span className="font-data text-[11px] text-terminal-muted/40 mt-1 block">
              Enter {length} digits below to probe system response
            </span>
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
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-terminal-panel border border-terminal-phosphor/80 text-terminal-phosphor font-data text-xs font-semibold shadow-card flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
          aria-label="Jump to latest guess"
        >
          <span>↓</span>
          <span>JUMP TO LATEST</span>
        </button>
      )}
    </div>
  );
}
