'use client';

import React from 'react';
import { GameNode, NodeType, NodeStatus, getGlyphForType } from '../../features/map/nodeService';
import { tokens } from '@neon-cipher/tokens';

export type MarkerIconSize = 'xs' | 'sm' | 'md' | 'lg';

export interface MarkerIconProps {
  size?: MarkerIconSize;
  node?: GameNode;
  type?: NodeType | string;
  status?: NodeStatus;
  isLocked?: boolean;
  isSelected?: boolean;
  className?: string;
}

export const MARKER_ICON_SIZES: Record<MarkerIconSize, { plate: number; glyph: number }> = {
  xs: { plate: 36, glyph: 18 },
  sm: { plate: 40, glyph: 20 },
  md: { plate: 52, glyph: 26 },
  lg: { plate: 64, glyph: 32 },
};

export const MarkerIcon: React.FC<MarkerIconProps> = ({
  size = 'md',
  node,
  type,
  status,
  isLocked,
  isSelected = false,
  className = '',
}) => {
  const nodeType = type ?? node?.type ?? 'atm';
  const nodeStatus = status ?? node?.status ?? 'available';
  const locked = isLocked ?? (node?.requiresUnlock ?? false);

  const { plate: plateSize, glyph: glyphSize } = MARKER_ICON_SIZES[size];

  // Token colors
  const cAccent = 'var(--accent, #426947)';
  const cInk = 'var(--ink, #37332E)';
  const cPanelLight = 'var(--surface-panel-light, #EFE7DA)';
  const cDanger = 'var(--danger, #A8593F)';
  const cCooldown = 'var(--status-cooldown, #6B645A)';
  const cHeatTrack = 'var(--heat-track, #CBBFAE)';

  let PlateShape: React.ReactNode = null;

  if (locked) {
    // locked: light gray fill with a lock glyph, 2px gray ring
    PlateShape = (
      <circle
        cx="26"
        cy="26"
        r="24.5"
        fill={cHeatTrack}
        stroke={cCooldown}
        strokeWidth="2"
      />
    );
  } else if (nodeStatus === 'available') {
    // available: surface.panelLight fill, 4px accent ring
    PlateShape = (
      <circle
        cx="26"
        cy="26"
        r="24"
        fill={cPanelLight}
        stroke={cAccent}
        strokeWidth="4"
      />
    );
  } else if (nodeStatus === 'owned') {
    // owned: accent fill, cream glyph, 2px ink outline
    PlateShape = (
      <circle
        cx="26"
        cy="26"
        r="25"
        fill={cAccent}
        stroke={cInk}
        strokeWidth="2"
      />
    );
  } else if (nodeStatus === 'contested') {
    // contested: panelLight fill, 4px danger ring, DIAMOND shape (rounded square rotated 45 degrees, radius 6)
    PlateShape = (
      <rect
        x="9"
        y="9"
        width="34"
        height="34"
        rx="6"
        ry="6"
        fill={cPanelLight}
        stroke={cDanger}
        strokeWidth="4"
        transform="rotate(45 26 26)"
      />
    );
  } else if (nodeStatus === 'cooldown') {
    // cooldown: light warm gray fill, 3px gray ring
    PlateShape = (
      <circle
        cx="26"
        cy="26"
        r="24.5"
        fill={cHeatTrack}
        stroke={cCooldown}
        strokeWidth="3"
      />
    );
  }

  const iconName = getGlyphForType(nodeType);
  const isCreamGlyph = !locked && nodeStatus === 'owned';

  // Selected: soft green glow (0 0 5px accent at 95 percent)
  // Shadow: 0 1px 1px rgba(40,30,20,0.45) only
  const shadowFilter = isSelected && !locked
    ? 'drop-shadow(0 1px 1px rgba(40,30,20,0.45)) drop-shadow(0 0 5px rgba(66,105,71,0.95))'
    : 'drop-shadow(0 1px 1px rgba(40,30,20,0.45))';

  return (
    <div
      data-testid="marker-icon"
      data-status={locked ? 'locked' : nodeStatus}
      className={`relative flex items-center justify-center shrink-0 rounded-full ${
        locked ? 'opacity-80' : ''
      } ${className}`}
      style={{
        width: `${plateSize}px`,
        height: `${plateSize}px`,
        filter: shadowFilter,
      }}
    >
      <svg
        width={plateSize}
        height={plateSize}
        viewBox="0 0 52 52"
        className="absolute inset-0 block pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {PlateShape}
      </svg>
      {locked ? (
        <svg
          data-testid="lock-glyph"
          viewBox="0 0 24 24"
          width={glyphSize}
          height={glyphSize}
          fill="none"
          stroke={cInk}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10 pointer-events-none"
          aria-hidden="true"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/icons/${iconName}.svg`}
          alt={iconName}
          className="relative z-10 pointer-events-none"
          style={{
            width: `${glyphSize}px`,
            height: `${glyphSize}px`,
            objectFit: 'contain',
            filter: isCreamGlyph
              ? 'brightness(0) invert(93%) sepia(10%) saturate(300%)'
              : undefined,
          }}
        />
      )}
    </div>
  );
};
