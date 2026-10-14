'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useOnboardingStore } from '../onboardingStore';
import { useCampaignStore } from '@/stores/campaign-store';
import { getChapterById } from '@neon-cipher/game-rules';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { StepId } from '../steps';

export interface PendingQuest {
  id: string;
  type: 'onboarding' | 'campaign';
  title: string;
  target: string;
  description: string;
  route: string;
}

export function getPendingQuest(
  step: StepId,
  skipped: boolean,
  activeChapterId: string | null,
  chapters: Record<string, { status?: string }> = {}
): PendingQuest | null {
  // If onboarding is active (not skipped, not done, and beyond splash)
  if (!skipped && step !== 'done' && step !== 'splash') {
    if (step.startsWith('cold.')) {
      return {
        id: 'quest-tutorial-soda',
        type: 'onboarding',
        title: 'Tutorial: Breach Soda Machine',
        target: 'Rusty Soda Machine',
        description: 'Breach the 3-digit cipher on the tutorial dispenser.',
        route: '/terminal/tutorial-soda',
      };
    }
    if (step === 'glitch.intro') {
      return {
        id: 'quest-glitch-intro',
        type: 'onboarding',
        title: 'Syndicate Liaison',
        target: 'Broker Glitch',
        description: 'Meet Broker Glitch and review contract terms.',
        route: '/onboarding/glitch',
      };
    }
    if (step === 'profile.create') {
      return {
        id: 'quest-profile-create',
        type: 'onboarding',
        title: 'Identity Registration',
        target: 'Decker Profile',
        description: 'Register your decker callsign and avatar.',
        route: '/onboarding/profile',
      };
    }
    if (step === 'map.overview' || step === 'map.district' || step === 'map.node') {
      return {
        id: 'quest-map-recon',
        type: 'onboarding',
        title: 'District Recon',
        target: 'Corner Store (Node n4)',
        description: 'Locate and inspect the target in the Slums.',
        route: '/map',
      };
    }
    if (step === 'ch2.hack' || step === 'ch2.result') {
      return {
        id: 'quest-ch2-hack',
        type: 'onboarding',
        title: 'Chapter 02: First Clean Run',
        target: 'Corner Store (Node n4)',
        description: 'Infiltrate and breach the corner store terminal.',
        route: '/terminal/n4',
      };
    }
    if (step === 'market.gate' || step === 'market.buy' || step === 'market.equip') {
      return {
        id: 'quest-market',
        type: 'onboarding',
        title: 'Black Market Supply',
        target: "Alex's Counter",
        description: 'Acquire and equip a Firewall Patch from Alex.',
        route: '/market',
      };
    }
    if (step === 'comms.nav' || step === 'comms.debt') {
      return {
        id: 'quest-comms-debt',
        type: 'onboarding',
        title: 'Syndicate Accounting',
        target: 'Debt Tracker',
        description: 'Inspect your Kovacs Syndicate debt in Comms.',
        route: '/comms',
      };
    }
    if (step === 'save.prompt') {
      return {
        id: 'quest-save-prompt',
        type: 'onboarding',
        title: 'Secure Credentials',
        target: 'Save Account',
        description: 'Save your credentials to secure your profile.',
        route: '/comms',
      };
    }
  }

  // Active campaign chapter (when not in onboarding or onboarding done/skipped)
  if (activeChapterId) {
    const chapter = getChapterById(activeChapterId);
    const progress = chapters[activeChapterId];
    if (chapter && progress?.status !== 'completed') {
      return {
        id: `campaign-${chapter.id}`,
        type: 'campaign',
        title: `Chapter 0${chapter.number}: ${chapter.title}`,
        target: chapter.target,
        description: chapter.tagline,
        route: chapter.mapNodeId ? `/terminal/${chapter.mapNodeId}` : '/map',
      };
    }
  }

  return null;
}

export function PendingQuestNotification() {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();

  const { step, skipped, chromeVisible } = useOnboardingStore();
  const { activeChapterId, chapters } = useCampaignStore();

  const [dismissedPath, setDismissedPath] = useState<string | null>(null);

  const quest = getPendingQuest(step, skipped, activeChapterId, chapters);

  // Reset dismissal if pathname or quest changes
  useEffect(() => {
    if (dismissedPath && dismissedPath !== pathname) {
      setDismissedPath(null);
    }
  }, [pathname, dismissedPath]);

  // Hide if no quest, or if already on quest route, or on root splash, or dismissed on this page
  if (!quest) return null;
  if (!pathname || pathname === '/' || pathname === quest.route) return null;
  if (dismissedPath === pathname) return null;

  const isChromeActive = chromeVisible();
  const topPos = isChromeActive ? 'top-[64px]' : 'top-[12px]';

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(quest.route);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedPath(pathname);
  };

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        data-testid="pending-quest-notification"
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
        transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.2, ease: 'easeOut' }}
        className={`absolute ${topPos} left-3 right-3 sm:left-4 sm:right-4 z-40 pointer-events-auto select-none`}
      >
        <div
          onClick={handleResume}
          className="bg-panel-light border border-line border-l-4 border-l-accent rounded-[12px] shadow-card p-3 flex items-center justify-between gap-3 cursor-pointer group hover:border-accent/60 transition-colors"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full border border-line bg-panel flex items-center justify-center shrink-0 mt-0.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 10 10"
                className="text-accent animate-pulse"
                aria-hidden="true"
              >
                <path d="M5 0 10 5 5 10 0 5z" fill="currentColor" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 leading-none mb-1">
                <span className="font-data text-[10px] font-bold uppercase tracking-[1.5px] text-accent-text">
                  PENDING QUEST
                </span>
              </div>
              <h4 className="font-heading text-[15px] sm:text-[16px] text-ink leading-tight truncate">
                {quest.title}
              </h4>
              <p className="font-data text-[11px] text-ink-muted leading-tight mt-0.5 truncate">
                Target: {quest.target}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="pending-quest-action"
              onClick={handleResume}
              className="px-2.5 py-1.5 rounded-[6px] bg-accent text-on-accent font-data text-[11px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>RESUME</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              data-testid="pending-quest-dismiss"
              onClick={handleDismiss}
              aria-label="Dismiss pending quest notification"
              className="w-[30px] h-[30px] rounded-full border border-line/40 hover:border-line bg-panel/70 hover:bg-panel text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
