'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, animate, PanInfo, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMapStore } from '../../stores/map-store';
import { getNodes, GameNode, NodeStatus } from '../map/nodeService';
import { NodePlate } from '../map/NodePlate';
import { usePlayerStore } from '../../stores/player-store';
import { walletService } from '../market/walletService';
import { LoadoutSelector } from '../rig/LoadoutSelector';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from '@/components/ui/Button';

const SNAP_POINTS = [76, 250, 500]; // peek, half, expanded

const NIX_SAY = [
  "",
  "A starter rig can crack this. Don't rush.",
  "Standard ICE. Watch the timer.",
  "Corporate security. They track mistakes.",
  "Vault-level. One slip and you're traced.",
  "Military grade. Prepare to fry your rig."
];

function getMicrocopy(node: GameNode, isLocked: boolean): string {
  if (isLocked) return 'District ICE active. Bridge clearance required.';
  if (node.status === 'cooldown') return 'Node cooling down. Countermeasures rebooting.';
  if (node.status === 'owned') return 'Node compromised. Regular dividends collected.';
  switch (node.tier) {
    case 1:
      return 'Signal stable. Lock is local.';
    case 2:
      return 'Quiet corner. Standard ICE detected.';
    case 3:
      return 'Corporate security. Traces escalate fast.';
    case 4:
      return 'High security vault. Encrypted subroutines.';
    case 5:
      return 'Military grade relay. Zero margin for error.';
    default:
      return 'Signal stable. Lock is local.';
  }
}

function StatusChip({
  status,
  isLocked,
  tier,
}: {
  status: NodeStatus;
  isLocked: boolean;
  tier: number;
}) {
  if (isLocked) {
    return (
      <span
        data-testid="status-chip-locked"
        className="bg-ink-muted text-white font-data text-[11px] font-semibold tracking-[1px] rounded-[6px] py-[4px] px-[8px] uppercase shrink-0"
      >
        LOCKED
      </span>
    );
  }

  switch (status) {
    case 'contested':
      return (
        <span
          data-testid="status-chip-contested"
          className="bg-danger text-white font-data text-[11px] font-semibold tracking-[1px] rounded-[6px] py-[4px] px-[8px] uppercase shrink-0"
        >
          CONTESTED
        </span>
      );
    case 'cooldown':
      return (
        <span
          data-testid="status-chip-cooldown"
          className="bg-status-cooldown text-white font-data text-[11px] font-semibold tracking-[1px] rounded-[6px] py-[4px] px-[8px] uppercase shrink-0"
        >
          COOLDOWN
        </span>
      );
    case 'owned':
      return (
        <span
          data-testid="status-chip-owned"
          className="bg-accent text-white font-data text-[11px] font-semibold tracking-[1px] rounded-[6px] py-[4px] px-[8px] uppercase shrink-0"
        >
          OWNED
        </span>
      );
    default:
      return (
        <span
          data-testid="status-chip-tier"
          className="bg-accent text-white font-data text-[11px] font-semibold tracking-[1px] rounded-[6px] py-[4px] px-[8px] uppercase shrink-0"
        >
          TIER {tier}
        </span>
      );
  }
}

import { useCampaignStore } from '../../stores/campaign-store';
import { SheetState } from '../../stores/map-store';

export interface NodeSheetProps {
  nodeId?: string | null;
  sheetState?: SheetState;
  onJackIn?: (nodeId: string) => void;
  onClose?: () => void;
}

const INDEX_TO_STATE: SheetState[] = ['peek', 'half', 'expanded'];
const STATE_TO_INDEX: Record<SheetState, number> = {
  peek: 0,
  half: 1,
  expanded: 2,
};

export const NodeSheet: React.FC<NodeSheetProps> = ({
  nodeId: controlledNodeId,
  sheetState: controlledSheetState,
  onJackIn,
  onClose,
}) => {
  const router = useRouter();
  const selectedNodeId = useMapStore(s => s.selectedNodeId);
  const activeNodeId = useMapStore(s => s.activeNodeId);
  const selectNode = useMapStore(s => s.selectNode);
  const setActiveNodeId = useMapStore(s => s.setActiveNodeId);
  const storeSheetState = useMapStore(s => s.sheetState);
  const setStoreSheetState = useMapStore(s => s.setSheetState);
  const mapBridgeUnlocked = useMapStore(s => s.unlocks.bridge);
  const campaignBridgeUnlocked = useCampaignStore(s => s.unlocks.bridge);
  const bridgeUnlocked = mapBridgeUnlocked || campaignBridgeUnlocked;
  const setSheetHeight = useMapStore(s => s.setSheetHeight);
  
  const equippedTools = usePlayerStore((s) => s.equippedTools);
  const inventory = usePlayerStore((s) => s.inventory);
  const setEquippedTools = usePlayerStore((s) => s.setEquippedTools);
  const syncWallet = usePlayerStore((s) => s.syncWallet);
  const prefersReducedMotion = usePrefersReducedMotion();

  const effectiveNodeId = controlledNodeId !== undefined ? controlledNodeId : (activeNodeId ?? selectedNodeId);
  const effectiveSheetState = controlledSheetState ?? storeSheetState;

  const [snapIndex, setSnapIndex] = useState(() => {
    if (effectiveSheetState) {
      return STATE_TO_INDEX[effectiveSheetState] ?? 1;
    }
    return effectiveNodeId ? 1 : 0;
  });
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const y = useMotionValue(-SNAP_POINTS[snapIndex]);

  // Sync wallet on mount to ensure fresh loadout and inventory
  useEffect(() => {
    walletService.getWallet().then((w) => {
      syncWallet(w);
    }).catch(() => {});
  }, [syncWallet]);

  const handleToggleEquip = async (toolId: string) => {
    let next: string[];
    if (equippedTools.includes(toolId)) {
      next = equippedTools.filter((id) => id !== toolId);
    } else {
      if (equippedTools.length >= 2) return;
      next = [...equippedTools, toolId];
    }
    try {
      const res = await walletService.equipTools(next);
      if (res.success && res.equippedTools) {
        setEquippedTools(res.equippedTools);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // When sheetState in store or props changes, sync snapIndex
  useEffect(() => {
    if (effectiveSheetState) {
      const targetIdx = STATE_TO_INDEX[effectiveSheetState];
      if (targetIdx !== undefined && targetIdx !== snapIndex) {
        setSnapIndex(targetIdx);
      }
    }
  }, [effectiveSheetState]);

  // When effective node changes, open at 'half' if selected
  useEffect(() => {
    if (effectiveNodeId) {
      setSnapIndex(1);
      setStoreSheetState?.('half');
    } else {
      setSnapIndex(0);
      setStoreSheetState?.('peek');
    }
  }, [effectiveNodeId, setStoreSheetState]);

  // Animate to snap point whenever snapIndex changes
  useEffect(() => {
    animate(
      y,
      -SNAP_POINTS[snapIndex],
      prefersReducedMotion
        ? { duration: 0.05 }
        : {
            type: 'spring',
            stiffness: 380,
            damping: 34,
            mass: 1,
            restDelta: 0.5,
          }
    );
    setSheetHeight(SNAP_POINTS[snapIndex]);
    const newState = INDEX_TO_STATE[snapIndex];
    if (newState && setStoreSheetState) {
      setStoreSheetState(newState);
    }
  }, [snapIndex, y, setSheetHeight, setStoreSheetState]);

  // Escape key closes loadout selector or dismisses node sheet
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLoadoutOpen) {
          setIsLoadoutOpen(false);
          return;
        }
        if (effectiveNodeId) {
          if (onClose) {
            onClose();
          } else {
            selectNode(null);
            setActiveNodeId(null);
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isLoadoutOpen, effectiveNodeId, onClose, selectNode, setActiveNodeId]);

  if (!effectiveNodeId) return null;

  const node = getNodes().find(n => n.id === effectiveNodeId);
  if (!node) return null;

  const isLocked = node.requiresUnlock && !bridgeUnlocked;
  const isActionDisabled = isLocked || node.status === 'cooldown' || node.status === 'owned';

  let actionLabel = 'JACK IN';
  if (isLocked) {
    actionLabel = 'LOCKED ZONE';
  } else if (node.status === 'cooldown') {
    actionLabel = 'COOLDOWN - 05:43';
  } else if (node.status === 'owned') {
    actionLabel = 'OWNED';
  }

  const handleDragEnd = (_e: any, info: PanInfo) => {
    const currentH = -y.get();
    const velocityH = -info.velocity.y;
    const projectedH = currentH + velocityH * 0.15;

    let closestIndex = 0;
    let minDiff = Infinity;
    SNAP_POINTS.forEach((snap, i) => {
      const diff = Math.abs(snap - projectedH);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    setSnapIndex(closestIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSnapIndex(prev => Math.min(prev + 1, SNAP_POINTS.length - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSnapIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycleState();
    }
  };

  const cycleState = () => {
    setSnapIndex(prev => (prev === 2 ? 0 : prev + 1));
  };

  const navigateToTerminal = () => {
    if (isActionDisabled) return;
    if (onJackIn) {
      onJackIn(node.id);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cipher:jack-in', { detail: { nodeId: node.id } })
      );
    }
    router.push(`/terminal/${node.id}`);
  };

  return (
    <>
      <motion.div
        data-testid="node-sheet"
        className="absolute left-0 right-0 bottom-0 w-full bg-panel-light rounded-t-lg border-t border-line shadow-sheet z-30 flex flex-col touch-none pointer-events-auto select-none"
        style={{ 
          y, 
          bottom: `calc(-1 * max(${SNAP_POINTS[2]}px, 100vh))`
        }}
        drag="y"
        dragConstraints={{ top: -SNAP_POINTS[2], bottom: -SNAP_POINTS[0] }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {/* Handle: 44 x 5px pill, ink.muted at 70%, 28px tall touch zone */}
        <div 
          data-testid="sheet-handle-zone"
          className="h-[28px] shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-accent outline-none"
          onClick={cycleState}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Toggle node sheet size"
        >
          <div 
            data-testid="sheet-handle-pill"
            className="w-[44px] h-[5px] bg-ink-muted/70 rounded-pill" 
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={node.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
            className="flex flex-col flex-1 overflow-hidden"
            data-testid="sheet-node-content"
          >
            {snapIndex === 0 ? (
              /* Peek (76px): plate 36px, node name serif 17px, tier chip, bounty in money.text, chevron up */
              <div 
                className="h-[48px] px-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                onClick={() => setSnapIndex(1)}
                data-testid="node-sheet-peek"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <NodePlate node={node} isLocked={isLocked} isSelected={false} size="xs" />
                  <span className="font-heading text-[17px] font-bold text-ink truncate">
                    {node.name}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="bg-accent text-white font-data text-[11px] font-semibold tracking-[1px] rounded-[6px] py-[4px] px-[8px] uppercase">
                    TIER {node.tier}
                  </span>
                  <span className="font-data text-[15px] font-semibold text-money-text">
                    ${node.bounty}
                  </span>
                  <Button
                    variant="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSnapIndex(1);
                    }}
                    aria-label="Expand sheet"
                    data-testid="peek-expand-button"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </Button>
                </div>
              </div>
            ) : (
              /* Half (about 250px) & Expanded */
              <div className="px-4 pb-[env(safe-area-inset-bottom)] flex-1 flex flex-col gap-2.5 overflow-hidden">
                {/* 1. Row: 52px plate, node name serif 21px / 23px line height (max two lines), status chip right */}
                <div className="flex items-center justify-between gap-3 shrink-0 pt-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <NodePlate node={node} isLocked={isLocked} isSelected={true} size="md" />
                    <h2 className="font-heading text-[21px] leading-[23px] font-bold text-ink line-clamp-2">
                      {node.name}
                    </h2>
                  </div>
                  <StatusChip status={node.status} isLocked={isLocked} tier={node.tier} />
                </div>

                {/* 2. Specs row: four equal columns (DIGITS, TRIES, TIMER, BOUNTY), 1px vertical dividers */}
                <div 
                  data-testid="specs-row"
                  className="grid grid-cols-4 divide-x divide-line border-y border-line py-2 shrink-0"
                >
                  <div className="flex flex-col items-center justify-center px-1 text-center">
                    <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted">DIGITS</span>
                    <span className="font-data text-[15px] font-semibold text-ink">{node.digits}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-1 text-center">
                    <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted">TRIES</span>
                    <span className="font-data text-[15px] font-semibold text-ink">{node.attempts}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-1 text-center">
                    <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted">TIMER</span>
                    <span className="font-data text-[15px] font-semibold text-ink">{node.timerSeconds}s</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-1 text-center">
                    <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted">BOUNTY</span>
                    <span className="font-data text-[15px] font-semibold text-money-text">${node.bounty}</span>
                  </div>
                </div>

                {/* 3. Microcopy: 12px mono, muted. Contested nodes show rival warning in danger.text */}
                <div className="shrink-0 min-h-[18px]">
                  {node.status === 'contested' ? (
                    <p className="font-data text-[12px] text-danger-text font-semibold truncate" data-testid="microcopy-warning">
                      WARNING: Rival runner active on frequency.
                    </p>
                  ) : (
                    <p className="font-data text-[12px] text-ink-muted truncate" data-testid="microcopy">
                      {getMicrocopy(node, isLocked)}
                    </p>
                  )}
                </div>

                {/* Expanded state: adds recent attempts, trace risk, rival activity */}
                {snapIndex === 2 && (
                  <div className="flex flex-col divide-y divide-line border-y border-line py-1 text-sm shrink-0" data-testid="expanded-specs">
                    <div className="flex items-center justify-between py-2">
                      <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted">TRACE RISK</span>
                      <span className="font-data text-[15px] font-semibold text-danger-text">{node.traceRisk}%</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted">RECENT ATTEMPTS</span>
                      <span className="font-data text-[15px] font-semibold text-ink">3 FAILED</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted">RIVAL ACTIVITY</span>
                      <span className={`font-data text-[15px] font-semibold ${node.status === 'contested' ? 'text-danger-text' : 'text-ink'}`}>
                        {node.status === 'contested' ? 'ACTIVE RUNNER' : 'NONE DETECTED'}
                      </span>
                    </div>
                    {NIX_SAY[node.tier] && (
                      <div className="pt-2 text-xs italic text-ink-muted font-heading">
                        &quot;{NIX_SAY[node.tier]}&quot;
                      </div>
                    )}
                  </div>
                )}

                {/* 4. JACK IN button pinned at the bottom (+ Loadout slots button) */}
                <div className="mt-auto flex flex-col gap-2 pt-1 pb-3 shrink-0">
                  {!isActionDisabled && (
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setIsLoadoutOpen(true)}
                      aria-label="Configure equipped sabotage tools"
                      data-testid="loadout-toggle-button"
                      className="justify-between px-3"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="font-data text-[10px] uppercase tracking-wider text-ink-muted">LOADOUT SLOTS</span>
                      </div>
                      <span className="font-data text-[11px] font-semibold text-accent-text">
                        {equippedTools.length > 0 ? `${equippedTools.length}/2 TOOLS ARMED` : 'ARM TOOLS (0/2)'}
                      </span>
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={navigateToTerminal}
                    disabled={isActionDisabled}
                    data-testid="jack-in-button"
                  >
                    {actionLabel}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <LoadoutSelector
        isOpen={isLoadoutOpen}
        equippedTools={equippedTools}
        inventory={inventory}
        onToggleEquip={handleToggleEquip}
        onClose={() => setIsLoadoutOpen(false)}
        title="PRE-BREACH LOADOUT"
        subtitle="Arm up to two consumable sabotage tools before jacking in."
      />
    </>
  );
};
