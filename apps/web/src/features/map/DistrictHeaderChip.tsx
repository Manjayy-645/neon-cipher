'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../stores/map-store';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { DISTRICT_DEFINITIONS } from './districtConfig';
import { getNodes } from './nodeService';

export interface DistrictHeaderChipProps {
  className?: string;
  onBack?: () => void;
}

export const DistrictHeaderChip: React.FC<DistrictHeaderChipProps> = ({
  className = '',
  onBack,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const selectedDistrict = useMapStore((s) => s.selectedDistrict) || 'slums';
  const stepBackView = useMapStore((s) => s.stepBackView);

  const districtDef = DISTRICT_DEFINITIONS[selectedDistrict] || DISTRICT_DEFINITIONS.slums;
  const nodes = getNodes().filter((n) => n.district === selectedDistrict);
  const totalCount = nodes.length;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      stepBackView();
    }
  };

  return (
    <motion.div
      data-testid="district-header-chip"
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
      transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.2, ease: 'easeOut' }}
      className={`pointer-events-auto flex items-center bg-panel-light border border-line rounded-md shadow-card pr-4 pl-1 py-1 min-h-[44px] ${className}`}
    >
      <button
        type="button"
        data-testid="district-back-button"
        onClick={handleBack}
        aria-label="Back to city overview"
        className="w-[44px] h-[44px] flex items-center justify-center rounded-sm text-ink hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none cursor-pointer transition-transform active:scale-[0.95]"
      >
        <img
          src="/icons/icon-back-arrow.svg"
          alt=""
          className="w-5 h-5 object-contain pointer-events-none"
          aria-hidden="true"
        />
      </button>

      <div className="flex flex-col ml-1 select-none">
        <span className="font-heading text-[16px] leading-[19px] font-bold uppercase tracking-[0.5px] text-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
          {districtDef.name}
        </span>
        <span className="font-data text-[11px] leading-[14px] font-bold text-accent-text uppercase flex items-center gap-1">
          <img src="/icons/icon-pin.svg" alt="" className="w-2.5 h-2.5 object-contain" aria-hidden="true" />
          {totalCount} NODES
        </span>
      </div>
    </motion.div>
  );
};
