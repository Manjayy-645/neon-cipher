'use client';

import { useHydrated } from '@/lib/useHydrated';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShopkeeperScene } from '@/features/market/ShopkeeperScene';
import { BlackMarket } from '@/features/market/BlackMarket';
import { useCampaignStore } from '@/stores/campaign-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { campaignService } from '@/features/story/campaignService';
import { triggerToast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { useMapStore } from '@/stores/map-store';
import { getNodes } from '@/features/map/nodeService';
import { isFeatureEnabled } from '@/lib/flags';

export default function MarketPage() {
  const router = useRouter();
  const { unlocks, loadCampaign } = useCampaignStore();
  const hydrated = useHydrated();
  const [selectedView, setView] = useState<'dialogue' | 'shop' | null>(null);
  const [manualDevUnlock, setDevUnlocked] = useState(false);
  const marketTutorialGate = useOnboardingStore((state) => state.step === 'market.gate' && !state.skipped);
  const params = new URLSearchParams(hydrated ? window.location.search : '');
  const view = selectedView ?? (params.get('view') === 'dialogue' || (marketTutorialGate && params.get('view') !== 'shop') ? 'dialogue' : 'shop');
  const devUnlocked = manualDevUnlock || (hydrated && (
    localStorage.getItem('neon_dev_unlock_black_market') === 'true' ||
    params.get('dev') === 'true' || params.get('unlocked') === 'true'
  ));

  const crackedNodes = useOnboardingStore((s) => s.crackedNodes);
  const chapters = useCampaignStore((s) => s.chapters);
  const isCh2Completed =
    chapters['chapter-2']?.status === 'completed' ||
    Boolean(crackedNodes['n4']) ||
    Boolean(crackedNodes['s5']) ||
    Object.keys(crackedNodes).length >= 2;

  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  // Automatically unlock Black Market if player completed Market Register or 2 street breaches
  useEffect(() => {
    if (isCh2Completed && !unlocks.blackMarket) {
      useCampaignStore.setState((state) => ({
        unlocks: { ...state.unlocks, blackMarket: true },
      }));
      campaignService.completeChapter(2).catch(() => {});
    }
  }, [isCh2Completed, unlocks.blackMarket]);

  const handleDevUnlock = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('neon_dev_unlock_black_market', 'true');
    }
    setDevUnlocked(true);
    useCampaignStore.setState((state) => ({
      unlocks: { ...state.unlocks, blackMarket: true },
    }));
    try {
      await fetch('/api/mock/campaign/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: 'blackMarket' }),
      });
    } catch {}
    triggerToast('Developer Override: Black Market Unlocked', { type: 'success' });
    setView('shop');
  };

  const isUnlocked = unlocks.blackMarket || devUnlocked || isCh2Completed;

  if (!isUnlocked) {
    return (
      <main className="scene-ground scene-arrive w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-ink text-center overflow-y-auto min-h-0">
        <div
          className="max-w-md w-full p-6 bg-panel-light rounded-[12px] border border-line shadow-card flex flex-col items-center gap-4 text-center"
        >
          {/* Shuttered Storefront Preview */}
          <div className="w-full h-36 rounded-[8px] overflow-hidden relative border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Shop and scenes/shop-front.png"
              alt="Shuttered Black Market Storefront"
              className="w-full h-full object-cover grayscale brightness-40 contrast-125"
            />
            <div className="absolute inset-0 bg-panel/50 backdrop-blur-[1px] flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-panel/90 border border-line flex items-center justify-center text-ink-muted shadow-sm">
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
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-[4px] bg-panel/90 text-[10px] font-data text-ink-muted uppercase tracking-wider border border-line">
              SHUTTERED // CLEARANCE REQUIRED
            </div>
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
              Breach the <strong className="text-ink font-semibold">Market Register</strong> node on the City Map to unlock Glitch&apos;s Market.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full max-w-sm">
            <Button
              variant="primary"
              arrow
              onClick={(e) => {
                e.stopPropagation();
                const target = getNodes().find((node) => node.name === 'Market Register');
                if (target) { useMapStore.getState().selectNode(target.id); useMapStore.getState().setSheetState('expanded'); }
                router.push('/map');
              }}
              data-testid="go-to-story-button"
              className="w-full"
            >
              TRACK MARKET REGISTER
            </Button>
            {process.env.NODE_ENV === 'development' && isFeatureEnabled('devOverlay') && (
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDevUnlock();
                }}
                data-testid="dev-unlock-market-button"
                className="w-full text-[11px] font-bold border-money/50 text-money-text hover:bg-money/10"
              >
                [DEV: UNLOCK MARKET]
              </Button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (view === 'dialogue') {
    return (
      <main className="scene-ground scene-arrive w-full h-full relative overflow-hidden min-h-0">
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
    <main className="scene-ground scene-arrive w-full h-full relative overflow-hidden min-h-0">
      <BlackMarket onBackToDialogue={() => setView('dialogue')} />
    </main>
  );
}

