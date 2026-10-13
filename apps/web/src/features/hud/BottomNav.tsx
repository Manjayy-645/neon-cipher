import React from 'react';
import { Button } from '@/components/ui/Button';

const ICONS: Record<string, string> = {
  map: '/icons/nav-map.svg',
  rig: '/icons/nav-rig.svg',
  market: '/icons/nav-market.svg',
  comms: '/icons/nav-comms.svg',
  duel: '/icons/nav-duel.svg',
};

export const BottomNav: React.FC = () => {
  const tabs = [
    { id: 'map', label: 'MAP', active: true },
    { id: 'rig', label: 'RIG', active: false },
    { id: 'market', label: 'MARKET', active: false },
    { id: 'comms', label: 'COMMS', active: false },
    { id: 'duel', label: 'DUEL', active: false },
  ];

  return (
    <nav className="h-16 bg-panel border-t border-line flex items-center justify-around px-2 z-20 shrink-0">
      {tabs.map(tab => (
        <Button
          key={tab.id}
          variant={tab.active ? 'primary' : 'ghost'}
          className={`flex flex-col items-center justify-center w-14 h-12 !min-h-[44px] !p-0 border-0 ${
            tab.active ? 'bg-accent text-white my-1' : 'bg-transparent text-ink/60 hover:text-ink/90'
          }`}
          aria-label={tab.label}
        >
          <img
            src={ICONS[tab.id]}
            alt=""
            className="w-[22px] h-[22px] mb-1 object-contain pointer-events-none"
          />
          <span className="text-[10px] font-bold tracking-wider leading-none">{tab.label}</span>
        </Button>
      ))}
    </nav>
  );
};
