'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { DistrictDefinition } from './districtConfig';
import { triggerToast } from '../../stores/toast-store';
import { useMapStore } from '../../stores/map-store';
import { emit } from '@/features/onboarding/events';

export interface DistrictTagProps {
  district: DistrictDefinition;
  totalNodes: number;
  contestedNodes: number;
  isLocked: boolean;
  onSelectDistrict?: (districtId: 'slums' | 'commercial') => void;
}

export const DistrictTag: React.FC<DistrictTagProps> = ({
  district,
  totalNodes,
  contestedNodes,
  isLocked,
  onSelectDistrict,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const selectDistrict = useMapStore((s) => s.selectDistrict);
  const triggerNixSituation = useMapStore((s) => s.triggerNixSituation);
  const [hasInteracted, setHasInteracted] = useState(false);

  const isSlums = district.id === 'slums';
  const showCallToAction = isSlums && !hasInteracted && !isLocked;

  const countText =
    isLocked
      ? `${totalNodes} nodes`
      : contestedNodes > 0
      ? `${totalNodes} nodes, ${contestedNodes} contested`
      : `${totalNodes} nodes`;

  const ariaLabel = `${district.displayName}, ${countText}, ${isLocked ? 'Locked' : 'Open'}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasInteracted(true);
    if (isSlums) {
      emit({ type: 'map:districtTagTapped', district: 'slums' });
    }
    if (isLocked) {
      triggerToast(
        district.unlockHint || 'Complete Chapter 3 for Commercial bridge clearance.',
        { type: 'locked' }
      );
      triggerNixSituation('lockedTap');
    } else {
      if (onSelectDistrict) {
        onSelectDistrict(district.id);
      } else {
        selectDistrict(district.id);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <motion.div
      data-testid={`district-tag-${district.id}`}
      className="relative pointer-events-auto select-none"
      animate={
        prefersReducedMotion
          ? { y: 0 }
          : {
              y: [0, -3, 0],
            }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0.05 }
          : {
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
    >
      <button
        type="button"
        data-tour={isSlums ? 'tag-slums' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        className={`group relative flex flex-col justify-center min-h-[56px] w-[160px] sm:w-[200px] max-w-full py-[10px] px-[14px] bg-panel-light border border-line rounded-md shadow-card outline-none text-left cursor-pointer transition-transform duration-120 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
          showCallToAction ? 'ring-2 ring-accent/40 animate-pulse' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="flex flex-col">
            <span className="font-heading text-[16px] sm:text-[18px] leading-[21px] font-bold tracking-[0.8px] uppercase text-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {district.name}
            </span>
            <span className="font-data text-[12px] leading-[16px] font-semibold text-ink mt-0.5">
              {countText}
            </span>
            {showCallToAction && (
              <span className="font-data text-[11px] font-bold tracking-[1.2px] text-accent-text uppercase mt-1 drop-shadow-[0_0.5px_0_rgba(255,255,255,0.5)]">
                TAP TO ENTER
              </span>
            )}
            {isLocked && district.unlockHint && (
              <span className="font-data text-[11px] font-semibold text-danger-text mt-1 max-w-[160px] whitespace-normal">
                {district.unlockHint}
              </span>
            )}
          </div>

          <div className="shrink-0 pt-0.5">
            {isLocked ? (
              <span
                data-testid={`status-chip-${district.id}-locked`}
                className="bg-ink text-panel-light font-data text-[11px] font-bold tracking-[1px] uppercase rounded-sm px-[8px] py-[3px] flex items-center gap-1 shadow-sm"
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                LOCKED
              </span>
            ) : (
              <span
                data-testid={`status-chip-${district.id}-open`}
                className="bg-accent text-on-accent font-data text-[11px] font-bold tracking-[1px] uppercase rounded-sm px-[8px] py-[3px] shadow-sm"
              >
                OPEN
              </span>
            )}
          </div>
        </div>

        {/* Pointer tail: 10px triangle pointing downwards */}
        <div
          aria-hidden="true"
          className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] rotate-45 bg-panel-light border-r border-b border-line pointer-events-none"
        />
      </button>
    </motion.div>
  );
};
