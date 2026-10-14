'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATALOG, CatalogItem } from '../market/catalog';
import { Button } from '@/components/ui/Button';

interface LoadoutSelectorProps {
  isOpen: boolean;
  equippedTools: string[];
  inventory: Record<string, number>;
  onToggleEquip: (toolId: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const LoadoutSelector: React.FC<LoadoutSelectorProps> = ({
  isOpen,
  equippedTools,
  inventory,
  onToggleEquip,
  onClose,
  title = 'LOADOUT SELECTOR',
  subtitle = 'Arm up to two consumable sabotage tools for the next infiltration.',
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ownedTools = CATALOG.filter(
    (it) => (it.category === 'tools' || it.category === 'exploits') && (inventory[it.id] || 0) > 0
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[480px] bg-panel border-t border-line rounded-t-lg p-5 flex flex-col gap-4 shadow-sheet max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-muted/30 pb-2">
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
              <p className="font-data text-[10px] text-ink-muted leading-tight">{subtitle}</p>
            </div>
            <Button
              variant="icon"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 bg-transparent border-transparent hover:border-transparent text-ink text-xs p-1"
            >
              <span className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center hover:bg-ink/20">
                <img src="/icons/icon-close.svg" alt="" className="w-3.5 h-3.5 object-contain pointer-events-none" aria-hidden="true" />
              </span>
            </Button>
          </div>

          {/* Active 2-Bay Rig Sockets */}
          <div className="grid grid-cols-2 gap-2.5 bg-panel-dark/10 p-3 rounded-md border border-ink-muted/30">
            {[0, 1].map((idx) => {
              const toolId = equippedTools[idx];
              const tool = CATALOG.find((it) => it.id === toolId);

              return (
                <div
                  key={idx}
                  className="bg-panel border border-ink-muted/40 p-2.5 rounded-lg flex flex-col justify-between min-h-[64px]"
                >
                  <span className="font-data text-[9px] text-ink-muted uppercase">
                    EXPANSION BAY {idx + 1}
                  </span>
                  {tool ? (
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {tool.icon && (
                          <div className="w-5 h-5 rounded bg-panel-dark/10 border border-line/60 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <span className="font-heading text-xs font-bold text-ink truncate">
                          {tool.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        compact
                        onClick={() => onToggleEquip(tool.id)}
                        className="text-[10px] font-data text-danger-text hover:underline ml-1 h-auto min-h-[28px] border-none px-1"
                      >
                        Unequip
                      </Button>
                    </div>
                  ) : (
                    <span className="font-data text-xs text-ink-muted/50 italic mt-1">
                      [Bay Empty]
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inventory List */}
          <div className="flex flex-col gap-2">
            <span className="font-data text-xs font-bold text-ink uppercase tracking-wider">
              Available Tools in Stock
            </span>

            {ownedTools.length === 0 ? (
              <div className="bg-panel-dark/5 p-4 rounded-md border border-ink-muted/20 text-center font-data text-xs text-ink-muted">
                <p>No consumable tools in your inventory.</p>
                <p className="text-[10px] mt-1">Visit the Black Market to acquire tools.</p>
              </div>
            ) : (
              ownedTools.map((tool) => {
                const isEquipped = equippedTools.includes(tool.id);
                const count = inventory[tool.id] || 0;

                return (
                  <div
                    key={tool.id}
                    className={`p-3 rounded-md border flex items-center justify-between gap-2 transition-all ${
                      isEquipped
                        ? 'bg-accent/10 border-accent'
                        : 'bg-panel border-ink-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {tool.icon && (
                        <div className="w-9 h-9 rounded bg-panel-dark/5 border border-line p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                          {isEquipped && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full p-0.5 shadow-sm flex items-center justify-center">
                              <img src="/icons/icon-check.svg" alt="" className="w-3 h-3 object-contain" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-sm font-bold text-ink truncate">
                            {tool.name}
                          </span>
                          <span className="font-data text-[10px] bg-ink/10 px-1.5 py-0.2 rounded font-bold">
                            x{count}
                          </span>
                        </div>
                        <p className="font-data text-[11px] text-ink-muted truncate mt-0.5">
                          {tool.effect}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant={isEquipped ? 'danger' : 'primary'}
                      compact
                      onClick={() => onToggleEquip(tool.id)}
                    >
                      {isEquipped ? 'UNEQUIP' : 'EQUIP'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={onClose}
            className="mt-1"
          >
            CONFIRM LOADOUT
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
