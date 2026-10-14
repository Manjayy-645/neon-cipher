'use client';

import React from 'react';

export interface SkinProps {
  nodeName?: string;
  nodeType?: string;
}

export default function Tier1VendingSkin({ nodeName, nodeType }: SkinProps = {}) {
  const displayTitle = nodeName ? nodeName.toUpperCase() : 'KURA-TEK VEND-LINE';
  const typeTag = nodeType ? nodeType.toUpperCase() : 'VEND-LINE';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden">
      {/* Top Header Framing */}
      <div className="w-full bg-[var(--terminal-panel,#1c221e)] border-b border-[var(--terminal-line,#2d3a31)] px-3 py-1 flex items-center justify-between text-[10px] font-data text-ink-muted">
        <div className="flex items-center gap-2">
          {/* Plastic screw SVG */}
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-ink-muted">
            <circle cx="5" cy="5" r="4" fill="currentColor" />
            <line x1="2" y1="5" x2="8" y2="5" stroke="var(--terminal-bg,#1c221e)" strokeWidth="1" />
          </svg>
          <span className="font-bold tracking-wider text-accent-text">KURA-TEK VEND-LINE</span>
          <span className="opacity-60">{nodeType ? `SN: KT-09-8832-A // ${typeTag}` : 'SN: KT-09-8832-A'}</span>
        </div>
        <div className="bg-[var(--terminal-line,#2d3b2f)] text-accent-text px-1.5 py-0.2 rounded text-[9px] uppercase tracking-widest border border-accent/20">
          LCD-LOWRES 12V
        </div>
      </div>

      {/* Bottom Chassis Stencil */}
      <div className="w-full bg-[var(--terminal-bg,#181d19)] border-t border-[var(--terminal-line,#2d3a31)] px-3 py-0.5 flex items-center justify-between text-[9px] font-data text-ink-muted/80">
        <span className="tracking-widest uppercase">STENCIL: [MAINTENANCE BYPASS REF-44]</span>
        <div className="flex items-center gap-2">
          {/* Inspection sticker stamp */}
          <span className="border border-accent/30 text-accent-text px-1 text-[8px] rounded-sm">
            INSPECTED: PASS
          </span>
          {/* Screw */}
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-ink-muted">
            <circle cx="5" cy="5" r="4" fill="currentColor" />
            <line x1="5" y1="2" x2="5" y2="8" stroke="var(--terminal-bg,#1c221e)" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
