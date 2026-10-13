'use client';

import React from 'react';

export type FeedTab = 'shared' | 'you' | 'rival';

interface FeedSwitcherProps {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
  unseenRivalCount: number;
}

export function FeedSwitcher({
  activeTab,
  onChange,
  unseenRivalCount,
}: FeedSwitcherProps) {
  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'shared', label: 'SHARED' },
    { id: 'you', label: 'YOU' },
    { id: 'rival', label: 'RIVAL' },
  ];

  return (
    <div
      role="tablist"
      aria-label="Feed mode selector"
      className="flex items-center gap-1 p-1 bg-terminal-panel border-b border-terminal-line shrink-0"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const showBadge = tab.id === 'rival' && unseenRivalCount > 0 && activeTab !== 'rival';

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex-1 relative py-1.5 px-3 rounded-[6px] font-data text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 min-h-[36px] ${
              isActive
                ? 'bg-terminal-bg text-terminal-phosphor border border-terminal-phosphor/60 shadow-sm'
                : 'text-terminal-muted hover:text-terminal-ink hover:bg-terminal-panel/60 border border-transparent'
            }`}
          >
            <span>{tab.label}</span>

            {/* Unseen count badge */}
            {showBadge && (
              <span
                aria-label={`${unseenRivalCount} new rival guesses`}
                className="px-1.5 py-0.2 rounded-full bg-terminal-danger text-terminal-bg font-data text-[10px] font-bold leading-none animate-pulse"
              >
                {unseenRivalCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
