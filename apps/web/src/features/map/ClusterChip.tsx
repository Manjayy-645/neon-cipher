'use client';

import React from 'react';
import { getNodes } from './nodeService';
import { Button } from '@/components/ui/Button';

export interface ClusterChipProps {
  onClick?: () => void;
  className?: string;
}

export const ClusterChip: React.FC<ClusterChipProps> = ({ onClick, className = '' }) => {
  const nodes = getNodes();
  const totalNodes = nodes.length;
  const contestedNodes = nodes.filter((n) => n.status === 'contested').length;

  const ariaLabel = `${totalNodes} nodes, ${contestedNodes} contested`;

  return (
    <div className={`absolute top-[12px] left-[12px] z-20 ${className}`}>
      <Button
        variant="secondary"
        compact
        onClick={onClick}
        aria-label={ariaLabel}
        data-testid="top-left-chip"
        className="rounded-md shadow-card px-[12px] py-[8px] min-w-[44px] text-[12px] font-data flex items-center gap-[12px] select-none normal-case tracking-normal"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-ink-muted"
          aria-hidden="true"
        >
          <circle cx="8" cy="4" r="2" />
          <circle cx="3.5" cy="12" r="2" />
          <circle cx="12.5" cy="12" r="2" />
          <path d="M8 6v3M8 9l-3 1.5M8 9l3 1.5" />
        </svg>

        <span className="flex flex-col items-start leading-tight">
          <span className="font-heading text-[16px] text-ink">City grid</span>
          <span className="font-data text-[12px] leading-tight mt-0.5">
            <span className="font-medium text-ink">{totalNodes} nodes</span>
            {contestedNodes > 0 && (
              <span className="font-semibold text-danger-text">, {contestedNodes} contested</span>
            )}
          </span>
        </span>
      </Button>
    </div>
  );
};
