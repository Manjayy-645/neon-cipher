'use client';

import { useClock } from '@/lib/useClock';
import { useHydrated } from '@/lib/useHydrated';
import { useResettableState } from '@/lib/useResettableState';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StepId, STEP_ORDER, STEPS, STALL_HINTS, STALL_MS, CH2_NODE_ID, TUTORIAL } from '../steps';
import { useOnboardingStore, ONBOARDING_AVATARS } from '../onboardingStore';
import { usePlayerStore } from '@/stores/player-store';
import { subscribe, OnboardingEvent } from '../events';
import { track } from '../analytics';
import { TourSpotlight } from './TourSpotlight';
import { SavePromptDrawer } from './SavePromptDrawer';
import { triggerToast } from '@/stores/toast-store';
import { campaignService } from '@/features/story/campaignService';
import { useCampaignStore } from '@/stores/campaign-store';
import { Button } from '@/components/ui/Button';

export function getNextStepOnEvent(
  currentStep: StepId,
  event: OnboardingEvent
): StepId | null {
  const stepDef = STEPS[currentStep];
  if (!stepDef) return null;

  if (currentStep === 'cold.intro' && event.type === 'terminal:guess') {
    return 'cold.clues';
  }
  if (currentStep === 'cold.play' && event.type === 'terminal:won') {
    return 'cold.breach';
  }
  if (
    currentStep === 'ch2.hack' &&
    event.type === 'terminal:won' &&
    event.nodeId === CH2_NODE_ID
  ) {
    return 'ch2.result';
  }
  if (currentStep === 'ch2.hack' && event.type === 'terminal:won') {
    return null;
  }

  if (stepDef.advance === 'event' && stepDef.event === event.type) {
    if (event.type === 'map:districtTagTapped' && event.district !== 'slums') return null;
    if (event.type === 'map:nodeSelected' && event.nodeId !== CH2_NODE_ID) return null;
    if (event.type === 'map:jackIn' && event.nodeId !== CH2_NODE_ID) return null;
    if (event.type === 'market:bought' && event.itemId !== 'firewall-patch') return null;
    if (event.type === 'market:equipped' && event.itemId !== 'firewall-patch') return null;

    const nextIdx = STEP_ORDER.indexOf(currentStep) + 1;
    return STEP_ORDER[nextIdx] ?? null;
  }

  return null;
}

export function getNextStallHint(
  category: 'tutorial' | 'ch2',
  lastHintIndex: number
): { hint: string; nextIndex: number } {
  const hints = STALL_HINTS[category];
  const nextIndex = (lastHintIndex + 1) % hints.length;
  return { hint: hints[nextIndex], nextIndex };
}

export function TourDirector() {
  const now = useClock();
  const pathname = usePathname();
  const router = useRouter();

  const {
    step,
    skipped,
    skipExplanations,
    seen,
    startedAt,
    advance,
    skip,
    markSeen,
    recordWin,
    recordCh2Fail,
  } = useOnboardingStore();

  const mounted = useHydrated();
  const [currentLineIndex, setCurrentLineIndex] = useResettableState(0, step);
  const [deadKeyTarget, setDeadKeyTarget] = useState<string | null>(null);
  const [activeStallHint, setActiveStallHint] = useResettableState<string | null>(null, step);
  const lastStallHintIndexRef = useRef<number>(-1);
  const lastGuessTimeRef = useRef<number>(now);
  const firstGuessTrackedRef = useRef(false);


  // Reset line index when step changes
  useEffect(() => {
    lastGuessTimeRef.current = Date.now();
  }, [step]);

  // Subscribe to onboarding events
  useEffect(() => {
    const unsubscribe = subscribe((e: OnboardingEvent) => {
      lastGuessTimeRef.current = Date.now();
      setActiveStallHint(null);

      // 1. First guess tracking & cold.intro advancement
      if (e.type === 'terminal:guess') {
        if (!firstGuessTrackedRef.current) {
          firstGuessTrackedRef.current = true;
          track('first_guess');
        }

        // 2. Dead key side step spotlight
        if (
          e.hasDeadDigit &&
          !seen['deadkey'] &&
          (step === 'cold.clues' || step === 'cold.play')
        ) {
          markSeen('deadkey');
          track('dead_key_seen');
          // Spotlight dead key
          setDeadKeyTarget('dead-key');
        }
      }

      // 3. Wins
      if (e.type === 'terminal:won') {
        if (step === 'cold.play' || step === 'cold.intro' || step === 'cold.clues') {
          const elapsed = startedAt ? Date.now() - startedAt : 0;
          recordWin();
          track('first_solve', { ms: elapsed, guesses: e.guesses });
          advance('cold.breach');
          return;
        }

        if (step === 'ch2.hack' && e.nodeId === CH2_NODE_ID) {
          const elapsed = startedAt ? Date.now() - startedAt : 0;
          recordWin();
          track('ch2_win', { ms: elapsed, guesses: e.guesses });
          advance('ch2.result');
          return;
        }
      }

      // 4. Chapter 2 failure
      if (e.type === 'terminal:lost' && step === 'ch2.hack' && e.nodeId === CH2_NODE_ID) {
        recordCh2Fail();
        track('ch2_fail');
        return;
      }

      // 5. General event advancement
      const nextStep = getNextStepOnEvent(step, e);
      if (nextStep) {
        if (e.type === 'map:districtTagTapped') track('map_slums_tapped');
        if (e.type === 'map:jackIn') track('jack_in_ch2');
        if (e.type === 'market:bought') track('market_bought', { itemId: e.itemId });
        if (e.type === 'market:equipped') track('market_equipped', { itemId: e.itemId });
        if (e.type === 'comms:viewed') track('comms_viewed');

        advance(nextStep);
      }
    });

    return () => unsubscribe();
  }, [step, seen, startedAt, advance, markSeen, recordWin, recordCh2Fail, setActiveStallHint]);

  // Stall hint timer
  useEffect(() => {
    if (step !== 'cold.play' && step !== 'ch2.hack') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastGuessTimeRef.current >= STALL_MS) {
        const category = step === 'cold.play' ? 'tutorial' : 'ch2';
        const { hint, nextIndex } = getNextStallHint(category, lastStallHintIndexRef.current);
        lastStallHintIndexRef.current = nextIndex;
        setActiveStallHint(hint);
        lastGuessTimeRef.current = now; // reset to avoid repeating immediately
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, setActiveStallHint]);

  const handleSkipTour = useCallback(() => {
    skip();
    track('tour_skipped');
    // Ensure player has a profile if skipping before profile was created
    const { callsign, setProfile, guestId } = useOnboardingStore.getState();
    if (!callsign) {
      const fallbackCallsign = 'DECKER_' + guestId.slice(0, 4).toUpperCase();
      setProfile(fallbackCallsign, 'avatar-nx');
      usePlayerStore.setState({
        handle: fallbackCallsign,
        avatarUrl: ONBOARDING_AVATARS[0].url,
      });
    }
    // Also complete chapter 1 in campaign and mark tutorial node cracked so user is never stuck
    campaignService.completeChapter(1).catch(() => {});
    useCampaignStore.getState().completeChapter('chapter-1').catch(() => {});
    useOnboardingStore.getState().crackNode(TUTORIAL.mapNodeId, TUTORIAL.cooldownMs);
    triggerToast('Nix tutorial skipped. Transceiver locked to City Map.');
    router.push('/map');
  }, [skip, router]);

  if (!mounted || skipped || step === 'done') {
    return null;
  }

  // Handle Save Prompt Drawer on step save.prompt
  if (step === 'save.prompt') {
    return <SavePromptDrawer open={true} />;
  }

  // Handle dead key side-step spotlight
  if (deadKeyTarget) {
    return (
      <TourSpotlight
        targetSelector={deadKeyTarget}
        line={STEPS['cold.deadkey'].lines[0]}
        speaker={STEPS['cold.deadkey'].speaker}
        isTapToAdvance={true}
        onTap={() => setDeadKeyTarget(null)}
        showSkip={true}
        onSkip={handleSkipTour}
      />
    );
  }

  const stepDef = STEPS[step];
  if (!stepDef) return null;

  // If user is on a route that does not match step, render nothing (gate redirects)
  if (pathname !== stepDef.route) {
    return null;
  }

  // Skip Nix lines in cold.* steps if skipExplanations is enabled
  if (skipExplanations && step.startsWith('cold.')) {
    return null;
  }

  // Render stall hint if active
  if (activeStallHint) {
    return (
      <TourSpotlight
        line={activeStallHint}
        speaker="nix"
        isTapToAdvance={true}
        onTap={() => setActiveStallHint(null)}
        showSkip={true}
        onSkip={handleSkipTour}
      />
    );
  }

  // Render step spotlight if step has lines
  if (stepDef.lines && stepDef.lines.length > 0) {
    const currentLine = stepDef.lines[currentLineIndex] || stepDef.lines[0];
    const isMultiLine = stepDef.lines.length > 1;
    const isLastLine = currentLineIndex >= stepDef.lines.length - 1;

    const handleTapToAdvance = () => {
      if (isMultiLine && !isLastLine) {
        setCurrentLineIndex((prev) => prev + 1);
        return;
      }

      // If at last line or single line
      if (step === 'cold.clues') {
        advance('cold.play');
      } else if (step === 'cold.breach') {
        advance('glitch.intro');
        router.push('/onboarding/glitch');
      } else if (step === 'ch2.result') {
        triggerToast('Black Market unlocked');
        campaignService.completeChapter(2).catch(() => {});
        advance('market.gate');
        router.push('/market');
      } else if (step === 'comms.debt') {
        advance('save.prompt');
      } else {
        advance();
      }
    };

    return (
      <TourSpotlight
        targetSelector={stepDef.target}
        line={currentLine}
        speaker={stepDef.speaker}
        isTapToAdvance={stepDef.advance === 'tap'}
        onTap={stepDef.advance === 'tap' ? handleTapToAdvance : undefined}
        showSkip={true}
        onSkip={handleSkipTour}
      />
    );
  }

  return null;
}
