'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useCampaignStore } from '@/stores/campaign-store';
import { useRouter } from 'next/navigation';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';

function DuelLoadingSkeleton() {
  return (
    <div className="scene-ground flex-1 w-full flex items-center justify-center p-8 font-data">
      <div className="max-w-md w-full bg-panel-light border border-line rounded-md p-6 flex flex-col items-center gap-3 shadow-card">
        <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
        <span className="text-xs uppercase tracking-widest text-ink-muted">
          SYNCHRONIZING SEC-NET FEED...
        </span>
      </div>
    </div>
  );
}

const TurfWarBoard = dynamic(
  () => import('@/features/duel/TurfWarBoard').then((m) => m.TurfWarBoard),
  {
    ssr: false,
    loading: () => <DuelLoadingSkeleton />,
  }
);

const DuelArena = dynamic(
  () => import('@/features/duel/DuelArena').then((m) => m.DuelArena),
  {
    ssr: false,
    loading: () => <DuelLoadingSkeleton />,
  }
);

export default function DuelPage() {
  const router = useRouter();
  const { unlocks } = useCampaignStore();
  const [activeTab, setActiveTab] = useState<'turf' | 'duel'>('turf');
  const [devBypassUnlock, setDevBypassUnlock] = useState(false);

  const isUnlocked = unlocks.onlinePlay || devBypassUnlock;

  return (
    <main className="scene-ground scene-arrive flex h-full w-full min-h-0 flex-col text-ink overflow-hidden">
      <header className="shrink-0 border-b border-line bg-panel px-4 py-3 sm:py-4">
        <span className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-text">THE CITY / COMPETITIVE NETWORK</span>
        <h1 className="font-heading text-xl font-semibold text-ink leading-tight mt-1">Battle Network</h1>
        <p className="font-data text-[11px] text-ink-muted mt-1 leading-relaxed">Explore territory conflicts or enter a 1v1 cipher duel.</p>
      </header>
      {/* Top Tab Bar (Segmented Control) */}
      <div className="bg-panel-light border-b border-line px-4 py-2 shrink-0 relative z-20">
        <SegmentedControl
          ariaLabel="Duel mode selector"
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'turf' | 'duel')}
          options={[
            { id: 'turf', label: 'TURF WAR BOARD', testId: 'tab-turf-war' },
            { id: 'duel', label: '1v1 CIPHER DUEL', testId: 'tab-1v1-duel' },
          ]}
        />
      </div>

      {activeTab === 'turf' ? (
        <TurfWarBoard />
      ) : !isUnlocked ? (
        <div className="scene-ground w-full h-full flex flex-col items-center justify-center p-6 text-ink text-center overflow-y-auto min-h-0">
          <div className="max-w-md w-full p-6 bg-panel rounded-[12px] border border-line shadow-card flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-panel-light border border-line flex items-center justify-center text-ink-muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <span className="font-data text-[11px] tracking-[1.5px] text-ink-muted uppercase font-medium mb-1 block">
                CARRIER FREQUENCY RESTRICTED
              </span>
              <h2 className="font-heading text-xl font-normal text-ink mb-2">
                ONLINE PLAY LOCKED
              </h2>
              <p className="font-data text-xs text-ink-muted leading-relaxed">
                Competitive 1v1 Cipher Duels require wiping your syndicate debts and clearing the rogue relay.
                Complete <strong className="text-ink">Chapter 4: The Rogue Signal</strong> in Comms to unlock live multiplayer.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full pt-2">
              <Button
                variant="primary"
                arrow
                fullWidth
                onClick={() => router.push('/comms')}
                data-testid="go-to-story-button"
              >
                VIEW CAMPAIGN ASSIGNMENTS
              </Button>
              {process.env.NODE_ENV === "development" && (
                <Button
                  variant="ghost"
                  compact
                  fullWidth
                  onClick={() => setDevBypassUnlock(true)}
                  data-testid="dev-bypass-unlock-button"
                >
                  [DEV TESTING]: OVERRIDE CARRIER LOCK
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <DuelArena />
      )}
    </main>
  );
}
