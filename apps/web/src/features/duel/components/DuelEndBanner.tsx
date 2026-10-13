'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface DuelEndBannerProps {
  status: 'won' | 'lost';
  secret?: string;
  onReturnToLobby: () => void;
}

export function DuelEndBanner({
  status,
  secret,
  onReturnToLobby,
}: DuelEndBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  const isWon = status === 'won';

  return (
    <div
      role="alert"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`w-full max-w-sm p-6 rounded-[12px] border bg-terminal-panel shadow-sheet flex flex-col items-center text-center gap-4 ${
          isWon
            ? 'border-terminal-phosphor shadow-[0_0_24px_rgba(111,191,122,0.25)]'
            : 'border-terminal-danger shadow-[0_0_24px_rgba(208,118,90,0.25)]'
        }`}
      >
        <div
          className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
            isWon
              ? 'border-terminal-phosphor text-terminal-phosphor bg-terminal-phosphor/10 shadow-[0_0_16px_rgba(111,191,122,0.3)]'
              : 'border-terminal-danger text-terminal-danger bg-terminal-danger/10 shadow-[0_0_16px_rgba(208,118,90,0.3)]'
          }`}
        >
          {isWon ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            {isWon ? 'YOU WIN' : 'RIVAL BREACHED FIRST'}
          </h2>
          <p className="font-data text-xs text-terminal-muted mt-1 leading-relaxed">
            {isWon
              ? 'You cracked the shared cipher before your syndicate rival.'
              : 'The rival decker completed the decryption first. Connection closed.'}
          </p>
        </div>

        {secret && (
          <div className="w-full p-3 rounded-[6px] bg-terminal-bg border border-terminal-line/50 font-data">
            <span className="text-[11px] text-terminal-muted uppercase tracking-wider block">
              SHARED CIPHER SECRET
            </span>
            <span className="text-2xl font-bold text-terminal-ink tracking-[0.25em] mt-1 block">
              {secret}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onReturnToLobby}
          className="w-full h-12 min-h-[44px] rounded-[8px] bg-terminal-phosphor text-terminal-bg font-data text-xs font-bold tracking-wider uppercase transition-transform active:scale-[0.97] hover:brightness-105 flex items-center justify-center shadow-card"
        >
          RETURN TO LOBBY
        </button>
      </motion.div>
    </div>
  );
}
