'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getChapterById } from '@neon-cipher/game-rules/src/index';
import { useCampaignStore } from '@/stores/campaign-store';
import { useMapStore } from '@/stores/map-store';
import { TutorialOverlay } from './TutorialOverlay';
import { Button } from '@/components/ui/Button';

export const MapTutorialHost: React.FC = () => {
  const {
    activeChapterId,
    tutorialActive,
    tutorialStepIndex,
    nextTutorialStep,
    skipTutorial,
    loadCampaign,
  } = useCampaignStore();

  const selectedNodeId = useMapStore((s) => s.selectedNodeId);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const chapter = activeChapterId ? getChapterById(activeChapterId) : null;
  const activeStep =
    chapter?.tutorialSteps && tutorialActive
      ? chapter.tutorialSteps[tutorialStepIndex]
      : null;

  // Auto-advance if step requires tapping node and node was selected
  useEffect(() => {
    if (
      tutorialActive &&
      activeStep?.actionRequired === 'tap-node' &&
      selectedNodeId === chapter?.mapNodeId
    ) {
      nextTutorialStep();
    }
  }, [
    tutorialActive,
    activeStep?.actionRequired,
    selectedNodeId,
    chapter?.mapNodeId,
    nextTutorialStep,
  ]);

  if (!tutorialActive || !activeChapterId || !chapter || !chapter.tutorialSteps || !activeStep) {
    return null;
  }

  // Only render on map for 'map' and 'sheet' phases
  if (activeStep.phase !== 'map' && activeStep.phase !== 'sheet') {
    return null;
  }

  return (
    <TutorialOverlay
      chapter={chapter}
      activeStep={activeStep}
      currentStepIndex={tutorialStepIndex}
      onAdvanceStep={nextTutorialStep}
      onSkipTutorial={() => skipTutorial(chapter.id)}
    />
  );
};

export const CampaignObjectiveBanner: React.FC = () => {
  const router = useRouter();
  const activeChapterId = useCampaignStore((s) => s.activeChapterId);
  const chapter = activeChapterId ? getChapterById(activeChapterId) : null;

  if (!chapter) return null;

  return (
    <div
      data-testid="campaign-objective-banner"
      className="w-full pointer-events-auto"
    >
      <Button
        variant="secondary"
        fullWidth
        onClick={() => router.push('/comms')}
        className="min-h-[56px] rounded-md shadow-card px-[12px] py-[8px] text-left justify-start gap-[12px] normal-case tracking-normal bg-panel-light border border-line text-ink hover:bg-panel"
        aria-label="View active campaign briefing in Comms"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="shrink-0 text-accent"
          aria-hidden="true"
        >
          <path d="M5 0 10 5 5 10 0 5z" fill="currentColor" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="font-data text-[10px] uppercase tracking-[1px] text-accent-text leading-tight">
            Active contract · Chapter 0{chapter.number}
          </div>
          <div className="font-heading text-[16px] text-ink leading-tight truncate">
            {chapter.title}
            <span className="text-ink-muted"> → {chapter.target}</span>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          className="shrink-0 text-ink-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </Button>
    </div>
  );
};
