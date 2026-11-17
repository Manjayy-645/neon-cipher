'use client';

import { useResettableState } from '@/lib/useResettableState';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from '@/components/ui/Button';
import { emit } from '@/features/onboarding/events';

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
  portraitSlot,
  dialogue = "You walked right past the precinct scanners to get down here. Respect. Nix told me you've got fast hands on the terminal keys. I've got hot tools, clean memory buffers, and raw exploits straight out of the corporate backplanes. Credits or coins — make your choice.",
  onOpenShop,
  onLeave,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedText, setDisplayedText] = useResettableState(prefersReducedMotion ? dialogue : '', dialogue + prefersReducedMotion);
  const [isTypingComplete, setIsTypingComplete] = useResettableState(prefersReducedMotion, dialogue + prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

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
  }, [dialogue, prefersReducedMotion, setDisplayedText, setIsTypingComplete]);

  const handleSkipTyping = () => {
    if (!isTypingComplete) {
      setDisplayedText(dialogue);
      setIsTypingComplete(true);
    }
  };

  return (
    <div className="scene-ground w-full h-full flex flex-col justify-between p-4 text-ink overflow-y-auto min-h-0">
      {/* Top Banner / Vendor Ambience */}
      <div className="flex items-center justify-between border-b border-ink-muted/30 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-data text-[10px] tracking-widest uppercase text-ink-muted">
            UNDERGROUND ACCESS // LEVEL B-2
          </span>
        </div>
        <span className="font-data text-[10px] text-danger-text uppercase font-bold">
          UNREGISTERED COMMERCE
        </span>
      </div>

      {/* Main Vendor Stage: Shop Interior Environment */}
      <div className="flex-1 min-h-[140px] relative flex flex-col items-center justify-center my-3 rounded-[12px] overflow-hidden border border-line bg-panel shadow-card">
        {/* Atmospheric Shop Interior Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Shop and scenes/shop-interior.png"
            alt="Glitch's Shop Interior"
            className="w-full h-full object-cover brightness-60 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel-light/95 via-panel/60 to-black/40" />
        </div>

        {/* Ambient Shop Tag */}
        <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded-[4px] bg-panel/85 backdrop-blur-xs border border-line text-[10px] font-data text-ink-muted uppercase tracking-wider z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block mr-1.5 animate-pulse" />
          <span>LOCATION // GLITCH’S WORKBENCH</span>
        </div>

        {/* Character Portrait Slot */}
        <div className="relative z-10 flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[12px] bg-panel border-2 border-line/90 overflow-hidden shadow-sheet flex items-center justify-center relative">
              {portraitSlot || (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={vendorName.toUpperCase() === 'ALEX' ? '/Character portraits/Alex.png' : '/Character portraits/Glitch.png'}
                  alt={vendorName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Name Tab pinned to portrait */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink text-panel-light px-3 py-0.5 rounded-full border border-line text-center shadow-sm">
              <span className="font-heading text-xs font-bold tracking-wider">{vendorName}</span>
            </div>
          </div>

          <div className="text-center mt-1">
            <div className="font-data text-[11px] uppercase tracking-[1.5px] text-ink font-semibold drop-shadow-sm px-2 py-0.5 rounded bg-panel/70 border border-line/50">
              {vendorTitle}
            </div>
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
            onClick={() => {
              emit({ type: 'market:gateOpened' });
              onOpenShop();
            }}
            data-tour="shop-open"
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
