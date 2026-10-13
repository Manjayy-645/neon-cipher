'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShopkeeperScene } from '@/features/market/ShopkeeperScene';
import { BlackMarket } from '@/features/market/BlackMarket';
import { useCampaignStore } from '@/stores/campaign-store';
import { triggerToast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';

export default function MarketPage() {
  const router = useRouter();
  const { unlocks, loadCampaign } = useCampaignStore();
  const [view, setView] = useState<'dialogue' | 'shop'>('dialogue');

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  if (!unlocks.blackMarket) {
    const handleLockedCardClick = () => {
      triggerToast('Finish Chapter 2 to open this', { type: 'locked' });
    };

    return (
      <main className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 bg-panel-light text-ink text-center">
        <div
          role="button"
          tabIndex={0}
          onClick={handleLockedCardClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLockedCardClick();
            }
          }}
          aria-label="Black market locked: Finish Chapter 2 to open this"
          className="max-w-md w-full p-6 bg-panel-light rounded-[12px] border border-line shadow-card flex flex-col items-center gap-4 cursor-pointer select-none active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none text-center"
        >
          <div className="w-12 h-12 rounded-full bg-panel border border-line flex items-center justify-center text-ink-muted">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block mb-1">
              Underground Frequencies
            </span>
            <h2 className="font-heading text-[28px] leading-[32px] font-normal text-ink mb-2">
              Black Market Locked
            </h2>
            <p className="font-data text-xs sm:text-sm text-ink-muted leading-relaxed max-w-sm">
              Glitch requires field proof before opening underground frequencies.
              Finish <strong className="text-ink font-semibold">Chapter 2: The Corner Store Job</strong> in Comms to open this.
            </p>
          </div>

          <Button
            variant="primary"
            arrow
            onClick={(e) => {
              e.stopPropagation();
              router.push('/comms');
            }}
            data-testid="go-to-story-button"
          >
            VIEW CAMPAIGN ASSIGNMENTS
          </Button>
        </div>
      </main>
    );
  }

  if (view === 'dialogue') {
    return (
      <main className="w-full h-full relative overflow-hidden bg-panel-light">
        <ShopkeeperScene
          vendorName="GLITCH"
          vendorTitle="BLACK MARKET BROKER"
          onOpenShop={() => setView('shop')}
          onLeave={() => router.push('/map')}
        />
      </main>
    );
  }

  return (
    <main className="w-full h-full relative overflow-hidden bg-panel-light">
      <BlackMarket onBackToDialogue={() => setView('dialogue')} />
    </main>
  );
}
