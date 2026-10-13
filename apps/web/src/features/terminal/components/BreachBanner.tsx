'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface BreachBannerProps {
  status: 'won' | 'lost';
  secret?: string;
  payout?: number;
  fine?: number;
  onReturnToMap: () => void;
}

export function BreachBanner({
  status,
  secret,
  payout,
  fine,
  onReturnToMap,
}: BreachBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  const isWon = status === 'won';

  return (
    <div
      role="alert"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`w-full max-w-sm p-6 rounded-[12px] border bg-terminal-panel shadow-sheet flex flex-col items-center text-center gap-4 ${
          isWon
            ? 'border-terminal-phosphor shadow-[0_0_24px_rgba(111,191,122,0.2)]'
            : 'border-terminal-danger shadow-[0_0_24px_rgba(208,118,90,0.2)]'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full border flex items-center justify-center ${
            isWon
              ? 'border-terminal-phosphor text-terminal-phosphor bg-terminal-phosphor/10'
              : 'border-terminal-danger text-terminal-danger bg-terminal-danger/10'
          }`}
        >
          {isWon ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        <div>
          <h2
            className={`font-heading text-2xl font-bold tracking-wider ${
              isWon ? 'text-terminal-phosphor' : 'text-terminal-danger'
            }`}
          >
            {isWon ? 'BREACHED' : 'CONNECTION SEVERED'}
          </h2>
          <p className="font-data text-xs text-terminal-muted mt-1">
            {isWon
              ? 'Node defense bypassed. Cipher cracked successfully.'
              : 'Maximum trace threshold reached. Trace lock engaged.'}
          </p>
        </div>

        {/* Revealed secret if lost */}
        {!isWon && secret && (
          <div className="w-full p-3 rounded-[6px] bg-terminal-bg border border-terminal-line/40 font-data">
            <span className="text-[11px] text-terminal-muted uppercase tracking-wider block">
              TARGET CIPHER CODE
            </span>
            <span className="text-xl font-bold text-terminal-ink tracking-[0.25em] mt-1 block">
              {secret}
            </span>
          </div>
        )}

        {/* Payout or fine */}
        {isWon && payout !== undefined && (
          <div className="w-full p-2.5 rounded-[6px] bg-terminal-bg border border-terminal-phosphor/30 font-data text-xs">
            <span className="text-terminal-muted">PAYOUT CREDITED: </span>
            <span className="text-terminal-phosphor font-bold">+${payout}</span>
          </div>
        )}
        {!isWon && fine !== undefined && (
          <div className="w-full p-2.5 rounded-[6px] bg-terminal-bg border border-terminal-danger/30 font-data text-xs">
            <span className="text-terminal-muted">TRACE PENALTY: </span>
            <span className="text-terminal-danger font-bold">-${fine}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onReturnToMap}
          className="w-full h-12 min-h-[44px] rounded-[8px] bg-terminal-phosphor text-terminal-bg font-data text-xs font-bold tracking-wider uppercase transition-transform active:scale-[0.97] hover:brightness-105 flex items-center justify-center shadow-card"
        >
          RETURN TO MAP
        </button>
      </motion.div>
    </div>
  );
}
