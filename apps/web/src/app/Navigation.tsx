'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMapStore, NavTab } from '../stores/map-store';
import { useCampaignStore } from '../stores/campaign-store';

const NAV_ITEMS: Array<{ name: string; href: string; tab: NavTab; icon: React.ReactNode; description: string }> = [
  { name: 'City', href: '/map', tab: 'map', icon: <MapIcon />, description: 'Explore city districts' },
  { name: 'Battle', href: '/duel', tab: 'duel', icon: <DuelIcon />, description: 'Duels and turf wars' },
  { name: 'Missions', href: '/comms', tab: 'comms', icon: <CommsIcon />, description: 'Story and co-op heists' },
  { name: 'Rig', href: '/rig', tab: 'rig', icon: <RigIcon />, description: 'Configure your cyberdeck' },
  { name: 'Market', href: '/market', tab: 'market', icon: <MarketIcon />, description: 'Acquire equipment' },
];

export interface NavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

export function getTabForPathname(pathname: string | null): NavTab | null {
  if (!pathname) return null;
  if (pathname.startsWith('/terminal/')) return 'map';
  if (pathname === '/coop' || pathname.startsWith('/coop/') || pathname === '/story') return 'comms';
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))?.tab ?? null;
}

export function Navigation({ activeTab: controlledTab, onTabChange }: NavigationProps = {}) {
  const pathname = usePathname();
  const storedTab = useMapStore((state) => state.activeTab);
  const setActiveTab = useMapStore((state) => state.setActiveTab);
  const multiplayerUnlocked = useCampaignStore((state) => state.unlocks.onlinePlay);

  React.useEffect(() => {
    const tab = getTabForPathname(pathname);
    if (tab) setActiveTab(tab);
  }, [pathname, setActiveTab]);

  const currentTab = controlledTab ?? getTabForPathname(pathname) ?? storedTab;

  return (
    <nav
      aria-label="Main Navigation"
      className="h-[calc(var(--nav-height)_+_max(env(safe-area-inset-bottom),0.5rem))] min-h-[var(--nav-height)] shrink-0 border-t border-line bg-panel z-hud-bars relative select-none px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)]"
    >
      <div className="flex items-stretch justify-around h-full gap-0.5 max-w-[720px] mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = currentTab === item.tab;
          const battleLocked = item.tab === 'duel' && !multiplayerUnlocked;
          return (
            <Link
              key={item.tab}
              href={item.href}
              onClick={() => { setActiveTab(item.tab); onTabChange?.(item.tab); }}
              aria-label={battleLocked ? 'Battle — online duels unlock in Chapter 4; view battle modes' : item.description}
              aria-current={active ? 'page' : undefined}
              style={{ backgroundColor: active ? 'var(--accent)' : undefined, color: active ? 'var(--on-accent)' : 'var(--ink-muted)' }}
              data-testid={`nav-item-${item.tab}`}
              data-tour={item.tab === 'comms' ? 'nav-comms' : undefined}
              className={`group relative flex-1 min-w-0 min-h-[44px] mx-0.5 my-1 rounded-[6px] flex flex-col items-center justify-center gap-[3px] no-underline outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${active ? 'bg-accent text-on-accent shadow-sm' : 'text-ink-muted hover:bg-panel-light hover:text-ink'}`}
            >
              <span className="relative w-[22px] h-[22px] flex items-center justify-center" aria-hidden="true">
                {item.icon}
                {battleLocked && <span className="absolute -right-2 -top-1 w-2 h-2 rounded-full border border-panel bg-ink-muted" />}
              </span>
              <span className="font-data text-[10px] font-bold uppercase tracking-[0.5px] leading-tight truncate max-w-full px-0.5">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MapIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;
}
function RigIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>;
}
function MarketIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h16l-1.5 12h-13L4 8ZM3 8l2-5h14l2 5M9 12v4M15 12v4"/></svg>;
}
function CommsIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v14H4zM7 9h10M7 13h7M7 17h4"/><path d="m17 15 3 4"/></svg>;
}
function DuelIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 4 15 15M19 4 4 19M3 3l4 1-3 4M21 3l-4 1 3 4M3 21l4-1-3-4M21 21l-4-1 3-4"/></svg>;
}
