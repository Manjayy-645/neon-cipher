'use client';

import React from 'react';
import { Modal } from './Modal';

export interface BottomDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function BottomDrawer({ open, onClose, title, children, footer }: BottomDrawerProps) {
  if (!open) return null;

  return (
    <Modal
      label={title || 'Drawer'}
      onClose={onClose}
      footer={footer}
      className="bg-panel text-ink border-t border-line rounded-t-lg p-4 sm:p-6 shadow-sheet"
      header={
        <>
          <div className="w-10 h-1 rounded-full bg-line mx-auto mb-3 shrink-0" aria-hidden="true" />
          {title && (
            <div className="flex items-center justify-between pb-3 border-b border-line shrink-0">
              <h2 className="font-heading text-lg font-bold text-ink truncate">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-muted hover:text-ink rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </>
      }
    >
      <div className="font-data text-sm">{children}</div>
    </Modal>
  );
}
