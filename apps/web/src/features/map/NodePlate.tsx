'use client';

import React from 'react';
import { GameNode } from './nodeService';
import { MarkerIcon, MarkerIconSize } from '../../components/ui/MarkerIcon';

export { MarkerIcon };

export const NodePlate: React.FC<{
  node: GameNode;
  isLocked: boolean;
  isSelected: boolean;
  size?: MarkerIconSize;
}> = ({ node, isLocked, isSelected, size = 'md' }) => {
  return (
    <MarkerIcon
      size={size}
      node={node}
      isLocked={isLocked}
      isSelected={isSelected}
    />
  );
};
