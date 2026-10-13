import React from 'react';

export interface DistrictLabelProps {
  name: string;
  count?: number;
  status?: string;
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const DistrictLabel: React.FC<DistrictLabelProps> = ({
  name,
  x,
  y,
  style,
  className = '',
}) => {
  const positioningStyle: React.CSSProperties =
    x !== undefined && y !== undefined
      ? {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
        }
      : {};

  return (
    <div
      data-testid="district-label"
      className={`font-heading uppercase text-[16px] text-ink tracking-[1px] bg-panel-light/75 rounded-pill py-[4px] px-[12px] max-w-[200px] truncate inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        backgroundColor: 'rgba(239, 231, 218, 0.75)',
        ...positioningStyle,
        ...style,
      }}
      title={name}
    >
      <span className="truncate">{name}</span>
    </div>
  );
};

