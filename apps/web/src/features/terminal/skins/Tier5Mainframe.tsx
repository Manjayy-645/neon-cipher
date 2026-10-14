'use client';

import React from 'react';

export interface SkinProps {
  nodeName?: string;
  nodeType?: string;
}

export default function Tier5MainframeSkin({ nodeName, nodeType }: SkinProps = {}) {
  const displayTitle = nodeName ? nodeName.toUpperCase() : 'NULL-ZERO COMPUTING';
  const typeTag = nodeType ? nodeType.toUpperCase() : 'MAINFRAME';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden terminal-chassis-trim">
      {/* Supercomputer Head Rail with Phosphor Bus LED Traces */}
      <div className="w-full bg-[var(--terminal-bg,#060807)] border-b border-accent/40 px-3 py-1 flex items-center justify-between text-[10px] font-data">
        <div className="flex items-center gap-2">
          {/* Quantum Matrix Cube SVG */}
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-accent animate-pulse">
            <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="0.8" />
            <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="0.8" />
          </svg>
          <span className="font-bold tracking-widest text-accent text-[11px]">NULL-ZERO COMPUTING</span>
          <span className="text-accent-text text-[9px]">{nodeType ? `BLADE: NZ-CORE-001X // ${typeTag}` : 'BLADE: NZ-CORE-001X'}</span>
        </div>

        {/* Phosphor Optical Activity Bar */}
        <div className="flex items-center gap-1">
          <span className="w-1 h-2 bg-accent rounded-sm" />
          <span className="w-1 h-2 bg-accent/80 rounded-sm" />
          <span className="w-1 h-2 bg-accent/50 rounded-sm" />
          <span className="w-1 h-2 bg-accent/20 rounded-sm" />
          <span className="text-[9px] text-accent tracking-widest font-bold ml-1">4.2K CRYO</span>
        </div>
      </div>

      {/* Bottom Mainframe Bus Chassis Label */}
      <div className="w-full bg-[var(--terminal-panel,#040504)] border-t border-accent/30 px-3 py-0.5 flex items-center justify-between text-[9px] font-data text-accent-text">
        <span className="tracking-widest uppercase font-semibold text-accent/80">
          STENCIL: [OPTICAL BACKPLANE PRIMARY BUS ONLINE]
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-accent/60 uppercase">NEURAL INTERCONNECT 100Tb/s</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}
