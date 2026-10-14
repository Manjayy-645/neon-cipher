'use client';

import React, { useState } from 'react';
import { useDuelStore } from '@/stores/duel-store';
import { usePlayerStore } from '@/stores/player-store';
import {
  SABOTAGE_TOOL_CATALOG,
  SABOTAGE_RULES,
  SabotageToolId,
  SabotageToolRule,
} from '@neon-cipher/game-rules';
import { duelService } from './duelService';
import { Button } from '@/components/ui/Button';

export interface SabotageBarProps {
  duelId?: string;
  playerCredits?: number;
  shieldActive?: boolean;
  disabled?: boolean;
  onSabotageResult?: (result: {
    success: boolean;
    shielded: boolean;
    effectApplied?: string;
    remainingCredits: number;
    message: string;
  }) => void;
}

const SABOTAGE_ICONS: Record<string, string> = {
  static_injector: '/icons/icon-static-injector.svg',
  firewall_patch: '/icons/icon-firewall-patch.svg',
  clock_drainer: '/icons/icon-trace-accelerator.svg',
  packet_sniffer: '/icons/icon-snoop-packet.svg',
  echo_decoy: '/icons/icon-false-flag-echo.svg',
  parity_jammer: '/icons/tool-parity-jammer.svg',
  key_latch_virus: '/icons/tool-key-latch-virus.svg',
  logic_bomb: '/icons/tool-logic-bomb.svg',
  mirror_daemon: '/icons/tool-mirror-daemon.svg',
  // Legacy aliases
  'tool-static-injector': '/icons/icon-static-injector.svg',
  'tool-firewall-patch': '/icons/icon-firewall-patch.svg',
  'tool-blackout-ping': '/icons/icon-blackout-ping.svg',
  'tool-trace-accelerator': '/icons/icon-trace-accelerator.svg',
  'tool-snoop-packet': '/icons/icon-snoop-packet.svg',
  'tool-false-flag-echo': '/icons/icon-false-flag-echo.svg',
};

export function SabotageBar({
  duelId: propDuelId,
  playerCredits: propPlayerCredits,
  shieldActive: _propShieldActive,
  disabled: propDisabled,
  onSabotageResult: propOnSabotageResult,
}: SabotageBarProps = {}) {
  const { activeSession, useSabotage, sabotageFeedback, clearSabotageFeedback, isLoading } =
    useDuelStore();
  const { credits: storeCredits } = usePlayerStore();

  const [inspectMode, setInspectMode] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<SabotageToolRule | null>(null);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const effectiveCredits = propPlayerCredits !== undefined ? propPlayerCredits : storeCredits;
  const effectiveSession = activeSession;

  if (!effectiveSession && !propDuelId) {
    return null;
  }

  const tools = [
    SABOTAGE_RULES['tool-static-injector'] || SABOTAGE_TOOL_CATALOG.static_injector,
    SABOTAGE_RULES['tool-firewall-patch'] || SABOTAGE_TOOL_CATALOG.firewall_patch,
    SABOTAGE_RULES['tool-blackout-ping'],
    SABOTAGE_RULES['tool-trace-accelerator'],
    SABOTAGE_TOOL_CATALOG.parity_jammer,
    SABOTAGE_TOOL_CATALOG.key_latch_virus,
    SABOTAGE_TOOL_CATALOG.logic_bomb,
    SABOTAGE_TOOL_CATALOG.mirror_daemon,
  ].filter(Boolean) as SabotageToolRule[];

  const handleFireTool = async (tool: SabotageToolRule) => {
    setSelectedTool(null);
    if (propDuelId && propOnSabotageResult) {
      try {
        const res = await duelService.useSabotage(propDuelId, tool.id);
        setLocalFeedback(res.message);
        propOnSabotageResult(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sabotage failed';
        setLocalFeedback(msg);
        propOnSabotageResult({
          success: false,
          shielded: false,
          remainingCredits: effectiveCredits,
          message: msg,
        });
      }
    } else {
      useSabotage(tool.id);
    }
  };

  const handleToolClick = (tool: SabotageToolRule) => {
    if (inspectMode) {
      setSelectedTool(tool);
    } else {
      handleFireTool(tool);
    }
  };

  return (
    <section
      aria-label="Sabotage Deck"
      className="w-full bg-panel border-t border-line p-3 flex flex-col gap-2.5 transition-all"
    >
      {/* Sabotage Header with controls info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="font-data text-[10px] tracking-widest text-ink uppercase font-bold">
            SABOTAGE PROTOCOLS // OFFENSIVE COUNTERMEASURES
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Inspect Mode Toggle (Minimum 44x44px target) */}
          <Button
            variant={inspectMode ? 'primary' : 'secondary'}
            onClick={() => setInspectMode(!inspectMode)}
            aria-label="Toggle Sabotage Inspect Mode"
            data-testid="sabotage-inspect-toggle"
            className="w-11 h-11 min-w-[44px] min-h-[44px] p-0 flex items-center justify-center font-data text-xs font-bold"
          >
            {inspectMode ? '[x]' : '[?]'}
          </Button>
          <div className="font-data text-xs text-money-text font-bold">
            BALANCE: {effectiveCredits.toLocaleString()} CR
          </div>
        </div>
      </div>

      {/* Sabotage Feedback Banner */}
      {(sabotageFeedback || localFeedback) && (
        <div
          role="status"
          data-testid="sabotage-feedback"
          className={`px-3 py-1.5 rounded-sm border text-xs font-data flex items-center justify-between ${
            sabotageFeedback?.type === 'shielded'
              ? 'bg-amber-100/90 border-amber-400 text-amber-900'
              : sabotageFeedback?.type === 'error'
              ? 'bg-danger/10 border-danger text-danger-text'
              : 'bg-accent/10 border-accent text-accent-text'
          }`}
        >
          <span className="font-semibold">{localFeedback || sabotageFeedback?.message}</span>
          <Button
            variant="icon"
            compact
            onClick={() => {
              setLocalFeedback(null);
              clearSabotageFeedback();
            }}
            aria-label="Dismiss sabotage notice"
            className="ml-2 text-ink-muted text-sm p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}

      {/* Tactical Spec Plate Modal (When a tool is inspected) */}
      {selectedTool && (
        <div
          role="dialog"
          aria-labelledby="spec-plate-title"
          data-testid="tactical-spec-plate"
          className="p-3 bg-panel-light border border-accent rounded flex flex-col gap-2 font-data"
        >
          <div className="flex items-center justify-between border-b border-line pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-accent" />
              <h4 id="spec-plate-title" className="font-bold text-ink text-sm uppercase">
                {selectedTool.name} — {selectedTool.creditCost} CR
              </h4>
            </div>
            <Button
              variant="icon"
              compact
              onClick={() => setSelectedTool(null)}
              aria-label="Close Tactical Spec Plate"
              className="text-ink-muted hover:text-ink w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              [CLOSE]
            </Button>
          </div>

          <div className="text-xs text-ink space-y-1">
            <p>
              <strong className="text-ink-muted uppercase tracking-wider text-[10px]">Effect: </strong>
              {selectedTool.description}
            </p>
            <p className="bg-panel p-2 rounded border border-line/60">
              <strong className="text-accent-text uppercase tracking-wider text-[10px] block mb-0.5">Nix Tactical Intel:</strong>
              &ldquo;{selectedTool.nixExplanation}&rdquo;
            </p>
            <p className="bg-panel p-2 rounded border border-line/60">
              <strong className="text-money-text uppercase tracking-wider text-[10px] block mb-0.5">When to Use / Counter-Play:</strong>
              {selectedTool.counterPlayTip}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-line">
            <Button
              variant="secondary"
              onClick={() => setSelectedTool(null)}
              className="min-h-[44px] px-3 font-data text-xs"
            >
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={() => handleFireTool(selectedTool)}
              disabled={effectiveCredits < selectedTool.creditCost || isLoading || propDisabled}
              data-testid="spec-plate-fire-btn"
              className="min-h-[44px] px-4 font-data text-xs font-bold"
            >
              FIRE TOOL ({selectedTool.creditCost} CR)
            </Button>
          </div>
        </div>
      )}

      {/* Sabotage Tool Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {tools.map((tool) => {
          const canAfford = effectiveCredits >= tool.creditCost;
          const shortfall = tool.creditCost - effectiveCredits;
          const iconPath = SABOTAGE_ICONS[tool.id];

          const testId = tool.id.startsWith('tool-')
            ? `sabotage-${tool.id}`
            : `sabotage-tool-${tool.id.replace(/_/g, '-')}`;

          return (
            <Button
              key={tool.id}
              variant="secondary"
              onClick={() => handleToolClick(tool)}
              disabled={(!inspectMode && !canAfford) || isLoading || propDisabled}
              aria-label={`${inspectMode ? 'Inspect' : 'Activate'} ${tool.name} for ${tool.creditCost} credits`}
              data-testid={testId}
              className={`min-h-[56px] p-2 text-left flex flex-col justify-between normal-case tracking-normal items-start ${
                inspectMode
                  ? 'border-accent bg-accent/5 hover:border-accent'
                  : canAfford
                  ? 'hover:border-accent hover:shadow-card'
                  : 'bg-panel/40 border-line/40 opacity-55'
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {iconPath && (
                    <div className="w-5 h-5 rounded bg-panel-light border border-line/60 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={iconPath}
                        alt={tool.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <span className="font-data text-[11px] font-bold text-ink truncate">
                    {tool.name}
                  </span>
                </div>
                <span
                  className={`font-data text-[10px] font-bold shrink-0 ${
                    canAfford ? 'text-money-text' : 'text-danger-text'
                  }`}
                >
                  {tool.creditCost} CR
                </span>
              </div>

              <div className="mt-1 text-[10px] font-data text-ink-muted leading-tight line-clamp-1">
                {inspectMode ? '[TAP TO INSPECT]' : tool.description}
              </div>

              {!canAfford && !inspectMode && (
                <div className="mt-0.5 text-[9px] font-data text-danger-text font-bold">
                  NEED +{shortfall} CR
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
