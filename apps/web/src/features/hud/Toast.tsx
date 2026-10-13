'use client';

import React from 'react';
import { useMapStore } from '../../stores/map-store';

export const Toast: React.FC = () => {
  const { toastMessage } = useMapStore() as any;

  return (
    <div 
      className={`absolute left-1/2 -translate-x-1/2 top-[70px] z-50 bg-ink text-cream px-4 py-2 rounded-sm shadow-card text-[12px] font-medium max-w-[80%] text-center transition-opacity duration-300 ${
        toastMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {toastMessage}
    </div>
  );
};
