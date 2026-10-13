'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from '@/components/ui/Button';

export interface ShopkeeperSceneProps {
  vendorName?: string;
  vendorTitle?: string;
  portraitSlot?: React.ReactNode;
  dialogue?: string;
  onOpenShop: () => void;
  onLeave: () => void;
}

export const ShopkeeperScene: React.FC<ShopkeeperSceneProps> = ({
  vendorName = 'GLITCH',
  vendorTitle = 'BLACK MARKET BROKER',
  dialogue = "You walked right past the precinct scanners to get down here. Respect. Nix told me you've got fast hands on the terminal keys. I've got hot tools, clean memory buffers, and raw exploits straight out of the corporate backplanes. Credits or coins — make your choice.",
  onOpenShop,
  onLeave,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedText, setDisplayedText] = useState(prefersReducedMotion ? dialogue : '');
  const [isTypingComplete, setIsTypingComplete] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(dialogue);
      setIsTypingComplete(true);
      return;
    }

    setDisplayedText('');
    setIsTypingComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      index++;
      setDisplayedText(dialogue.slice(0, index));
      if (index >= dialogue.length) {
        setIsTypingComplete(true);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [dialogue, prefersReducedMotion]);

  const handleSkipTyping = () => {
    if (!isTypingComplete) {
      setDisplayedText(dialogue);
      setIsTypingComplete(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-panel-light text-ink overflow-y-auto">
      {/* Top Banner / Vendor Ambience */}
      <div className="flex items-center justify-between border-b border-ink-muted/30 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-data text-[10px] tracking-widest uppercase text-ink-muted">
            UNDERGROUND ACCESS // LEVEL B-2
          </span>
        </div>
        <span className="font-data text-[10px] text-danger-text uppercase font-bold">
          UNREGISTERED COMMERCE
        </span>
      </div>

      {/* Main Vendor Stage */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 gap-4">
        {/* Character Portrait Slot */}
        <div className="relative">
          <div className="w-36 h-36 rounded-[12px] bg-panel border border-line overflow-hidden shadow-card flex items-center justify-center relative">
            {/* Cybernetic Glitch portrait SVG art */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-accent" fill="none">
              <rect width="100" height="100" fill="var(--surface-dark)" />
              {/* Shoulders */}
              <path d="M15 95 Q50 60 85 95" fill="var(--surface-panel)" stroke="var(--line)" strokeWidth="2" />
              {/* Head / Collar */}
              <circle cx="50" cy="45" r="22" fill="var(--surface-panel-light)" stroke="var(--line)" strokeWidth="2" />
              {/* Cyber Visor */}
              <rect x="34" y="38" width="32" height="10" rx="3" fill="var(--accent)" fillOpacity="0.9" />
              <line x1="36" y1="43" x2="64" y2="43" stroke="var(--on-accent)" strokeWidth="1.5" />
              {/* Tech Headset */}
              <path d="M26 40 L28 50 L34 52" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="26" cy="40" r="3" fill="var(--ink-muted)" />
            </svg>
          </div>

          {/* Name Tab pinned to portrait */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink text-panel-light px-3 py-0.5 rounded-full border border-line text-center">
            <span className="font-heading text-xs font-bold tracking-wider">{vendorName}</span>
          </div>
        </div>

        <div className="text-center mt-1">
          <div className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium">
            {vendorTitle}
          </div>
        </div>
      </div>

      {/* Dialogue Panel */}
      <div className="flex flex-col gap-3 shrink-0">
        <div
          onClick={handleSkipTyping}
          className="bg-panel-light border border-line rounded-[12px] p-4 shadow-card cursor-pointer relative min-h-[110px] flex flex-col justify-between"
          role="region"
          aria-label="Shopkeeper dialogue"
        >
          {/* Decorative Corner Tag */}
          <div className="absolute -top-2.5 left-4 bg-accent text-on-accent text-[9px] font-data px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider">
            TRANSMISSION
          </div>

          <p className="font-data text-xs text-ink leading-relaxed select-none">
            &quot;{displayedText}&quot;
            {!isTypingComplete && (
              <span className="inline-block w-1.5 h-3 ml-1 bg-accent animate-pulse align-middle" />
            )}
          </p>

          <div className="flex justify-end mt-2">
            <span className="font-data text-[9px] text-ink-muted uppercase">
              {isTypingComplete ? 'Tap dialogue to re-read' : 'Tap to skip'}
            </span>
          </div>
        </div>

        {/* Action Choices */}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={onOpenShop}
          >
            OPEN BLACK MARKET
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={onLeave}
          >
            LEAVE
          </Button>
        </div>
      </div>
    </div>
  );
};
