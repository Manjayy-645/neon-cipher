'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isFeatureEnabled } from '../lib/flags';
import { motion, AnimatePresence } from 'framer-motion';

import { useMapStore, NavTab } from '../stores/map-store';
import { triggerToast } from '../stores/toast-store';
import { Button } from '../components/ui/Button';

const navItems = [
  { name: 'Map', href: '/map', flag: 'map' as const, icon: <MapIcon /> },
  { name: 'Rig', href: '/rig', flag: 'rig' as const, icon: <RigIcon /> },
  { name: 'Market', href: '/market', flag: 'market' as const, icon: <MarketIcon /> },
  { name: 'Comms', href: '/comms', flag: 'comms' as const, icon: <CommsIcon /> },
  { name: 'Duel', href: '/duel', flag: 'duel' as const, icon: <DuelIcon /> },
];

export interface NavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

function getTabForPathname(pathname: string | null): NavTab | null {
  if (!pathname) return null;
  if (pathname.startsWith('/terminal/')) return 'map';

  return navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.flag ?? null;
}

export function Navigation({ activeTab: controlledTab, onTabChange }: NavigationProps = {}) {
  const pathname = usePathname();
  const storeActiveTab = useMapStore((s) => s.activeTab);
  const setActiveTab = useMapStore((s) => s.setActiveTab);
  // Re-evaluates flags when developer toggles feature flags in DevMenu
  useMapStore((s) => s.devFlagTick);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!pathname) return;
    const matchedTab = getTabForPathname(pathname);
    if (matchedTab) {
      setActiveTab(matchedTab);
    } else if (pathname === '/') {
      setActiveTab('map');
    }
  }, [pathname, setActiveTab]);

  const currentTab =
    controlledTab ??
    (getTabForPathname(pathname) ??
      (pathname === '/' ? 'map' : storeActiveTab));

  const handleDisabledClick = (e: React.MouseEvent, itemFlag: NavTab) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange(itemFlag);
      setActiveTab(itemFlag);
      return;
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage('Coming soon');
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleItemClick = (flag: NavTab) => {
    setActiveTab(flag);
    onTabChange?.(flag);
  };

  return (
    <nav 
      aria-label="Main Navigation"
      className="h-[calc(var(--nav-height)_+_env(safe-area-inset-bottom))] min-h-[var(--nav-height)] shrink-0 border-t border-line bg-panel flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] z-20 relative select-none"
    >
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            data-testid="nav-toast"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 bg-panel-light border border-line text-ink font-data text-label uppercase px-3 py-1.5 rounded-sm shadow-card pointer-events-none whitespace-nowrap"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {navItems.map((item) => {
        const enabled = isFeatureEnabled(item.flag);
        const isActive = currentTab === item.flag;

        const commonClasses =
          'flex-1 h-[calc(100%-12px)] my-[6px] mx-[4px] rounded-[8px] flex flex-col items-center justify-center gap-[3px] min-h-[44px] no-underline transition-all duration-[120ms] active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2';
        const tabStyle: React.CSSProperties = {
          backgroundColor: isActive ? 'var(--accent)' : undefined,
          color: isActive ? 'var(--on-accent)' : 'var(--ink-muted)',
        };

        if (!enabled) {
          return (
            <Button
              key={item.name}
              variant="ghost"
              onClick={(e) => handleDisabledClick(e, item.flag)}
              className={`border-0 p-0 ${commonClasses}`}
              style={tabStyle}
              aria-label={`${item.name} (Coming soon)`}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`nav-item-${item.name.toLowerCase()}`}
              data-tour={item.flag === 'comms' ? 'nav-comms' : undefined}
            >
              <div className="w-[22px] h-[22px] flex items-center justify-center">
                {item.icon}
              </div>
              <span className="font-data text-[10px] uppercase tracking-[1px] leading-tight">
                {item.name}
              </span>
            </Button>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => handleItemClick(item.flag)}
            className={commonClasses}
            style={tabStyle}
            aria-current={isActive ? 'page' : undefined}
            data-testid={`nav-item-${item.name.toLowerCase()}`}
            data-tour={item.flag === 'comms' ? 'nav-comms' : undefined}
          >
            <div className="w-[22px] h-[22px] flex items-center justify-center">
              {item.icon}
            </div>
            <span className="font-data text-[10px] uppercase tracking-[1px] leading-tight">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
      <line x1="9" y1="3" x2="9" y2="18"></line>
      <line x1="15" y1="6" x2="15" y2="21"></line>
    </svg>
  );
}

function RigIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <path d="M12 12h.01"></path>
      <path d="M8 12h.01"></path>
      <path d="M16 12h.01"></path>
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  );
}

function CommsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function DuelIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6l2.5-2.5 11.5 11.5"></path>
      <path d="M13 19l6-6"></path>
      <path d="M16 16l4 4"></path>
      <path d="M19 21l2-2"></path>
      <path d="M8.5 6.5L21 19l-2.5 2.5L7 10"></path>
      <path d="M11 5l-6 6"></path>
      <path d="M8 8L4 4"></path>
      <path d="M5 3L3 5"></path>
    </svg>
  );
}
