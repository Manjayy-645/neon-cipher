'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FeedEvent } from '../duelFeed';
import { FeedRow } from './FeedRow';
import { HiddenGuessRow } from './HiddenGuessRow';

interface FeedListProps {
  events: FeedEvent[];
  length: number;
  filterMode?: 'shared' | 'you' | 'rival';
  title?: string;
}

export function FeedList({
  events,
  length,
  filterMode = 'shared',
  title,
}: FeedListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const prevCountRef = useRef(events.length);

  // Filter events based on tab
  const filteredEvents = events.filter((e) => {
    if (filterMode === 'you') return e.who === 'you';
    if (filterMode === 'rival') return e.who === 'rival';
    return true; // 'shared'
  });

  // Screen reader announcements for new rival guesses
  useEffect(() => {
    if (events.length > prevCountRef.current) {
      const latest = events[events.length - 1];
      if (latest.who === 'rival') {
        if (latest.hidden) {
          setLiveAnnouncement('Rival made a hidden guess.');
        } else if (latest.guess) {
          const guessStr = latest.guess.join(' ');
          const pots = latest.pots ?? 0;
          const pans = latest.pans ?? 0;
          setLiveAnnouncement(
            `Rival guessed ${guessStr}: ${pans} pan${pans === 1 ? '' : 's'}, ${pots} pot${
              pots === 1 ? '' : 's'
            }.`
          );
        }
      }
    }
    prevCountRef.current = events.length;

    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [events]);

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col justify-end overflow-hidden relative">
      {/* Polite live region for screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {title && (
        <div className="px-4 py-1.5 border-b border-terminal-line/40 bg-terminal-panel/30 text-[11px] font-data text-terminal-muted tracking-wider uppercase font-semibold">
          {title}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 scroll-smooth"
        role="list"
        aria-label={`${filterMode} duel feed`}
      >
        {filteredEvents.length === 0 ? (
          <div className="m-auto text-center py-8">
            <span className="font-data text-xs text-terminal-muted/60 uppercase tracking-widest block">
              No Guesses Recorded
            </span>
            <span className="font-data text-[11px] text-terminal-muted/40 mt-1 block">
              Cipher duel telemetry will appear here in real-time
            </span>
          </div>
        ) : (
          filteredEvents.map((e, i) => {
            const isLatest = i === filteredEvents.length - 1;
            if (e.hidden) {
              return (
                <HiddenGuessRow
                  key={e.id}
                  length={length}
                  timeOffsetMs={e.t}
                  isNew={isLatest}
                />
              );
            }
            return (
              <FeedRow
                key={e.id}
                event={e}
                length={length}
                isNew={isLatest}
              />
            );
          })
        )}
        <div ref={bottomRef} className="h-0 w-full" />
      </div>
    </div>
  );
}
