import React from 'react';
import { Button } from '@/components/ui/Button';

const ICONS = {
  map: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="12" cy="10" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  rig: <><rect x="4" y="4" width="16" height="16" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  market: <><circle cx="9" cy="21" r="1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="20" cy="21" r="1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
  comms: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  duel: <path d="M14.5 4L20 9.5l-3 3-5.5-5.5 3-3zM9.5 14.5L4 20l3 3 5.5-5.5-3-3zM16 16l4 4M4 4l4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
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
          <svg 
            width="22" height="22" viewBox="0 0 24 24" 
            stroke="currentColor" 
            className="mb-1"
          >
            {ICONS[tab.id as keyof typeof ICONS]}
          </svg>
          <span className="text-[10px] font-bold tracking-wider leading-none">{tab.label}</span>
        </Button>
      ))}
    </nav>
  );
};
