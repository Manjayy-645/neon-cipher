'use client';

import React from 'react';

export interface SkinProps {
  nodeName?: string;
  nodeType?: string;
}

export default function Tier2AtmSkin({ nodeName, nodeType }: SkinProps = {}) {
  const displayTitle = nodeName ? nodeName.toUpperCase() : 'MERIDIAN COMMERCE // MK-II';
  const typeTag = nodeType ? nodeType.toUpperCase() : 'REGISTER // ATM';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden terminal-chassis-trim">
      {/* Top Metallic Bezel */}
      <div className="w-full bg-[var(--terminal-panel,#24292e)] border-b-2 border-[var(--terminal-line,#3d454e)] px-3 py-1 flex items-center justify-between text-[10px] font-data text-ink-muted">
        <div className="flex items-center gap-2">
          {/* Hex Security Bolt SVG */}
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-ink-muted">
            <polygon points="6,1 11,3.5 11,8.5 6,11 1,8.5 1,3.5" fill="currentColor" stroke="var(--terminal-bg,#1c2024)" strokeWidth="0.5" />
            <circle cx="6" cy="6" r="2" fill="var(--terminal-bg,#1c2024)" />
          </svg>
          <span className="font-bold tracking-wider text-ink-on-dark">MERIDIAN COMMERCE // MK-II</span>
          <span className="text-[9px] opacity-70">{nodeType ? `REG-ID: MCS-501-REV9 // ${typeTag}` : 'REG-ID: MCS-501-REV9'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[9px] text-accent-text tracking-wider">NET: LINKED</span>
        </div>
      </div>

      {/* Corner brackets SVG */}
      <div className="absolute top-7 left-1 w-4 h-4 border-l border-t border-[var(--terminal-line)]/60" />
      <div className="absolute top-7 right-1 w-4 h-4 border-r border-t border-[var(--terminal-line)]/60" />

      {/* Bottom Stencil with Tamper Seal */}
      <div className="w-full bg-[var(--terminal-bg,#1c2024)] border-t-2 border-[var(--terminal-line,#3d454e)] px-3 py-0.5 flex items-center justify-between text-[9px] font-data text-ink-muted">
        <span className="tracking-widest uppercase text-ink-muted">INTERLOCK: ENCRYPTED PINPAD</span>
        <div className="flex items-center gap-2">
          {/* Tamper seal badge */}
          <div className="bg-danger/20 border border-danger/60 text-danger-text px-1.5 py-0.2 rounded-sm text-[8px] font-bold tracking-widest uppercase">
            TAMPER SEAL INTACT
          </div>
          {/* Hex Bolt */}
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-ink-muted">
            <polygon points="6,1 11,3.5 11,8.5 6,11 1,8.5 1,3.5" fill="currentColor" stroke="var(--terminal-bg,#1c2024)" strokeWidth="0.5" />
            <circle cx="6" cy="6" r="2" fill="var(--terminal-bg,#1c2024)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
