'use client';

import React, { useEffect } from 'react';
import { CATALOG, getItemIcon } from '@/features/market/catalog';
import { Button } from '@/components/ui/Button';

export interface ToolInspectorModalProps {
  toolId: string | null;
  onClose: () => void;
  onActivate?: (toolId: string) => void;
  canActivate?: boolean;
  inventoryCount?: number;
}

export function ToolInspectorModal({
  toolId,
  onClose,
  onActivate,
  canActivate = false,
  inventoryCount = 0,
}: ToolInspectorModalProps) {
  useEffect(() => {
    if (!toolId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toolId, onClose]);

  if (!toolId) return null;

  const item = CATALOG.find((it) => it.id === toolId);
  if (!item) return null;

  const iconSrc = item.icon || getItemIcon(item.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tool-inspector-title"
      data-testid="tool-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-data select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[8px] border border-terminal-line bg-terminal-panel p-5 shadow-card text-terminal-ink flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Icon, Name, and Close button */}
        <div className="flex items-start justify-between gap-3 border-b border-terminal-line/60 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            {iconSrc && (
              <div className="w-10 h-10 rounded-[6px] bg-terminal-bg border border-terminal-line p-1 shrink-0 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt={item.name} className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-terminal-phosphor font-bold">
                INTRUSION RIG // TOOL SPEC
              </span>
              <h2 id="tool-inspector-title" className="font-heading text-lg font-bold text-terminal-ink truncate">
                {item.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close tool inspector"
            className="w-8 h-8 rounded-[6px] border border-terminal-line hover:border-terminal-phosphor text-terminal-muted hover:text-terminal-ink flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body specs */}
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="flex items-center justify-between text-[11px] bg-terminal-bg/70 px-2.5 py-1.5 rounded-[4px] border border-terminal-line/40">
            <span className="text-terminal-muted uppercase">LOADOUT DECK STATUS:</span>
            <span className="font-bold text-terminal-phosphor">
              {inventoryCount > 0 ? `x${inventoryCount} READY` : 'DEPLETED'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-terminal-muted tracking-wider block mb-1">
              PRIMARY EFFECT
            </span>
            <p className="text-terminal-ink bg-terminal-bg/40 p-2.5 rounded-[4px] border border-terminal-line/30">
              {item.effect}
            </p>
          </div>

          {item.nixTip && (
            <div>
              <span className="text-[10px] uppercase font-bold text-terminal-phosphor tracking-wider block mb-0.5">
                NIX TACTICAL ADVICE
              </span>
              <p className="text-terminal-muted italic text-[11px]">
                &quot;{item.nixTip}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-terminal-line/40">
          {canActivate && onActivate && (
            <Button
              variant="primary"
              size="full"
              onClick={() => {
                onActivate(item.id);
                onClose();
              }}
              data-testid="deploy-inspected-tool-btn"
              className="h-11 min-h-[44px] text-xs font-bold uppercase tracking-wider bg-terminal-phosphor text-black hover:brightness-110"
            >
              DEPLOY INTRUSION TOOL
            </Button>
          )}
          <Button
            variant="ghost"
            size="full"
            onClick={onClose}
            data-testid="close-tool-inspector-btn"
            className="h-10 min-h-[40px] text-xs font-bold uppercase tracking-wider text-terminal-muted hover:text-terminal-ink border-terminal-line"
          >
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
}
