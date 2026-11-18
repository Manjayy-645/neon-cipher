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
    <div className="scene-card bg-panel-light border border-line rounded-md p-4 sm:p-5 text-ink font-data shadow-card space-y-6">
      <p role="note" className="text-sm text-ink-muted leading-relaxed border border-line rounded-sm p-3 bg-panel">
        Sample archive. These badges, replay examples, contacts and dispatches demonstrate the interface; they are not verified achievements or live social presence.
      </p>
      {/* Header and Sub Navigation */}
      <div className="border-b border-line pb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-wide text-ink">DECKER NETWORK & EXTRAS</h2>
              <span className="type-label bg-accent/15 text-accent-text border border-accent/30 px-2 py-0.5 rounded-sm text-[10px] font-bold">
                SUBSYSTEMS
              </span>
            </div>
            <p className="type-label text-[10px] text-ink-muted mt-0.5">ACHIEVEMENTS, REPLAY VIEWER, SOCIAL ROSTER & INBOX</p>
          </div>
          <div className="text-xs text-ink-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Sample archive</span>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { key: 'achievements', label: 'Trophies', icon: '★' },
            { key: 'replay', label: 'Replays', icon: '▶' },
            { key: 'friends', label: 'Comms', icon: '●' },
            { key: 'inbox', label: `Inbox (${notifications.filter((n) => !n.read).length})`, icon: '✉' },
          ].map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant={subTab === tab.key ? 'primary' : 'secondary'}
              compact
              onClick={() => setSubTab(tab.key as any)}
              className={`min-h-[44px] flex items-center justify-center gap-2 font-bold transition-all ${
                subTab === tab.key ? 'shadow-xs ring-1 ring-accent/40' : 'hover:border-ink/40'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 1. Achievements View */}
      {subTab === 'achievements' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="type-label text-[10px] text-ink font-bold">DECKER MERIT BADGES</span>
            <span className="text-[10px] text-ink-muted">
              {achievements.filter((a) => a.unlocked).length} of {achievements.length} Unlocked
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {achievements.map((ach) => {
              const progressPct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));
              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-sm border flex flex-col justify-between gap-3 text-xs shadow-xs transition-colors ${
                    ach.unlocked
                      ? 'bg-panel border-accent/60 ring-1 ring-accent/20'
                      : 'bg-panel/50 border-line/70 hover:border-ink/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-ink text-sm block truncate">{ach.title}</span>
                        <span className="type-label text-[9px] text-ink-muted uppercase">{ach.category}</span>
                      </div>
                      <span
                        className={`type-label text-[9.5px] px-2 py-0.5 rounded-sm border font-bold shrink-0 ${
                          ach.unlocked
                            ? 'bg-accent/15 text-accent-text border-accent/40'
                            : 'bg-panel-light text-ink-muted border-line'
                        }`}
                      >
                        {ach.unlocked ? 'SAMPLE UNLOCK' : `${ach.progress}/${ach.maxProgress}`}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">{ach.description}</p>
                  </div>

                  {/* Progress & Reward Footer */}
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      {!ach.unlocked && (
                        <div className="w-full h-1.5 bg-panel-light rounded-pill overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-money-text text-xs sm:text-sm tabular-nums">
                        +{ach.rewardCoins} coins
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Interactive Replay Viewer with Nix Coach */}
      {subTab === 'replay' && currentReplay && (
        <div className="space-y-4">
          {/* Select Replay Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs bg-panel border border-line p-3 rounded-sm shadow-xs">
            <span className="type-label font-bold text-ink">SELECT LOG:</span>
            <select
              aria-label="Replay example"
              value={activeReplayId}
              onChange={(e) => {
                setActiveReplayId(e.target.value);
                setCurrentStepIndex(0);
              }}
              className="bg-panel-light border border-line p-2.5 rounded-sm text-xs font-bold text-ink min-h-[44px] w-full sm:w-auto shadow-xs"
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
            className="bg-terminal-bg text-terminal-ink border border-terminal-line p-4 sm:p-5 rounded-sm space-y-4 font-mono shadow-inner relative overflow-hidden"
          >
            {/* Terminal Header */}
            <div className="flex flex-wrap justify-between items-center text-xs border-b border-terminal-line pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                <span className="font-bold text-accent tracking-widest text-xs">
                  [BREACH REPLAY ANALYZER // NIX COACH V2.4]
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-terminal-muted">
                  NODE: <strong className="text-terminal-ink">{currentReplay.nodeName}</strong>
                </span>
                <span className="text-terminal-muted">
                  CODE: <strong className="text-accent">{currentReplay.secretCodeRevealed}</strong>
                </span>
                <span
                  className={`type-label px-2 py-0.5 rounded-sm border text-[9px] font-bold ${
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
              <div className="bg-terminal-panel border border-terminal-line p-3 sm:p-3.5 rounded-sm space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                  <span className="type-label text-[10px] text-accent font-bold tracking-wider">
                    POSSIBILITY FUNNEL (CANDIDATE COLLAPSE)
                  </span>
                  <span className="text-terminal-muted text-xs">
                    Remaining after Turn {currentStepIndex + 1}:{' '}
                    <strong className="text-accent text-sm tabular-nums">
                      {activeStepAnalysis && activeStepAnalysis.candidatesAfter != null
                        ? activeStepAnalysis.candidatesAfter.toLocaleString()
                        : '—'}{' '}
                      codes
                    </strong>
                  </span>
                </div>

                {/* Tactile Funnel Step Indicators */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
                  <span className="px-2 py-1 rounded-sm bg-terminal-bg border border-terminal-line text-terminal-muted font-semibold">
                    START: {analysisReport.initialCandidatesCount?.toLocaleString() ?? '5,040'}
                  </span>
                  {analysisReport.steps?.map((st, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    const isSolved = st.candidatesAfter === 1 || st.efficiencyTag === 'CLUTCH_SOLVE';

                    return (
                      <React.Fragment key={st.step}>
                        <span className="text-terminal-muted">→</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`px-2 py-1 rounded-sm border transition-all min-h-[32px] ${
                            isCurrent
                              ? 'bg-accent/30 text-accent border-accent font-bold ring-1 ring-accent'
                              : isSolved
                              ? 'bg-money/20 text-money border-money/40 font-semibold'
                              : 'bg-terminal-bg text-terminal-muted border-terminal-line hover:border-accent'
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
            <div className="bg-terminal-panel border border-terminal-line p-4 sm:p-5 rounded-sm space-y-3.5 text-center shadow-xs">
              <div className="flex justify-between items-center text-xs text-terminal-muted">
                <span className="type-label font-bold text-accent">
                  STEP {currentStepIndex + 1} OF {currentReplay.guesses.length}
                </span>
                <span className="text-[11px] text-terminal-muted">
                  Use Left / Right arrow keys to step
                </span>
              </div>

              {currentReplay.guesses[currentStepIndex] && (
                <div className="space-y-2 py-2">
                  <div className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.3em] text-terminal-ink">
                    {currentReplay.guesses[currentStepIndex].guess}
                  </div>

                  <div className="flex justify-center items-center gap-6 text-sm font-semibold">
                    <span className="text-accent flex items-center gap-1.5">
                      ● POT: {currentReplay.guesses[currentStepIndex].pots}
                    </span>
                    <span className="text-money flex items-center gap-1.5">
                      ○ PAN: {currentReplay.guesses[currentStepIndex].pans}
                    </span>
                    <span className="text-terminal-muted tabular-nums">
                      T+{currentReplay.guesses[currentStepIndex].timeElapsedSeconds}s
                    </span>
                  </div>

                  {currentReplay.guesses[currentStepIndex].note && (
                    <p className="text-xs italic text-terminal-muted">
                      &quot;{currentReplay.guesses[currentStepIndex].note}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Navigation Scrubber Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
                  className="flex-1 min-h-[44px] font-bold"
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
                  className="flex-1 min-h-[44px] font-bold"
                >
                  NEXT GUESS &gt;
                </Button>
              </div>
            </div>

            {/* Nix Turn Breakdown & Tactical Feedback */}
            {activeStepAnalysis && (
              <div className="bg-terminal-panel border border-terminal-line p-4 rounded-sm space-y-2.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="type-label text-[11px] font-bold text-accent">
                      NIX TURN {activeStepAnalysis.step} BREAKDOWN:
                    </span>
                    <span
                      className={`type-label text-[9.5px] px-2 py-0.5 rounded-sm font-bold border ${
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
                  <span className="text-xs text-terminal-muted">
                    Eliminated: <strong className="text-terminal-ink tabular-nums">-{activeStepAnalysis.eliminatedPercent}%</strong> of pool
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-terminal-ink leading-relaxed italic border-l-2 border-accent pl-3">
                  “{activeStepAnalysis.nixCommentary}”
                </div>
              </div>
            )}

            {/* Overall Nix Assessment (at end of log) */}
            {analysisReport && (
              <div className="bg-terminal-panel border border-terminal-line p-3.5 rounded-sm text-xs text-terminal-muted space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="type-label text-terminal-ink font-bold tracking-wider">OVERALL DEBRIEF</span>
                  <span>Wasted turns: {analysisReport.mistakesCount}</span>
                </div>
                <p className="text-xs text-terminal-ink leading-relaxed italic">
                  “{analysisReport.nixOverallReview}”
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Friends Roster */}
      {subTab === 'friends' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="type-label text-[10px] text-ink font-bold">DECKER COMMS FREQUENCIES</span>
            <span className="text-[10px] text-ink-muted">
              {friends.length} sample contacts · live availability unverified
            </span>
          </div>
          <div className="space-y-2">
            {friends.map((fr) => (
              <div
                key={fr.id}
                className="bg-panel border border-line hover:border-ink/50 transition-colors p-3.5 rounded-sm flex items-center justify-between text-xs shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-sm border border-line bg-panel-light flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fr.avatarUrl} alt="" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink truncate">{fr.handle}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          fr.status === 'online'
                            ? 'bg-accent animate-pulse'
                            : fr.status === 'in-breach'
                            ? 'bg-money animate-ping'
                            : 'bg-line'
                        }`}
                        title={fr.status}
                      />
                    </div>
                    <span className="text-xs text-ink-muted block mt-0.5">{fr.rankTitle}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="type-label text-[9px] block text-ink-muted">BEST STREAK</span>
                  <span className="font-bold text-accent-text text-sm sm:text-base tabular-nums">{fr.bestStreak} WINS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Notifications Inbox */}
      {subTab === 'inbox' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="type-label text-[10px] text-ink font-bold">ENCRYPTED DISPATCHES</span>
            <span className="text-[10px] text-ink-muted">
              {notifications.filter((n) => !n.read).length} Unread Messages
            </span>
          </div>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-sm border flex items-start justify-between gap-3 text-xs transition-colors shadow-xs ${
                  notif.read ? 'bg-panel/60 border-line opacity-80' : 'bg-panel border-accent/50 ring-1 ring-accent/20 font-medium'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink text-sm truncate">{notif.title}</span>
                    {!notif.read && (
                      <span className="type-label bg-danger/15 text-danger-text border border-danger/30 px-1.5 py-0.2 rounded-sm text-[9px] font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-ink-muted block tabular-nums">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {!notif.read && (
                  <Button
                    type="button"
                    variant="secondary"
                    compact
                    onClick={() => onMarkNotificationRead(notif.id)}
                    className="shrink-0 min-h-[44px] font-bold"
                  >
                    MARK READ
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
