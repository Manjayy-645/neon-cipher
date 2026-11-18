'use client';

import { useResettableState } from '@/lib/useResettableState';
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../stores/map-store';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { NIX_GUIDE_LINES, NixSituation } from './nixGuideLines';
import { getNodes, getNodeById } from './nodeService';
import { useCampaignStore } from '@/stores/campaign-store';
import { useOverlayStore } from '@/stores/overlay-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';

export const NixGuide: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const activeChapterId = useCampaignStore((s) => s.activeChapterId);
  const campaignTutorialActive = useCampaignStore((s) => s.tutorialActive);
  const onboardingTourActive = useOnboardingStore(
    (s) => !s.skipped && ['map.overview', 'map.district', 'map.node'].includes(s.step)
  );

  const view = useMapStore((s) => s.view);
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const sheetHeight = useMapStore((s) => s.sheetHeight);
  const sheetState = useMapStore((s) => s.sheetState);
  const seenNixSituations = useMapStore((s) => s.seenNixSituations);
  const activeNixSituation = useMapStore((s) => s.activeNixSituation);
  const isNixBubbleOpen = useMapStore((s) => s.isNixBubbleOpen);
  const markNixSituationSeen = useMapStore((s) => s.markNixSituationSeen);
  const setNixBubbleOpen = useMapStore((s) => s.setNixBubbleOpen);

  // Compute current situational key
  const currentSituation: NixSituation = useMemo(() => {
    if (activeNixSituation && activeNixSituation in NIX_GUIDE_LINES) {
      return activeNixSituation as NixSituation;
    }
    if (view === 'overview') {
      return 'overview';
    }
    if (view === 'district') {
      return 'district';
    }
    if (view === 'node') {
      const effId = activeNodeId ?? selectedNodeId;
      const node = effId ? (getNodeById(effId) || getNodes().find((n) => n.id === effId)) : undefined;
      if (node) {
        if (node.status === 'contested') return 'contested';
        if (node.status === 'cooldown') return 'cooldown';
        if (node.tier === 1) return 'tier1';
        if (node.tier === 2) return 'tier2';
        if (node.tier === 3) return 'tier3';
        if (node.tier === 4) return 'tier4';
        if (node.tier === 5) return 'tier5';
      }
      return 'tier1';
    }
    return 'overview';
  }, [activeNixSituation, view, activeNodeId, selectedNodeId]);

  const targetLine = NIX_GUIDE_LINES[currentSituation] || NIX_GUIDE_LINES.overview;

  const isCurrentSeen = seenNixSituations.includes(currentSituation);
  const hasUnreadNotification = !isCurrentSeen;

  // Auto-open if situation has not been seen yet, and sheet is not being dragged
  useEffect(() => {
    if (campaignTutorialActive || onboardingTourActive) {
      setNixBubbleOpen(false);
      return;
    }
    if (!isCurrentSeen) {
      setNixBubbleOpen(true);
      markNixSituationSeen(currentSituation);
    }
  }, [
    campaignTutorialActive,
    onboardingTourActive,
    currentSituation,
    isCurrentSeen,
    setNixBubbleOpen,
    markNixSituationSeen,
  ]);

  // Typewriter effect state
  const isInstant = prefersReducedMotion || process.env.NODE_ENV === 'test';
  const writerKey = targetLine + isInstant + isNixBubbleOpen;
  const [displayedText, setDisplayedText] = useResettableState(isInstant ? targetLine : '', writerKey);
  const [isTyping, setIsTyping] = useResettableState(!isInstant && isNixBubbleOpen, writerKey);

  useEffect(() => {
    if (isInstant || !isNixBubbleOpen) return;
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayedText(targetLine.slice(0, index));
      if (index >= targetLine.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [targetLine, isNixBubbleOpen, isInstant, setDisplayedText, setIsTyping]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNixBubbleOpen && useOverlayStore.getState().modals.length === 0) {
        e.stopPropagation();
        setNixBubbleOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNixBubbleOpen, setNixBubbleOpen]);

  const toggleBubble = () => {
    const nextState = !isNixBubbleOpen;
    setNixBubbleOpen(nextState);
    if (nextState) {
      markNixSituationSeen(currentSituation);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNixBubbleOpen(false);
  };

  const handleBubbleClick = () => {
    if (isTyping) {
      // Fast forward typewriter
      setDisplayedText(targetLine);
      setIsTyping(false);
    } else {
      setNixBubbleOpen(false);
    }
  };

  // Compute positioning based on state
  // State A: under HUD top-left -> top: 12px, left: 12px
  // State B: under DistrictHeaderChip top-left -> top: 68px, left: 12px
  // State C: above bottom sheet -> bottom: (sheetHeight + 12)px, left: 16px
  const isNodeView = view === 'node';
  const isDistrictView = view === 'district';

  const defaultTop = isDistrictView ? 68 : 12;
  const bannerAdjustedTop = isDistrictView ? 132 : 76;
  const topPos = activeChapterId ? bannerAdjustedTop : defaultTop;

  const isSheetRaised = isNodeView && (sheetState === 'expanded' || sheetHeight > 300);

  // Auto-collapse speech bubble when bottom sheet rises to Half or Expanded
  useEffect(() => {
    if (isSheetRaised && isNixBubbleOpen) {
      setNixBubbleOpen(false);
    }
  }, [isSheetRaised, isNixBubbleOpen, setNixBubbleOpen]);

  const positionStyles = isNodeView
    ? isSheetRaised
      ? {
          position: 'absolute' as const,
          right: 16,
          top: topPos,
          bottom: 'auto',
          left: 'auto',
        }
      : {
          position: 'absolute' as const,
          left: 16,
          bottom: sheetHeight + 12,
          top: 'auto',
        }
    : {
        position: 'absolute' as const,
        left: 12,
        top: topPos,
        bottom: 'auto',
      };

  if (campaignTutorialActive || onboardingTourActive) return null;

  return (
    <div
      data-testid="nix-guide-container"
      className="z-nix-pip pointer-events-none transition-all duration-300 ease-out flex flex-col items-start gap-2 [@media(max-height:500px)]:!top-3 [@media(max-height:500px)]:!left-auto [@media(max-height:500px)]:right-3"
      style={positionStyles}
    >
      <div className="flex items-start gap-2 pointer-events-auto">
        {/* 48px Portrait Button */}
        <div className="relative">
          <button
            type="button"
            data-testid="nix-portrait-button"
            onClick={toggleBubble}
            aria-label="Nix Guide"
            className="w-[48px] h-[48px] rounded-full bg-panel-light border border-line shadow-card flex items-center justify-center p-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-95 transition-transform overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Character portraits/Nix.png"
              alt="Nix"
              className="w-full h-full rounded-full object-cover"
            />
          </button>

          {/* Notification Dot */}
          {hasUnreadNotification && (
            <span
              data-testid="nix-notification-dot"
              className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] bg-accent rounded-full border-2 border-panel-light shadow-sm pointer-events-none"
            />
          )}
        </div>

        {/* Speech Bubble */}
        <AnimatePresence>
          {isNixBubbleOpen && (
            <motion.div
              data-testid="nix-speech-bubble"
              role="status"
              aria-live="polite"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
              transition={
                prefersReducedMotion ? { duration: 0.05 } : { duration: 0.2, ease: 'easeOut' }
              }
              className="relative max-w-[min(calc(100vw-88px),340px)] bg-panel-light border border-line border-l-4 border-l-accent rounded-[14px] shadow-card p-3.5 pr-10 cursor-pointer select-none text-ink text-left"
              onClick={handleBubbleClick}
            >
              <div className="font-heading text-[12px] font-bold tracking-[1.2px] uppercase text-accent-text mb-1">
                NIX
              </div>
              <p className="font-data text-[13px] leading-[18px] text-ink font-medium whitespace-pre-wrap max-h-[120px] overflow-y-auto pr-1">
                {displayedText}
              </p>

              {/* Dismiss X button: 44px touch target */}
              <button
                type="button"
                data-testid="nix-dismiss-button"
                onClick={handleDismiss}
                aria-label="Dismiss guide"
                className="absolute top-0 right-0 w-[44px] h-[44px] flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full group"
              >
                <span className="w-[26px] h-[26px] rounded-full border border-line/50 group-hover:border-line bg-panel/90 group-hover:bg-panel text-ink-muted group-hover:text-ink flex items-center justify-center shadow-sm transition-colors">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
