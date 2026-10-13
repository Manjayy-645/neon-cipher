'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, ToastData } from '@/stores/toast-store';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from './Button';

export interface ToastProps {
  toast?: ToastData | null;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast: propToast, onDismiss: propOnDismiss }) => {
  const storeToast = useToastStore((s) => s.toast);
  const storeHideToast = useToastStore((s) => s.hideToast);
  const prefersReducedMotion = usePrefersReducedMotion();

  const activeToast = propToast !== undefined ? propToast : storeToast;
  const handleDismiss = propOnDismiss !== undefined ? propOnDismiss : storeHideToast;

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          key={activeToast.id}
          role="status"
          aria-live="polite"
          data-testid="app-toast"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
          transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-[420px] pointer-events-auto"
        >
          <div
            onClick={handleDismiss}
            className="bg-panel-light border border-line rounded-[12px] shadow-card px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none text-ink font-data text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {activeToast.type === 'locked' && (
                <span className="type-label text-[10px] bg-danger/15 text-danger-text border border-danger/30 px-1 py-0.5 rounded-sm shrink-0 font-bold">
                  LOCKED
                </span>
              )}
              {activeToast.type === 'success' && (
                <span className="type-label text-[10px] bg-accent/15 text-accent-text border border-accent/30 px-1 py-0.5 rounded-sm shrink-0 font-bold">
                  OK
                </span>
              )}
              {activeToast.type === 'error' && (
                <span className="type-label text-[10px] bg-danger/15 text-danger-text border border-danger/30 px-1 py-0.5 rounded-sm shrink-0 font-bold">
                  ERROR
                </span>
              )}
              <span className="truncate">{activeToast.message}</span>
            </div>

            <Button
              variant="ghost"
              compact
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="!min-h-[44px] !w-[44px] !p-0 border-0 text-ink-muted hover:text-ink text-sm font-bold shrink-0 bg-transparent"
              aria-label="Dismiss toast"
            >
              ✕
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
