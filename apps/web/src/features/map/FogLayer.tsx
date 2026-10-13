'use client';

import React, { useEffect, useState } from 'react';
import { useMapStore } from '../../stores/map-store';
import { triggerToast } from '../../stores/toast-store';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export const FogLayer: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const bridgeUnlocked = useMapStore((s) => s.unlocks.bridge);
  const triggerNixSituation = useMapStore((s) => s.triggerNixSituation);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleFogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bridgeUnlocked) {
      triggerToast('Commercial Strip is locked. Cross the bridge to access.', {
        type: 'locked',
      });
      triggerNixSituation('lockedTap');
    }
  };

  const shouldAnimate = !prefersReducedMotion && isTabVisible && !bridgeUnlocked;

  return (
    <div
      data-testid="fog-layer-root"
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[6]"
    >
      {/* 1. Base Feathered Haze: 55-70% opacity, 14% river ramp-in, overlay.hazeLocked token */}
      <div
        data-testid="locked-zone-haze"
        className="absolute top-0 bottom-0 right-0 w-1/2 pointer-events-none transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none z-[1]"
        style={{
          opacity: bridgeUnlocked ? 0 : 0.62,
          background:
            'linear-gradient(to right, transparent 0%, var(--overlay-haze-locked, #919190) 14%, var(--overlay-haze-locked, #919190) 100%)',
        }}
      />

      {/* 2. Drifting Soft Cloud Fog Layers (over the Commercial side, feathered along river) */}
      <div
        data-testid="fog-drifting-container"
        className={`absolute top-0 bottom-0 right-0 w-1/2 pointer-events-none transition-all duration-[1200ms] ease-out motion-reduce:transition-none z-[2] ${
          bridgeUnlocked ? 'opacity-0 translate-x-12 -translate-y-4' : 'opacity-70 translate-x-0 translate-y-0'
        }`}
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 14%, black 100%)',
        }}
      >
        {/* Cloud Layer 1: Leftward drift loop (44s linear infinite, transform only) */}
        <div
          data-testid="fog-cloud-layer-1"
          aria-hidden="true"
          className="absolute inset-0 w-[140%] h-full pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse 65% 45% at 35% 25%, var(--overlay-fog-tint, #7E878C) 0%, transparent 70%),
                              radial-gradient(ellipse 70% 50% at 75% 65%, var(--overlay-fog-tint, #7E878C) 0%, transparent 75%),
                              radial-gradient(ellipse 55% 45% at 20% 80%, var(--overlay-fog-tint, #7E878C) 0%, transparent 65%)`,
            animation: shouldAnimate ? 'fogDriftLeft 44s linear infinite' : 'none',
            opacity: 0.75,
            willChange: 'transform',
          }}
        />

        {/* Cloud Layer 2: Rightward drift loop (56s linear infinite, transform only) */}
        <div
          data-testid="fog-cloud-layer-2"
          aria-hidden="true"
          className="absolute inset-0 w-[140%] h-full pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse 75% 45% at 65% 30%, var(--overlay-fog-tint, #7E878C) 0%, transparent 75%),
                              radial-gradient(ellipse 55% 55% at 25% 60%, var(--overlay-fog-tint, #7E878C) 0%, transparent 70%),
                              radial-gradient(ellipse 80% 60% at 80% 85%, var(--overlay-fog-tint, #7E878C) 0%, transparent 80%)`,
            animation: shouldAnimate ? 'fogDriftRight 56s linear infinite' : 'none',
            opacity: 0.65,
            willChange: 'transform',
          }}
        />
      </div>

      {/* 3. Clickable Tap Zone over Locked Commercial Area: blocks interaction and makes Nix speak */}
      {!bridgeUnlocked && (
        <button
          type="button"
          data-testid="fog-tap-area"
          aria-label="Locked Commercial Area Fog"
          onClick={handleFogClick}
          className="absolute top-0 bottom-0 right-0 w-1/2 pointer-events-auto bg-transparent border-none cursor-pointer outline-none z-[3]"
        />
      )}

      {/* Embedded keyframe styles for transform-only drifting */}
      <style>{`
        @keyframes fogDriftLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-60px, -15px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes fogDriftRight {
          0% {
            transform: translate3d(-60px, 15px, 0);
          }
          50% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-60px, 15px, 0);
          }
        }
      `}</style>
    </div>
  );
};
