'use client';

import React from 'react';

export default function Tier3CorporateSkin() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden">
      {/* Sleek Anodized Top Rail with laser etching */}
      <div className="w-full bg-[var(--terminal-bg,#111613)] border-b border-[var(--terminal-line,#243328)] px-3 py-1 flex items-center justify-between text-[10px] font-data">
        <div className="flex items-center gap-2">
          {/* Aeris logo geometric SVG */}
          <svg width="14" height="14" viewBox="0 0 14 14" className="text-accent">
            <polygon points="7,1 13,11 1,11" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="7" cy="8" r="1.5" fill="currentColor" />
          </svg>
          <span className="font-bold tracking-widest text-accent text-[11px]">AERIS NETWORKS</span>
          <span className="text-accent-text text-[9px]">WS-9 // UID: AC-9941-X</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-accent-text uppercase tracking-widest">ENCLAVE SEC-3</span>
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="w-full bg-[var(--terminal-panel,#0d120f)] border-t border-[var(--terminal-line,#243328)] px-3 py-0.5 flex items-center justify-between text-[9px] font-data text-accent-text">
        <span className="tracking-wider uppercase">RESTRICTED EXECUTIVE TERMINAL</span>
        <span className="tracking-widest opacity-80">STENCIL: [CLEARANCE A-7 REQUIRED]</span>
      </div>
    </div>
  );
}
