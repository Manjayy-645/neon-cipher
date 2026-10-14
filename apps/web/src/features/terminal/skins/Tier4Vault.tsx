'use client';

import React from 'react';

export interface SkinProps {
  nodeName?: string;
  nodeType?: string;
}

export default function Tier4VaultSkin({ nodeName, nodeType }: SkinProps = {}) {
  const displayTitle = nodeName ? nodeName.toUpperCase() : 'AEGIS HEAVY DEFENSE';
  const typeTag = nodeType ? nodeType.toUpperCase() : 'SECURED VAULT';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden terminal-chassis-trim">
      {/* Heavy Steel Armor Top with Caution Hazard Stripes */}
      <div className="w-full bg-[var(--terminal-bg,#181a1d)] border-b-2 border-[var(--terminal-line,#2b3138)] px-3 py-1 flex items-center justify-between text-[10px] font-data">
        <div className="flex items-center gap-2">
          {/* Heavy Rivet SVG */}
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-ink-muted">
            <circle cx="6" cy="6" r="5" fill="var(--terminal-panel,#202429)" stroke="currentColor" strokeWidth="1" />
            <circle cx="5" cy="5" r="1.5" fill="var(--line)" />
          </svg>
          <span className="font-bold tracking-wider text-ink-on-dark">AEGIS HEAVY DEFENSE</span>
          <span className="text-[9px] text-ink-muted">{typeTag}</span>
        </div>

        {/* Hazard diagonal stripes SVG */}
        <div className="flex items-center gap-1.5">
          <svg width="36" height="10" className="opacity-80">
            <defs>
              <pattern id="hazard-pattern" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--money)" strokeWidth="3" />
                <line x1="3" y1="0" x2="3" y2="6" stroke="var(--terminal-bg,#111)" strokeWidth="3" />
              </pattern>
            </defs>
            <rect width="36" height="10" fill="url(#hazard-pattern)" rx="2" />
          </svg>
          <span className="text-[9px] font-bold text-money-text tracking-wider">CLASS-4</span>
        </div>
      </div>

      {/* Hydraulic Seal Indicators on sides */}
      <div className="absolute top-1/2 left-0.5 -translate-y-1/2 flex flex-col gap-1">
        <div className="w-1 h-3 bg-danger/70 rounded-full" />
        <div className="w-1 h-3 bg-danger/40 rounded-full" />
        <div className="w-1 h-3 bg-danger/20 rounded-full" />
      </div>
      <div className="absolute top-1/2 right-0.5 -translate-y-1/2 flex flex-col gap-1">
        <div className="w-1 h-3 bg-danger/70 rounded-full" />
        <div className="w-1 h-3 bg-danger/40 rounded-full" />
        <div className="w-1 h-3 bg-danger/20 rounded-full" />
      </div>

      {/* Bottom Industrial Stencil */}
      <div className="w-full bg-[var(--terminal-panel,#131518)] border-t-2 border-[var(--terminal-line,#2b3138)] px-3 py-0.5 flex items-center justify-between text-[9px] font-data text-ink-muted">
        <span className="tracking-widest uppercase font-bold text-ink-on-dark">
          STENCIL: [HYDRAULIC DOGS ENGAGED - DO NOT PRY]
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-danger animate-ping" />
          <span className="text-[8px] text-danger-text uppercase font-bold">ARMED</span>
        </div>
      </div>
    </div>
  );
}
