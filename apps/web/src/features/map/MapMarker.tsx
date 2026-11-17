'use client';

import { useClock } from '@/lib/useClock';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameNode } from './nodeService';
import { useMapStore } from '../../stores/map-store';
import { MarkerIcon } from '../../components/ui/MarkerIcon';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

import { triggerToast } from '../../stores/toast-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { CH2_NODE_ID } from '@/features/onboarding/steps';
import { emit } from '@/features/onboarding/events';

function formatCountdown(seconds?: number): string {
  if (seconds === undefined || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const MapMarker: React.FC<{ node: GameNode }> = ({ node }) => {
  const now = useClock();
  const prefersReducedMotion = usePrefersReducedMotion();
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const activeNodeId = useMapStore((s) => s.activeNodeId);
  const selectNode = useMapStore((s) => s.selectNode);
  const setActiveNodeId = useMapStore((s) => s.setActiveNodeId);
  const bridgeUnlocked = useMapStore((s) => s.unlocks.bridge);

  const step = useOnboardingStore((s) => s.step);
  const crackedNodes = useOnboardingStore((s) => s.crackedNodes);

  const isDimmed = step === 'map.district' && node.id !== CH2_NODE_ID;
  const aliasMap: Record<string, string> = {
    n1: 's1', s1: 'n1',
    n2: 's8', s8: 'n2',
    n3: 'c4', c4: 'n3',
    n4: 's5', s5: 'n4',
    n5: 's2', s2: 'n5',
    n6: 's3', s3: 'n6',
    n7: 's6', s6: 'n7',
    n8: 's4', s4: 'n8',
  };
  const crackedRecord = crackedNodes[node.id] || (aliasMap[node.id] ? crackedNodes[aliasMap[node.id]] : undefined);
  const isCooldownFromCracked = Boolean(
    crackedRecord && crackedRecord.cooldownMs > 0 && now - crackedRecord.crackedAt < crackedRecord.cooldownMs
  );
  const isOwnedFromCracked = Boolean(
    crackedRecord && (crackedRecord.cooldownMs === 0 || now - crackedRecord.crackedAt >= crackedRecord.cooldownMs)
  );
  const cooldownSecs = isCooldownFromCracked
    ? Math.max(0, Math.ceil((crackedRecord.cooldownMs - (now - crackedRecord.crackedAt)) / 1000))
    : node.timerSeconds;

  const effectiveNode = isCooldownFromCracked
    ? { ...node, status: 'cooldown' as const, timerSeconds: cooldownSecs }
    : isOwnedFromCracked || node.status === 'owned'
    ? { ...node, status: 'owned' as const }
    : node;

  const isSelected = (activeNodeId ?? selectedNodeId) === node.id;
  const isLocked = Boolean(node.requiresUnlock && !bridgeUnlocked);

  let tagText = `T${node.tier}`;
  let tagBg = 'bg-ink text-panel-light';

  if (isLocked) {
    tagText = 'LOCKED';
    tagBg = 'bg-ink text-panel-light';
  } else if (effectiveNode.status === 'cooldown') {
    tagText = formatCountdown(cooldownSecs);
    tagBg = 'bg-status-cooldown text-panel-light';
  } else if (effectiveNode.status === 'owned') {
    tagText = 'OWNED';
    tagBg = 'bg-accent text-white';
  }

  if (isSelected) {
    tagBg = 'bg-accent text-white';
  }

  const handleSelect = () => {
    if (isDimmed) return;
    emit({ type: 'map:nodeSelected', nodeId: node.id });

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
      data-tour={node.id === CH2_NODE_ID ? `node-${CH2_NODE_ID}` : undefined}
      className={`relative flex flex-col items-center justify-center cursor-pointer select-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-white focus-visible:shadow-[0_0_0_5px_var(--accent)] transition-all ${
        isSelected ? 'drop-shadow-[0_0_8px_rgba(66,105,71,0.85)]' : ''
      }`}
      style={{
        width: '52px',
        height: '60px',
        touchAction: 'manipulation',
        opacity: isDimmed ? 0.45 : 1,
        pointerEvents: isDimmed ? 'none' : 'auto',
      }}
      animate={{ y: isSelected ? -4 : 0 }}
      transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.22, ease: 'easeOut' }}
      whileTap={prefersReducedMotion || isDimmed ? undefined : { scale: 0.95 }}
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
      aria-label={`${node.name}, tier ${node.tier}, ${isLocked ? 'locked' : effectiveNode.status}`}
    >
      <div className="relative flex flex-col items-center">
        <MarkerIcon size="md" node={effectiveNode} isLocked={isLocked} isSelected={isSelected} />

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
          className={`-mt-[8px] z-20 h-[14px] px-[6px] rounded-[7px] text-[10px] font-data font-semibold tracking-[0.5px] flex items-center justify-center leading-none shadow-marker ${tagBg}`}
          style={{ height: '14px' }}
        >
          {tagText}
        </div>
      </div>
    </motion.button>
  );
};
