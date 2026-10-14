'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Achievement,
  BreachReplay,
  FriendProfile,
  AppNotification,
  analyzeBreachReplay,
  ReplayAnalysisReport,
} from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

export interface ExtrasHubProps {
  achievements: Achievement[];
  replays: BreachReplay[];
  friends: FriendProfile[];
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
}

export const ExtrasHub: React.FC<ExtrasHubProps> = ({
  achievements,
  replays,
  friends,
  notifications,
  onMarkNotificationRead,
}) => {
  const [subTab, setSubTab] = useState<'achievements' | 'replay' | 'friends' | 'inbox'>('achievements');

  // Replay viewer state
  const [activeReplayId, setActiveReplayId] = useState<string>(replays[0]?.id || '');
  const currentReplay = replays.find((r) => r.id === activeReplayId) || replays[0];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Derive or calculate Replay Analysis Report
  const analysisReport: ReplayAnalysisReport | null = useMemo(() => {
    if (!currentReplay) return null;
    if (currentReplay.analysis) return currentReplay.analysis;

    // Fallback: Calculate replay analysis client-side if missing
    try {
      const codeDigits = currentReplay.secretCodeRevealed
        ? currentReplay.secretCodeRevealed.split('').map(Number)
        : [0, 0, 0, 0];
      return analyzeBreachReplay(codeDigits, currentReplay.guesses, {
        length: currentReplay.targetDigits || 4,
      });
    } catch {
      return null;
    }
  }, [currentReplay]);

  // Keyboard navigation for Replay Scrubber (Left / Right Arrow)
  useEffect(() => {
    if (subTab !== 'replay' || !currentReplay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentStepIndex((prev) => Math.min(currentReplay.guesses.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subTab, currentReplay]);

  const activeStepAnalysis = analysisReport?.steps?.[currentStepIndex];

  return (
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 text-ink font-data shadow-card space-y-4">
      {/* Header and Sub Navigation */}
      <div className="border-b border-line pb-3">
        <h2 className="font-heading text-title tracking-wide">DECKER NETWORK & EXTRAS</h2>
        <p className="type-label text-[10px] text-ink-muted">ACHIEVEMENTS, REPLAY VIEWER, SOCIAL ROSTER & INBOX</p>

        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[
            { key: 'achievements', label: 'Trophies' },
            { key: 'replay', label: 'Replays' },
            { key: 'friends', label: 'Comms' },
            { key: 'inbox', label: `Inbox (${notifications.filter((n) => !n.read).length})` },
          ].map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant={subTab === tab.key ? 'primary' : 'secondary'}
              compact
              onClick={() => setSubTab(tab.key as any)}
              className="min-h-[44px]"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 1. Achievements View */}
      {subTab === 'achievements' && (
        <div className="space-y-2.5">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded-sm border flex items-center justify-between text-xs ${
                ach.unlocked ? 'bg-panel border-accent/40' : 'bg-panel/60 border-line opacity-75'
              }`}
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{ach.title}</span>
                  <span
                    className={`type-label text-[9px] px-1 py-0.5 rounded-sm border ${
                      ach.unlocked
                        ? 'bg-accent/15 text-accent-text border-accent/30'
                        : 'bg-panel-light text-ink-muted border-line'
                    }`}
                  >
                    {ach.unlocked ? 'CLAIMED' : `${ach.progress}/${ach.maxProgress}`}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-tight">{ach.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-money-text text-sm block">+{ach.rewardCoins} coins</span>
                <span className="type-label text-[9px]">{ach.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Interactive Replay Viewer with Nix Coach */}
      {subTab === 'replay' && currentReplay && (
        <div className="space-y-4">
          {/* Select Replay Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="type-label">SELECT LOG:</span>
            <select
              value={activeReplayId}
              onChange={(e) => {
                setActiveReplayId(e.target.value);
                setCurrentStepIndex(0);
              }}
              className="bg-panel border border-line p-2 rounded-sm text-xs text-ink min-h-[44px] w-full sm:w-auto"
            >
              {replays.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nodeName} ({r.date}) • {r.won ? 'VICTORY' : 'FAILED'}
                </option>
              ))}
            </select>
          </div>

          {/* Replay Details Terminal Card */}
          <div
            data-surface="terminal"
            className="bg-[#0b100e] text-[#d4ded8] border border-[#234237] p-4 rounded-sm space-y-4 font-mono shadow-inner relative overflow-hidden"
          >
            {/* Terminal Header */}
            <div className="flex flex-wrap justify-between items-center text-xs border-b border-[#234237] pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="font-bold text-accent tracking-widest text-[11px]">
                  [BREACH REPLAY ANALYZER // NIX COACH V2.4]
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-[#8ba396]">
                  NODE: <strong className="text-[#d4ded8]">{currentReplay.nodeName}</strong>
                </span>
                <span className="text-[#8ba396]">
                  CODE: <strong className="text-accent">{currentReplay.secretCodeRevealed}</strong>
                </span>
                <span
                  className={`type-label px-1.5 py-0.5 rounded-sm border text-[9px] font-bold ${
                    currentReplay.won
                      ? 'bg-accent/20 text-accent border-accent/40'
                      : 'bg-danger/20 text-danger border-danger/40'
                  }`}
                >
                  {currentReplay.won ? 'BREACH SUCCESS' : 'FAILED'}
                </span>
              </div>
            </div>

            {/* Possibility Funnel Counter Banner */}
            {analysisReport && (
              <div className="bg-[#101915] border border-[#1e3b30] p-3 rounded-sm space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                  <span className="type-label text-[10px] text-accent font-bold tracking-wider">
                    POSSIBILITY FUNNEL (CANDIDATE COLLAPSE)
                  </span>
                  <span className="text-[#8ba396] text-[10px]">
                    Remaining after Turn {currentStepIndex + 1}:{' '}
                    <strong className="text-accent text-xs">
                      {activeStepAnalysis && activeStepAnalysis.candidatesAfter != null
                        ? activeStepAnalysis.candidatesAfter.toLocaleString()
                        : '—'}{' '}
                      codes
                    </strong>
                  </span>
                </div>

                {/* Tactile Funnel Step Indicators */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
                  <span className="px-1.5 py-0.5 rounded-sm bg-[#162520] border border-[#234237] text-[#8ba396]">
                    START: {analysisReport.initialCandidatesCount?.toLocaleString() ?? '5,040'}
                  </span>
                  {analysisReport.steps?.map((st, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    const isSolved = st.candidatesAfter === 1 || st.efficiencyTag === 'CLUTCH_SOLVE';

                    return (
                      <React.Fragment key={st.step}>
                        <span className="text-[#3d6856]">→</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`px-1.5 py-0.5 rounded-sm border transition-all ${
                            isCurrent
                              ? 'bg-accent/30 text-accent border-accent font-bold ring-1 ring-accent'
                              : isSolved
                              ? 'bg-money/20 text-money border-money/40 font-semibold'
                              : 'bg-[#162520] text-[#a2bbb0] border-[#234237] hover:border-[#3d6856]'
                          }`}
                        >
                          T{st.step}: {st.candidatesAfter != null ? st.candidatesAfter.toLocaleString() : '—'}
                          {isSolved ? ' (SOLVED!)' : ''}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stepper / Active Guess Display */}
            <div className="bg-[#0e1713] border border-[#1e3b30] p-4 rounded-sm space-y-3 text-center">
              <div className="flex justify-between items-center text-[10px] text-[#8ba396]">
                <span className="type-label">
                  STEP {currentStepIndex + 1} OF {currentReplay.guesses.length}
                </span>
                <span className="text-[10px] text-[#6d8a7c]">
                  Use Left / Right arrow keys to step
                </span>
              </div>

              {currentReplay.guesses[currentStepIndex] && (
                <div className="space-y-2 py-1">
                  <div className="font-mono text-3xl font-bold tracking-[0.25em] text-[#e8f1ec]">
                    {currentReplay.guesses[currentStepIndex].guess}
                  </div>

                  <div className="flex justify-center items-center gap-5 text-xs font-semibold">
                    <span className="text-accent flex items-center gap-1">
                      ● POT: {currentReplay.guesses[currentStepIndex].pots}
                    </span>
                    <span className="text-money flex items-center gap-1">
                      ○ PAN: {currentReplay.guesses[currentStepIndex].pans}
                    </span>
                    <span className="text-[#8ba396]">
                      T+{currentReplay.guesses[currentStepIndex].timeElapsedSeconds}s
                    </span>
                  </div>

                  {currentReplay.guesses[currentStepIndex].note && (
                    <p className="text-[11px] italic text-[#8ba396]">
                      "{currentReplay.guesses[currentStepIndex].note}"
                    </p>
                  )}
                </div>
              )}

              {/* Navigation Scrubber Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
                  className="flex-1 min-h-[44px]"
                >
                  &lt; PREV GUESS
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  arrow
                  disabled={currentStepIndex === currentReplay.guesses.length - 1}
                  onClick={() =>
                    setCurrentStepIndex((i) => Math.min(currentReplay.guesses.length - 1, i + 1))
                  }
                  className="flex-1 min-h-[44px]"
                >
                  NEXT GUESS &gt;
                </Button>
              </div>
            </div>

            {/* Nix Turn Breakdown & Tactical Feedback */}
            {activeStepAnalysis && (
              <div className="bg-[#121e19] border border-[#264b3e] p-3.5 rounded-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="type-label text-[10px] font-bold text-accent">
                      NIX TURN {activeStepAnalysis.step} BREAKDOWN:
                    </span>
                    <span
                      className={`type-label text-[9px] px-2 py-0.5 rounded-sm font-bold border ${
                        activeStepAnalysis.efficiencyTag === 'OPTIMAL_ELIMINATION'
                          ? 'bg-accent/20 text-accent border-accent/40'
                          : activeStepAnalysis.efficiencyTag === 'CLUTCH_SOLVE'
                          ? 'bg-money/20 text-money border-money/40'
                          : activeStepAnalysis.efficiencyTag === 'WASTED_DEAD_DIGIT'
                          ? 'bg-danger/20 text-danger border-danger/40'
                          : activeStepAnalysis.efficiencyTag === 'MISSED_POSITION_LOCK'
                          ? 'bg-danger/20 text-danger border-danger/40'
                          : 'bg-panel text-ink-muted border-line'
                      }`}
                    >
                      {activeStepAnalysis.efficiencyTag.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8ba396]">
                    Eliminated: <strong className="text-[#d4ded8]">-{activeStepAnalysis.eliminatedPercent}%</strong> of pool
                  </span>
                </div>

                <div className="text-xs text-[#b8ccc2] leading-relaxed italic border-l-2 border-accent pl-2.5">
                  “{activeStepAnalysis.nixCommentary}”
                </div>
              </div>
            )}

            {/* Overall Nix Assessment (at end of log) */}
            {analysisReport && (
              <div className="bg-[#0e1713] border border-[#1e3b30] p-3 rounded-sm text-xs text-[#8ba396] space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="type-label text-[#a2bbb0] font-bold">OVERALL DEBRIEF</span>
                  <span>Wasted turns: {analysisReport.mistakesCount}</span>
                </div>
                <p className="text-[11px] text-[#b8ccc2] leading-relaxed">
                  “{analysisReport.nixOverallReview}”
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Friends Roster */}
      {subTab === 'friends' && (
        <div className="space-y-2.5">
          {friends.map((fr) => (
            <div
              key={fr.id}
              className="bg-panel border border-line p-3 rounded-sm flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm border border-line bg-panel-light flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fr.avatarUrl} alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{fr.handle}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        fr.status === 'online'
                          ? 'bg-accent'
                          : fr.status === 'in-breach'
                          ? 'bg-money'
                          : 'bg-line'
                      }`}
                      title={fr.status}
                    />
                  </div>
                  <span className="text-[10px] text-ink-muted">{fr.rankTitle}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="type-label text-[9px] block">BEST STREAK</span>
                <span className="font-bold text-accent-text">{fr.bestStreak} WINS</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Notifications Inbox */}
      {subTab === 'inbox' && (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-sm border flex items-start justify-between gap-2 text-xs transition-colors ${
                notif.read ? 'bg-panel/60 border-line opacity-80' : 'bg-panel border-accent/40 font-medium'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{notif.title}</span>
                  {!notif.read && (
                    <span className="type-label bg-danger/15 text-danger-text border border-danger/30 px-1 py-0.2 rounded-sm text-[9px]">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">{notif.message}</p>
                <span className="text-[9.5px] text-ink-muted block mt-1">
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {!notif.read && (
                <Button
                  type="button"
                  variant="secondary"
                  compact
                  onClick={() => onMarkNotificationRead(notif.id)}
                  className="shrink-0 min-h-[44px]"
                >
                  MARK READ
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
