'use client';

import React from 'react';
import { CATALOG } from '@/features/market/catalog';
import { Button } from '@/components/ui/Button';

export interface TerminalToolSlotsProps {
  equippedTools: string[];
  inventory: Record<string, number>;
  onActivateTool: (toolId: string) => void;
  isActivating?: boolean;
  disabled?: boolean;
  toolFeedback?: string | null;
  onClearFeedback?: () => void;
  iceShieldArmed?: boolean;
}

export function TerminalToolSlots({
  equippedTools,
  inventory,
  onActivateTool,
  isActivating = false,
  disabled = false,
  toolFeedback,
  onClearFeedback,
  iceShieldArmed = false,
}: TerminalToolSlotsProps) {
  return (
    <section
      aria-label="Equipped Intrusion Tools"
      className="px-4 py-2 bg-terminal-panel/80 border-t border-terminal-line flex flex-col gap-2 shrink-0 select-none z-10"
    >
      {/* Header line: Equipped status & Ice shield indicator */}
      <div className="flex items-center justify-between text-[11px] font-data">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-terminal-phosphor animate-pulse" />
          <span className="uppercase tracking-[1.5px] text-terminal-muted font-medium">
            RIG SLOTS // INTRUSION TOOLS
          </span>
        </div>

        {iceShieldArmed && (
          <div
            data-testid="ice-shield-status"
            className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-terminal-phosphor/15 border border-terminal-phosphor text-terminal-phosphor text-[10px] font-bold uppercase tracking-wider"
          >
            <span>SHIELD ARMED</span>
          </div>
        )}
      </div>

      {/* Tool Feedback Notice */}
      {toolFeedback && (
        <div
          role="status"
          data-testid="terminal-tool-feedback"
          className="px-3 py-1.5 rounded-[6px] bg-terminal-bg border border-terminal-phosphor/60 text-terminal-phosphor font-data text-xs flex items-center justify-between gap-2 shadow-xs"
        >
          <span className="truncate">{toolFeedback}</span>
          {onClearFeedback && (
            <button
              type="button"
              onClick={onClearFeedback}
              className="text-terminal-muted hover:text-terminal-ink text-xs p-0.5 shrink-0"
              aria-label="Dismiss tool feedback"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Two Equip Slots Grid */}
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((slotIdx) => {
          const toolId = equippedTools[slotIdx];
          const item = toolId ? CATALOG.find((it) => it.id === toolId) : null;
          const count = toolId ? inventory[toolId] || 0 : 0;
          const canUse = item && count > 0 && !disabled && !isActivating;

          if (!item) {
            return (
              <div
                key={slotIdx}
                className="h-[44px] min-h-[44px] rounded-[8px] bg-terminal-bg/50 border border-dashed border-terminal-line/60 px-3 flex items-center justify-center text-[10px] font-data text-terminal-muted/60 uppercase tracking-wider"
              >
                [EMPTY RIG SLOT]
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="h-[44px] min-h-[44px] rounded-[8px] bg-terminal-bg border border-terminal-line px-2 flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                {item.icon && (
                  <div className="w-6 h-6 rounded bg-terminal-panel border border-terminal-line/70 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="w-full h-full object-contain brightness-90"
                    />
                  </div>
                )}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="font-heading text-xs font-bold text-terminal-ink truncate">
                    {item.name}
                  </span>
                  <span className="font-data text-[10px] text-terminal-muted">
                    {count > 0 ? `x${count} in deck` : 'Depleted'}
                  </span>
                </div>
              </div>

              <Button
                variant={canUse ? 'compact' : 'ghost'}
                compact
                disabled={!canUse}
                onClick={() => onActivateTool(item.id)}
                aria-label={`Activate ${item.name}`}
                data-testid={`activate-tool-${item.id}`}
                className="h-[32px] min-h-[32px] px-2.5 text-[10px] font-data font-bold tracking-wider uppercase shrink-0"
              >
                {count > 0 ? 'USE' : 'EMPTY'}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
