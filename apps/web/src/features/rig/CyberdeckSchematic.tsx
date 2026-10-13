'use client';

import React from 'react';
import { RigHardwareItem } from '@/app/api/mock/db';
import { CATALOG } from '../market/catalog';
import { Button } from '@/components/ui/Button';

interface CyberdeckSchematicProps {
  hardware: Record<string, RigHardwareItem>;
  equippedTools: string[];
  onSelectSlot: (slotId: string) => void;
  selectedSlotId: string | null;
}

export const CyberdeckSchematic: React.FC<CyberdeckSchematicProps> = ({
  hardware,
  equippedTools,
  onSelectSlot,
  selectedSlotId,
}) => {
  const mb1 = hardware['rig-memory-buffer-1'];
  const mb2 = hardware['rig-memory-buffer-2'];
  const coproc = hardware['rig-heuristic-coprocessor'];

  const tool1 = CATALOG.find((it) => it.id === equippedTools[0]);
  const tool2 = CATALOG.find((it) => it.id === equippedTools[1]);

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Cyberdeck Schematic SVG Blueprint */}
      <div className="scene-card w-full max-w-md bg-panel-light border border-line rounded-md p-4 shadow-card relative overflow-hidden">

        {/* Chassis Header */}
        <div className="flex justify-between items-center border-b border-ink-muted/40 pb-2 mb-3 text-[10px] font-data text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-bold text-accent-text tracking-widest uppercase">
              FIELD RIG // MERIDIAN-480
            </span>
          </div>
          <span className="opacity-70">BUS FREQ: 800MHz</span>
        </div>

        {/* Schematic Layout Grid */}
        <div className="grid grid-cols-2 gap-3 relative z-10 font-data">
          {/* Slot 1: Memory Buffer Mk I */}
          <HardwareSlotCard
            title="MEM BUFFER MK I"
            item={mb1}
            isSelected={selectedSlotId === 'rig-memory-buffer-1'}
            onClick={() => onSelectSlot('rig-memory-buffer-1')}
            tier="T1 / T2"
            icon="/icons/icon-memory-buffer.svg"
          />

          {/* Slot 2: Memory Buffer Mk II */}
          <HardwareSlotCard
            title="MEM BUFFER MK II"
            item={mb2}
            isSelected={selectedSlotId === 'rig-memory-buffer-2'}
            onClick={() => onSelectSlot('rig-memory-buffer-2')}
            tier="T3 / T4"
            icon="/icons/icon-memory-buffer.svg"
          />

          {/* Slot 3: Heuristic Co-Processor (Full Width) */}
          <div className="col-span-2">
            <HardwareSlotCard
              title="HEURISTIC CO-PROCESSOR"
              item={coproc}
              isSelected={selectedSlotId === 'rig-heuristic-coprocessor'}
              onClick={() => onSelectSlot('rig-heuristic-coprocessor')}
              subtitle="Carrier Wave Filter // 2 Digits Pre-Removed"
              icon="/icons/icon-heuristic-coprocessor.svg"
            />
          </div>

          {/* Tool Bay 1 */}
          <ToolSlotCard
            slotNumber={1}
            tool={tool1}
            isSelected={selectedSlotId === 'tool-slot-1'}
            onClick={() => onSelectSlot('tool-slot-1')}
          />

          {/* Tool Bay 2 */}
          <ToolSlotCard
            slotNumber={2}
            tool={tool2}
            isSelected={selectedSlotId === 'tool-slot-2'}
            onClick={() => onSelectSlot('tool-slot-2')}
          />
        </div>

        {/* Chassis Footer Status */}
        <div className="mt-3 pt-2 border-t border-ink-muted/30 flex justify-between items-center text-[9px] font-data text-ink-muted/80">
          <span>COOLING: PASSIVE HEATSINK</span>
          <span className="text-accent uppercase tracking-wider">
            TAP PART TO INSPECT / REPAIR
          </span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   Hardware Slot Component
   ========================================================================= */
function HardwareSlotCard({
  title,
  item,
  isSelected,
  onClick,
  tier,
  subtitle,
  icon,
}: {
  title: string;
  item?: RigHardwareItem;
  isSelected: boolean;
  onClick: () => void;
  tier?: string;
  subtitle?: string;
  icon?: string;
}) {
  const isInstalled = item?.installed;
  const isBurned = item?.burned;

  return (
    <Button
      variant="ghost"
      fullWidth
      onClick={onClick}
      className={`w-full text-left p-3 !rounded-md border-2 transition-all flex flex-col justify-between min-h-[85px] relative group outline-none normal-case tracking-normal !items-stretch ${
        isSelected
          ? 'ring-2 ring-accent !border-accent'
          : isBurned
          ? 'bg-danger/15 !border-danger/80'
          : isInstalled
          ? 'bg-panel !border-accent/70'
          : 'bg-panel !border-line opacity-75 hover:opacity-100'
      }`}
    >
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="w-8 h-8 rounded bg-panel-dark/10 border border-line/60 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt={title} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[9px] text-ink-muted uppercase tracking-wider block">
              {tier ? `BUS ${tier}` : 'CO-PROC RAIL'}
            </span>
            <h4
              className={`font-heading text-xs font-bold truncate ${
                isBurned ? 'text-danger-text' : isInstalled ? 'text-ink' : 'text-ink-muted'
              }`}
            >
              {title}
            </h4>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isBurned ? (
            <span className="bg-danger/30 text-danger-text border border-danger/60 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider animate-pulse">
              BURNED
            </span>
          ) : isInstalled ? (
            <span className="bg-accent/15 text-accent-text border border-accent/40 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider">
              ONLINE
            </span>
          ) : (
            <span className="bg-ink/20 text-ink-muted border border-ink-muted/30 px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider">
              EMPTY
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-between items-end w-full text-[9px]">
        <span className="text-ink-muted truncate max-w-[140px]">
          {subtitle || (isInstalled ? '+1 Extra Probe' : 'Slot Available')}
        </span>
        {isBurned && (
          <span className="text-danger-text font-bold text-[9px] underline">
            Repair (${item.repairCost})
          </span>
        )}
      </div>
    </Button>
  );
}

/* =========================================================================
   Tool Slot Component
   ========================================================================= */
function ToolSlotCard({
  slotNumber,
  tool,
  isSelected,
  onClick,
}: {
  slotNumber: number;
  tool?: { name: string; effect: string; icon?: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      fullWidth
      onClick={onClick}
      className={`w-full text-left p-3 !rounded-md border-2 transition-all flex flex-col justify-between min-h-[75px] outline-none normal-case tracking-normal !items-stretch ${
        isSelected
          ? 'ring-2 ring-accent !border-accent'
          : tool
          ? 'bg-panel !border-accent/50'
          : 'bg-panel border-dashed border-ink-muted/50 opacity-70 hover:opacity-100'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-[9px] text-ink-muted uppercase tracking-wider">
          TOOL BAY {slotNumber}
        </span>
        <span
          className={`text-[8px] px-1.5 py-0.2 rounded uppercase font-bold ${
            tool
              ? 'bg-money/20 text-money-text border border-money/40'
              : 'text-ink-muted/60'
          }`}
        >
          {tool ? 'ARMED' : 'UNARMED'}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-2">
        {tool?.icon && (
          <div className="w-7 h-7 rounded bg-panel-dark/10 border border-line/60 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-heading text-xs font-bold text-ink truncate">
            {tool ? tool.name : '[Empty Bay]'}
          </h4>
          <p className="text-[9px] text-ink-muted truncate">
            {tool ? tool.effect : 'Tap to arm sabotage tool'}
          </p>
        </div>
      </div>
    </Button>
  );
}
