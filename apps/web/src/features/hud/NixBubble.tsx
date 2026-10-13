'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../../stores/player-store';
import { useMapStore } from '../../stores/map-store';
import { getNodes } from '../map/nodeService';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from '@/components/ui/Button';

const NIX_LINES = [
  "",
  "A starter rig can crack this. Don't rush.",
  "Standard ICE. Watch the timer.",
  "Corporate security. They track mistakes.",
  "Vault-level. One slip and you're traced.",
  "Military grade. Prepare to fry your rig."
];

export interface NixBubbleProps {
  message?: string;
  onDismiss?: () => void;
  isOpen?: boolean;
  className?: string;
}

export const NixBubble: React.FC<NixBubbleProps> = ({
  message: propMessage,
  onDismiss,
  isOpen,
  className = '',
}) => {
  const { nixDismissed, dismissNix } = usePlayerStore();
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const [internalShow, setInternalShow] = useState(false);
  const [internalMessage, setInternalMessage] = useState('');
  const shouldReduceMotion = usePrefersReducedMotion();

  const isControlled = isOpen !== undefined;
  const show = isControlled ? isOpen : internalShow;
  const message = propMessage ?? internalMessage;

  useEffect(() => {
    if (isControlled) return;
    if (nixDismissed || !selectedNodeId) {
      setInternalShow(false);
      return;
    }
    const nodes = getNodes();
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node && NIX_LINES[node.tier]) {
      setInternalMessage(NIX_LINES[node.tier]);
      setInternalShow(true);
    }
  }, [selectedNodeId, nixDismissed, isControlled]);

  const handleDismiss = () => {
    if (!isControlled) {
      setInternalShow(false);
    }
    onDismiss?.();
    dismissNix();
  };

  useEffect(() => {
    if (!show || !message) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, message, isControlled, onDismiss, dismissNix]);

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
          className={`absolute top-[10px] right-[10px] left-[10px] sm:left-auto sm:max-w-[380px] z-30 pointer-events-auto ${className}`}
          role="region"
          aria-label="Nix Guide"
        >
          {/* surface.panelLight, 1px line, radius 14, card shadow, padding 8px 10px, gap 10px, solid fill */}
          <div className="bg-panel-light border border-line rounded-[14px] shadow-card px-[10px] py-[8px] flex items-center gap-[10px] w-full">
            {/* Portrait slot 36px round (radius 999), 1px line, Nix character portrait */}
            <div
              data-testid="nix-portrait"
              className="w-[36px] h-[36px] rounded-full border border-line bg-accent flex items-center justify-center shrink-0 select-none overflow-hidden relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Character portraits/Nix.png"
                alt="Nix"
                className="w-full h-full object-cover"
              />
              <span
                className="font-heading text-white text-[18px] font-bold leading-none select-none sr-only"
                aria-hidden="true"
              >
                N
              </span>
            </div>

            {/* Text: "NIX" in accent.text, 11px, letter-spacing 1px; the line below in 12px mono ink, max 2 lines */}
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <span className="font-data text-accent-text text-[11px] font-semibold tracking-[1px] uppercase leading-none">
                NIX
              </span>
              <p className="font-data text-ink text-[12px] leading-[15px] mt-1 line-clamp-2 overflow-hidden">
                {message}
              </p>
            </div>

            {/* Close button 44px hit area with an X icon 16px */}
            <Button
              variant="icon"
              onClick={handleDismiss}
              aria-label="Close guide"
              className="-mr-1 shrink-0 border-line/40 hover:border-line bg-panel/70 hover:bg-panel text-ink-muted hover:text-ink shadow-sm"
            >
              <svg
                className="w-[16px] h-[16px] text-ink-muted hover:text-ink transition-colors"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" />
                <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" />
              </svg>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
