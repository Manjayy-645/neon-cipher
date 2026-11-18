'use client';

import React from 'react';
import { RigHardwareItem } from '@/app/api/mock/db';
import { CATALOG, getItemIcon } from '../market/catalog';
import { Button } from '@/components/ui/Button';

interface CyberdeckSchematicProps {
  hardware: Record<string, RigHardwareItem>;
  equippedRails?: Partial<Record<string, string | null>>;
  equippedTools: string[];
  onSelectSlot: (slotId: string) => void;
  selectedSlotId: string | null;
}

export const CyberdeckSchematic: React.FC<CyberdeckSchematicProps> = ({
  hardware,
  equippedRails,
  equippedTools,
  onSelectSlot,
  selectedSlotId,
}) => {
  // Resolve equipped or fallback hardware for each of the 4 rails
  const r1Id = equippedRails?.memory_1 || (hardware['neural_reflex_cap']?.installed ? 'neural_reflex_cap' : hardware['memory_buffer_mk1']?.installed ? 'memory_buffer_mk1' : hardware['rig-memory-buffer-1']?.installed ? 'rig-memory-buffer-1' : 'rig-memory-buffer-1');
  const mb1 = hardware[r1Id] || hardware['memory_buffer_mk1'] || hardware['rig-memory-buffer-1'];

  const r2Id = equippedRails?.memory_2 || (hardware['syndicate_skimmer']?.installed ? 'syndicate_skimmer' : hardware['memory_buffer_mk2']?.installed ? 'memory_buffer_mk2' : hardware['rig-memory-buffer-2']?.installed ? 'rig-memory-buffer-2' : 'rig-memory-buffer-2');
  const mb2 = hardware[r2Id] || hardware['memory_buffer_mk2'] || hardware['rig-memory-buffer-2'];

  const r3Id = equippedRails?.coprocessor || (hardware['parity_scanner_asic']?.installed ? 'parity_scanner_asic' : hardware['heuristic_coproc']?.installed ? 'heuristic_coproc' : hardware['rig-heuristic-coprocessor']?.installed ? 'rig-heuristic-coprocessor' : 'rig-heuristic-coprocessor');
  const coproc = hardware[r3Id] || hardware['heuristic_coproc'] || hardware['rig-heuristic-coprocessor'];

  const r4Id = equippedRails?.bus_interconnect || (hardware['lead_shielded_chassis']?.installed ? 'lead_shielded_chassis' : hardware['overclocked_quartz_bus']?.installed ? 'overclocked_quartz_bus' : 'overclocked_quartz_bus');
  const busItem = hardware[r4Id] || hardware['overclocked_quartz_bus'] || hardware['lead_shielded_chassis'];

  const tool1 = CATALOG.find((it) => it.id === equippedTools[0]);
  const tool2 = CATALOG.find((it) => it.id === equippedTools[1]);

  const getSlotTitle = (item?: RigHardwareItem, defaultTitle: string = '') => {
    if (!item) return defaultTitle;
    if (item.id === 'rig-memory-buffer-1' || item.id === 'memory_buffer_mk1') {
      return 'MEM BUFFER MK I';
    }
    if (item.id === 'rig-memory-buffer-2' || item.id === 'memory_buffer_mk2') {
      return 'MEM BUFFER MK II';
    }
    if (item.id === 'rig-heuristic-coprocessor' || item.id === 'heuristic_coproc') {
      return 'HEURISTIC CO-PROCESSOR';
    }
    return item.name.toUpperCase();
  };

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Cyberdeck Schematic SVG Blueprint */}
      <div className="scene-card w-full bg-panel-light border border-line rounded-md p-4 shadow-card relative overflow-hidden">

        {/* Chassis Header */}
        <div className="flex justify-between items-center border-b border-ink-muted/40 pb-2 mb-3 text-[10px] font-data text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-bold text-accent-text tracking-widest uppercase">
              FIELD RIG // 4-RAIL CYBERDECK CHASSIS
            </span>
          </div>
          <span className="opacity-70">BUS FREQ: 800MHz</span>
        </div>

        {/* Schematic Layout Grid */}
        <div className="grid grid-cols-2 gap-3 relative z-10 font-data">
          {/* Rail 1: Memory Rail 1 */}
          <HardwareSlotCard
            title={getSlotTitle(mb1, 'MEM BUFFER MK I')}
            railLabel="RAIL 1 // MEMORY"
            item={mb1}
            isSelected={selectedSlotId === mb1?.id || selectedSlotId === 'rig-memory-buffer-1' || selectedSlotId === 'memory_buffer_mk1'}
            onClick={() => onSelectSlot(mb1?.id || 'rig-memory-buffer-1')}
            tier="T1 / T2"
            subtitle={mb1?.installed ? (mb1.tradeOff ? `${mb1.effect}` : '+1 Extra Probe') : 'Slot Available'}
            icon={mb1?.id ? (mb1.id.includes('neural') ? '/icons/icon-trace-accelerator.svg' : '/icons/icon-memory-buffer.svg') : '/icons/icon-memory-buffer.svg'}
          />

          {/* Rail 2: Memory Rail 2 */}
          <HardwareSlotCard
            title={getSlotTitle(mb2, 'MEM BUFFER MK II')}
            railLabel="RAIL 2 // MEMORY"
            item={mb2}
            isSelected={selectedSlotId === mb2?.id || selectedSlotId === 'rig-memory-buffer-2' || selectedSlotId === 'memory_buffer_mk2'}
            onClick={() => onSelectSlot(mb2?.id || 'rig-memory-buffer-2')}
            tier="T3 / T4"
            subtitle={mb2?.installed ? (mb2.tradeOff ? `${mb2.effect}` : '+1 Extra Probe') : 'Slot Available'}
            icon={mb2?.id ? (mb2.id.includes('skimmer') ? '/icons/icon-syndicate-skimmer.svg' : '/icons/icon-memory-buffer.svg') : '/icons/icon-memory-buffer.svg'}
          />

          {/* Rail 3: Co-Processor Socket */}
          <HardwareSlotCard
            title={getSlotTitle(coproc, 'HEURISTIC CO-PROCESSOR')}
            railLabel="SOCKET // CO-PROCESSOR"
            item={coproc}
            isSelected={selectedSlotId === coproc?.id || selectedSlotId === 'rig-heuristic-coprocessor' || selectedSlotId === 'heuristic_coproc'}
            onClick={() => onSelectSlot(coproc?.id || 'rig-heuristic-coprocessor')}
            subtitle={coproc?.installed ? coproc.effect : 'Slot Available'}
            icon={coproc?.id ? (coproc.id.includes('parity') ? '/icons/glyph-router.svg' : '/icons/icon-heuristic-coprocessor.svg') : '/icons/icon-heuristic-coprocessor.svg'}
          />

          {/* Rail 4: Bus Interconnect */}
          <HardwareSlotCard
            title={busItem?.name ? busItem.name.toUpperCase() : 'BUS INTERCONNECT'}
            railLabel="INTERCONNECT // BUS"
            item={busItem}
            isSelected={selectedSlotId === busItem?.id || selectedSlotId === 'overclocked_quartz_bus' || selectedSlotId === 'lead_shielded_chassis'}
            onClick={() => onSelectSlot(busItem?.id || 'overclocked_quartz_bus')}
            subtitle={busItem?.installed ? busItem.effect : 'Slot Available'}
            icon={busItem?.id ? (busItem.id.includes('lead') ? '/icons/icon-firewall-patch.svg' : '/icons/icon-stopwatch.svg') : '/icons/icon-stopwatch.svg'}
          />

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
  railLabel,
  item,
  isSelected,
  onClick,
  tier,
  subtitle,
  icon,
}: {
  title: string;
  railLabel?: string;
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
              {railLabel || (tier ? `BUS ${tier}` : 'CO-PROC RAIL')}
            </span>
            <h4
              className={`font-heading text-xs font-bold break-words ${
                isBurned ? 'text-danger-text' : isInstalled ? 'text-ink' : 'text-ink-muted'
              }`}
            >
              {!isInstalled && <span className="block text-ink-muted font-data text-xs">Empty slot</span>}
              <span className={!isInstalled ? 'text-[10px]' : ''}>{title}</span>
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
  tool?: { id?: string; name: string; effect: string; icon?: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const iconSrc = tool?.icon || (tool?.id ? getItemIcon(tool.id) : undefined);
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
        {iconSrc && (
          <div className="w-7 h-7 rounded bg-panel-dark/10 border border-line/60 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc} alt={tool?.name} className="w-full h-full object-contain" />
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
