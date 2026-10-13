'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameNode } from './nodeService';
import { useMapStore } from '../../stores/map-store';
import { MarkerIcon } from '../../components/ui/MarkerIcon';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

import { triggerToast } from '../../stores/toast-store';

function formatCountdown(seconds?: number): string {
  if (seconds === undefined || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const MapMarker: React.FC<{ node: GameNode }> = ({ node }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const selectNode = useMapStore((s) => s.selectNode);
  const setActiveNodeId = useMapStore((s) => s.setActiveNodeId);
  const bridgeUnlocked = useMapStore((s) => s.unlocks.bridge);

  const isSelected = (activeNodeId ?? selectedNodeId) === node.id;
  const isLocked = Boolean(node.requiresUnlock && !bridgeUnlocked);

  let tagText = `T${node.tier}`;
  let tagBg = 'bg-ink text-panel-light';

  if (isLocked) {
    tagText = 'LOCKED';
    tagBg = 'bg-ink text-panel-light';
  } else if (node.status === 'cooldown') {
    tagText = formatCountdown(node.timerSeconds);
    tagBg = 'bg-status-cooldown text-panel-light';
  }

  if (isSelected) {
    tagBg = 'bg-accent text-white';
  }

  const handleSelect = () => {
    if (isLocked) {
      triggerToast(`${node.name} is locked: Complete Chapter 2 to gain district clearance.`, { type: 'locked' });
    }
    if (setActiveNodeId) {
      setActiveNodeId(node.id);
    } else {
      selectNode(node.id);
    }
  };

  return (
    <motion.button
      className={`relative flex flex-col items-center justify-center cursor-pointer select-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-white focus-visible:shadow-[0_0_0_5px_var(--accent)] transition-shadow ${
        isSelected ? 'drop-shadow-[0_0_8px_rgba(66,105,71,0.85)]' : ''
      }`}
      style={{
        width: '52px',
        height: '60px',
        touchAction: 'manipulation',
      }}
      animate={{ y: isSelected ? -4 : 0 }}
      transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.22, ease: 'easeOut' }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        handleSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleSelect();
        }
      }}
      aria-label={`${node.name}, tier ${node.tier}, ${isLocked ? 'locked' : node.status}`}
    >
      <div className="relative flex flex-col items-center">
        <MarkerIcon size="md" node={node} isLocked={isLocked} isSelected={isSelected} />

        {/* Selection Pulse: 400ms pulse if motion enabled */}
        <AnimatePresence>
          {isSelected && !prefersReducedMotion && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-accent pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Tier badge: height 14px, overlapping plate bottom by 8px, radius 7px, padding 0 6px */}
        <div
          className={`-mt-[8px] z-20 h-[14px] px-[6px] rounded-[7px] text-[10px] font-data font-semibold flex items-center justify-center leading-none shadow-marker ${tagBg}`}
          style={{ height: '14px' }}
        >
          {tagText}
        </div>
      </div>
    </motion.button>
  );
};
