'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export interface TourSpotlightProps {
  targetSelector?: string;
  line: string;
  speaker: 'nix' | 'glitch';
  onTap?: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
  isTapToAdvance?: boolean;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export function TourSpotlight({
  targetSelector,
  line,
  speaker,
  onTap,
  showSkip = true,
  onSkip,
  isTapToAdvance = false,
}: TourSpotlightProps) {
  const shouldReduceMotion = useReducedMotion();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    if (!targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(
      `[data-tour="${targetSelector}"], [data-tour~="${targetSelector}"], ${targetSelector}`
    );
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      });
    } else {
      setTargetRect(null);
    }
  }, [targetSelector]);

  // Query DOM with retry for up to 1s if target element is not mounted yet
  useEffect(() => {
    updateRect();

    let retries = 0;
    const interval = setInterval(() => {
      updateRect();
      retries++;
      if (retries >= 10) {
        clearInterval(interval);
      }
    }, 100);

    const handleResizeOrScroll = () => updateRect();
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    // MutationObserver to catch DOM changes
    const observer = new MutationObserver(() => updateRect());
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      observer.disconnect();
    };
  }, [updateRect]);

  // Escape key pauses the tour
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isPaused) {
    return (
      <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
        <Button
          variant="secondary"
          compact
          onClick={() => setIsPaused(false)}
          className="shadow-card border-accent"
        >
          RESUME TOUR
        </Button>
      </div>
    );
  }

  const pad = 4;
  const hasCutout = targetRect !== null && targetRect.width > 0 && targetRect.height > 0;

  const cutout = hasCutout
    ? {
        top: Math.max(0, targetRect.top - pad),
        left: Math.max(0, targetRect.left - pad),
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
        bottom: targetRect.bottom + pad,
        right: targetRect.right + pad,
      }
    : null;

  // Position guide bubble above or below target
  let bubbleStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: '440px',
    zIndex: 50,
  };

  if (cutout) {
    const spaceBelow = window.innerHeight - cutout.bottom;
    const placeAbove = spaceBelow < 180 && cutout.top > 180;

    if (placeAbove) {
      bubbleStyle = {
        ...bubbleStyle,
        bottom: `${window.innerHeight - cutout.top + 12}px`,
      };
    } else {
      bubbleStyle = {
        ...bubbleStyle,
        top: `${cutout.bottom + 12}px`,
      };
    }
  } else {
    // Default center bottom if no target
    bubbleStyle = {
      ...bubbleStyle,
      bottom: '32px',
    };
  }

  return (
    <div className="fixed inset-0 z-40 pointer-events-none select-none">
      {/* 4-panel Backdrop: dims everything outside cutout and BLOCKS pointer input */}
      {cutout ? (
        <>
          {/* Top panel */}
          <div
            style={{ top: 0, left: 0, right: 0, height: cutout.top }}
            className="fixed bg-[#37332E]/60 pointer-events-auto"
            aria-hidden="true"
          />
          {/* Bottom panel */}
          <div
            style={{ top: cutout.bottom, left: 0, right: 0, bottom: 0 }}
            className="fixed bg-[#37332E]/60 pointer-events-auto"
            aria-hidden="true"
          />
          {/* Left panel */}
          <div
            style={{ top: cutout.top, left: 0, width: cutout.left, height: cutout.height }}
            className="fixed bg-[#37332E]/60 pointer-events-auto"
            aria-hidden="true"
          />
          {/* Right panel */}
          <div
            style={{ top: cutout.top, left: cutout.right, right: 0, height: cutout.height }}
            className="fixed bg-[#37332E]/60 pointer-events-auto"
            aria-hidden="true"
          />

          {/* Accent ring around target with pulse */}
          <motion.div
            style={{
              top: cutout.top,
              left: cutout.left,
              width: cutout.width,
              height: cutout.height,
            }}
            initial={{ opacity: 0.8 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    scale: [1, 1.02, 1],
                    opacity: [0.85, 1, 0.85],
                  }
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="fixed border-2 border-accent rounded-[8px] pointer-events-none z-45"
            aria-hidden="true"
          />
        </>
      ) : (
        <div
          className="fixed inset-0 bg-[#37332E]/60 pointer-events-auto"
          aria-hidden="true"
        />
      )}

      {/* Skip Tour Button in corner */}
      {showSkip && onSkip && (
        <div className="fixed top-3 right-3 z-50 pointer-events-auto">
          <Button
            variant="ghost"
            compact
            onClick={onSkip}
            aria-label="Skip tour"
            className="bg-panel/85 border border-line text-ink-muted hover:text-ink text-xs h-[44px] min-h-[44px] px-3 shadow-xs"
          >
            SKIP TOUR
          </Button>
        </div>
      )}

      {/* Guide Bubble */}
      <div
        ref={bubbleRef}
        style={bubbleStyle}
        onClick={isTapToAdvance && onTap ? onTap : undefined}
        className={`pointer-events-auto bg-panel-light border border-line rounded-[14px] p-3 sm:p-3.5 shadow-card ${
          isTapToAdvance ? 'cursor-pointer active:brightness-95' : ''
        }`}
        role="region"
        aria-label="Tour Guide"
      >
        <div className="flex items-start gap-3">
          {/* Portrait slot 36px */}
          <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-[8px] border border-line bg-panel flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            <span className="font-heading text-xs font-bold text-ink">
              {speaker === 'glitch' ? 'GL' : 'NX'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Speaker Name Tab */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-data text-[10px] font-bold tracking-[1.5px] uppercase text-ink-muted">
                {speaker === 'glitch' ? 'GLITCH' : 'NIX'}
              </span>
            </div>

            {/* Guide line in 12 to 13px mono */}
            <p
              aria-live="polite"
              className="font-data text-[13px] text-ink leading-relaxed"
            >
              {line}
            </p>

            {/* Tap to continue indicator */}
            {isTapToAdvance && (
              <div className="flex justify-end pt-2">
                <span className="font-data text-[10px] font-bold tracking-wider uppercase text-accent-text">
                  TAP TO CONTINUE ▶
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
