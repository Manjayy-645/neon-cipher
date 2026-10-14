'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CHAPTERS, ChapterData } from '@neon-cipher/game-rules/src/index';
import { useCampaignStore } from '@/stores/campaign-store';
import { triggerToast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';

export interface ChapterSelectProps {
  onSelectChapter: (chapter: ChapterData) => void;
  onOpenMap?: () => void;
}

export const ChapterSelect: React.FC<ChapterSelectProps> = ({
  onSelectChapter,
  onOpenMap,
}) => {
  const { debt, chapters, unlocks, loadCampaign, isLoading, resetCampaign } =
    useCampaignStore();

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const debtPercent = Math.round((debt.paid / debt.initial) * 100);
  const isDebtFree = debt.current === 0;

  return (
    <div
      data-testid="chapter-select-screen"
      className="scene-ground w-full h-full flex flex-col px-4 py-4 sm:py-6 text-ink overflow-y-auto overflow-x-hidden"
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-line pb-3 shrink-0">
          <div>
            <span className="font-data text-[11px] uppercase tracking-[1.5px] text-ink-muted font-medium block">
              STORY CAMPAIGN // PROTOCOL ZERO
            </span>
            <h1 className="font-heading text-[28px] leading-[32px] font-normal text-ink">
              ZERO BALANCE
            </h1>
          </div>

          {onOpenMap && (
            <Button variant="secondary" arrow onClick={onOpenMap}>
              CITY MAP
            </Button>
          )}
        </header>

        {/* Debt Tracker Card */}
        <div
          className="p-3.5 sm:p-4 bg-panel-light rounded-[12px] border border-line shadow-card shrink-0 flex flex-col gap-3"
          data-testid="campaign-debt-tracker"
          data-tour="debt-tracker"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full border border-line bg-panel overflow-hidden shrink-0 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Character portraits/Glitch.png" alt="Glitch" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-data text-xs font-bold uppercase tracking-wider text-ink">
                    KOVACS SYNDICATE DEBT
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDebtFree ? 'bg-accent' : 'bg-danger animate-pulse'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-ink-muted font-data uppercase block mt-0.5">
                  Liaison: Broker Glitch
                </span>
              </div>
            </div>
            <span
              className={`font-data text-xs font-bold ${
                isDebtFree ? 'text-accent-text' : 'text-danger-text'
              }`}
            >
              {isDebtFree ? 'DEBT CLEARED (100%)' : `$${debt.current.toLocaleString()} REMAINING`}
            </span>
          </div>

          {/* Progress bar: accent fill on heat.track */}
          <div className="w-full h-3.5 bg-heat-track rounded-pill overflow-hidden relative border border-line/40">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${debtPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              aria-valuenow={debtPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-data text-ink-muted">
            <span>INITIAL PRINCIPAL: ${debt.initial.toLocaleString()}</span>
            <span className="text-accent-text font-bold">
              ${debt.paid.toLocaleString()} REPAID ({debtPercent}%)
            </span>
          </div>

          {/* Unlocks Summary Badges (stacked on mobile to eliminate horizontal scroll) */}
          <div className="pt-3 border-t border-line/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div
              className={`p-2 rounded-[6px] border text-[10px] font-data uppercase flex items-center justify-center gap-1.5 ${
                unlocks.blackMarket
                  ? 'bg-accent/15 border-accent text-accent-text font-bold'
                  : 'bg-panel border-line text-ink-muted opacity-60'
              }`}
            >
              {unlocks.blackMarket ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              <span>{unlocks.blackMarket ? 'BLACK MARKET OPEN' : 'BLACK MARKET (CH 2)'}</span>
            </div>
            <div
              className={`p-2 rounded-[6px] border text-[10px] font-data uppercase flex items-center justify-center gap-1.5 ${
                unlocks.bridge
                  ? 'bg-accent/15 border-accent text-accent-text font-bold'
                  : 'bg-panel border-line text-ink-muted opacity-60'
              }`}
            >
              {unlocks.bridge ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              <span>{unlocks.bridge ? 'RIVER BRIDGE OPEN' : 'BRIDGE ACCESS (CH 3)'}</span>
            </div>
            <div
              className={`p-2 rounded-[6px] border text-[10px] font-data uppercase flex items-center justify-center gap-1.5 ${
                unlocks.onlinePlay
                  ? 'bg-accent/15 border-accent text-accent-text font-bold'
                  : 'bg-panel border-line text-ink-muted opacity-60'
              }`}
            >
              {unlocks.onlinePlay ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              <span>{unlocks.onlinePlay ? 'ONLINE PLAY UNLOCKED' : 'ONLINE DUEL (CH 4)'}</span>
            </div>
          </div>
        </div>

        {/* Chapter Cards List */}
        <div className="flex flex-col gap-3 pb-4">
          {CHAPTERS.map((ch) => {
            const progress = chapters[ch.id];
            const status = progress ? progress.status : ch.number === 1 ? 'available' : 'locked';
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const isLocked = status === 'locked';

            const handleCardClick = () => {
              if (isLocked) {
                triggerToast(`Finish Chapter ${ch.number - 1} to open this`, { type: 'locked' });
              } else {
                onSelectChapter(ch);
              }
            };

            return (
              <div
                key={ch.id}
                role="button"
                tabIndex={0}
                onClick={handleCardClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick();
                  }
                }}
                data-testid={`chapter-card-${ch.id}`}
                aria-label={`Chapter ${ch.number}: ${ch.title}. ${isLocked ? `Locked: Finish Chapter ${ch.number - 1} to open this` : status}`}
                className={`scene-card p-3.5 sm:p-4 rounded-[12px] border border-line bg-panel-light shadow-card flex flex-col gap-3 transition-all cursor-pointer select-none active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none ${
                  isCompleted
                    ? 'border-accent/50'
                    : isActive
                    ? 'border-accent ring-1 ring-accent'
                    : isLocked
                    ? 'opacity-60 bg-panel-light/60 border-line/50 text-ink-muted'
                    : 'border-line hover:border-accent/50'
                }`}
              >
                {/* Chapter Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full border border-line bg-panel overflow-hidden shrink-0 shadow-xs mt-0.5"
                      title={ch.briefingDialogue[0]?.speaker === 'glitch' ? 'Contract Broker: Glitch' : 'Tactical Guide: Nix'}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ch.briefingDialogue[0]?.speaker === 'glitch' ? '/Character portraits/Glitch.png' : '/Character portraits/Nix.png'}
                        alt={ch.briefingDialogue[0]?.speaker === 'glitch' ? 'Glitch' : 'Nix'}
                        className={`w-full h-full object-cover ${isLocked ? 'grayscale opacity-60' : ''}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-pill bg-panel border border-line text-ink-muted font-data text-[10px] font-bold uppercase tracking-wider">
                          CH 0{ch.number}
                        </span>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-pill bg-accent/15 text-accent-text border border-accent/40 font-data text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span>✓</span>
                          <span>COMPLETED</span>
                        </span>
                      )}
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-pill bg-accent/20 border border-accent text-accent-text font-data text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          ACTIVE ASSIGNMENT
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2 py-0.5 rounded-pill bg-panel border border-line text-ink-muted font-data text-[10px] font-bold uppercase tracking-wider">
                          LOCKED
                        </span>
                      )}
                    </div>

                    <h3 className={`font-heading text-lg font-normal ${isLocked ? 'text-ink-muted' : 'text-ink'}`}>
                      {ch.title}
                    </h3>
                    <div className="font-data text-xs text-ink-muted mt-0.5">
                      {ch.tagline}
                    </div>
                  </div>
                </div>
              </div>

                {/* Target Location Scene Thumbnail */}
                {ch.sceneImage && (
                  <div className="relative w-full h-24 sm:h-28 rounded-[8px] overflow-hidden border border-line/60">
                    <img
                      src={ch.sceneImage}
                      alt={`${ch.title} location`}
                      className={`w-full h-full object-cover ${
                        isLocked
                          ? 'grayscale opacity-35 contrast-125'
                          : 'brightness-95 contrast-105'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-panel-light via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-1.5 left-2 font-data text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-ink-muted' : 'bg-accent'}`} />
                      <span className={isLocked ? 'text-ink-muted' : 'text-ink'}>{ch.target}</span>
                      <span className="text-[9px] text-ink-muted font-normal">({ch.mapLocation})</span>
                    </div>
                  </div>
                )}

                {/* Target & Lesson as Label/Value Pairs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line bg-panel p-2.5 rounded-[8px] border border-line font-data">
                  <div className="pb-2 sm:pb-0 sm:pr-3">
                    <span className="block text-[10px] uppercase tracking-[1.5px] text-ink-muted font-medium">
                      TARGET
                    </span>
                    <span className={`font-semibold text-[14px] sm:text-[15px] mt-0.5 block break-words ${isLocked ? 'text-ink-muted' : 'text-ink'}`}>
                      {ch.target} <span className="text-xs text-ink-muted font-normal">({ch.mapLocation})</span>
                    </span>
                  </div>
                  <div className="pt-2 sm:pt-0 sm:pl-3">
                    <span className="block text-[10px] uppercase tracking-[1.5px] text-ink-muted font-medium">
                      LESSON
                    </span>
                    <span className={`font-semibold text-[14px] sm:text-[15px] mt-0.5 block break-words ${isLocked ? 'text-ink-muted' : 'text-ink'}`}>
                      {ch.lesson}
                    </span>
                  </div>
                </div>

                {/* Dedicated Card Footer Row for Rewards & Action */}
                <div className="mt-auto pt-2.5 border-t border-line/40 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5 text-xs font-data flex-wrap">
                    <span className="font-semibold text-money-text text-[14px]">
                      +${ch.contract.bounty} BOUNTY
                    </span>
                    <span className="font-semibold text-accent-text text-[14px]">
                      -${ch.contract.debtReduction.toLocaleString()} DEBT
                    </span>
                    {ch.unlockRewardLabel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-pill bg-accent/10 text-accent-text border border-accent/20 uppercase tracking-wider">
                        {ch.unlockRewardLabel}
                      </span>
                    )}
                  </div>

                  <div>
                    {isLocked ? (
                      <Button
                        variant="secondary"
                        disabled
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick();
                        }}
                      >
                        LOCKED
                      </Button>
                    ) : (
                      <Button
                        variant={isCompleted ? 'secondary' : 'primary'}
                        arrow={!isCompleted}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectChapter(ch);
                        }}
                        data-testid={`select-chapter-button-${ch.id}`}
                      >
                        {isCompleted ? 'REVIEW BRIEFING' : isActive ? 'CONTINUE ASSIGNMENT' : 'VIEW BRIEFING'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer / Dev reset option */}
        <div className="pt-3 border-t border-line text-center shrink-0">
          <Button
            variant="ghost"
            compact
            confirm="RESET STORY PROGRESS?"
            onConfirm={async () => {
              await resetCampaign('chapter-1');
            }}
            className="text-[10px] text-ink-muted hover:text-danger uppercase tracking-wider"
          >
            RESET STORY CAMPAIGN
          </Button>
        </div>
      </div>
    </div>
  );
};
