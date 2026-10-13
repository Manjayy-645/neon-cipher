import React from 'react';
import { Button } from '@/components/ui/Button';

export interface ClusterBadgeProps {
  districtName: string;
  nodeCount: number;
  contestedCount?: number;
  isLocked?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ClusterBadge: React.FC<ClusterBadgeProps> = ({
  districtName,
  nodeCount,
  contestedCount = 0,
  isLocked = false,
  onClick,
  className = '',
  style,
}) => {
  const ariaLabel = isLocked
    ? `${districtName} cluster, locked`
    : `${districtName} cluster, ${nodeCount} nodes${contestedCount > 0 ? `, ${contestedCount} contested` : ''}`;

  return (
    <Button
      variant="secondary"
      data-testid="cluster-badge"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`rounded-md shadow-card px-[14px] py-[10px] min-w-[44px] flex flex-col items-center justify-center select-none text-center normal-case tracking-normal ${className}`}
      style={style}
    >
      <div className="font-heading text-[16px] text-ink leading-tight">
        {districtName}
      </div>
      <div className="font-data text-[12px] leading-tight mt-0.5">
        {isLocked ? (
          <span className="text-ink-muted">locked</span>
        ) : (
          <>
            <span className="text-ink">{nodeCount} nodes</span>
            {contestedCount > 0 && (
              <span className="text-danger-text">, {contestedCount} contested</span>
            )}
          </>
        )}
      </div>
    </Button>
  );
};
