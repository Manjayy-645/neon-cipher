'use client';

import React, { useState } from 'react';
import {
  Achievement,
  BreachReplay,
  FriendProfile,
  AppNotification,
} from '@neon-cipher/game-rules';
import { Button } from '@/components/ui/Button';

interface ExtrasHubProps {
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

  return (
    <div className="bg-panel-light border border-line rounded-md p-4 text-ink font-data shadow-card space-y-4">
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

      {/* 2. Replay Viewer */}
      {subTab === 'replay' && currentReplay && (
        <div className="space-y-4">
          {/* Select Replay Dropdown */}
          <div className="flex items-center justify-between text-xs">
            <span className="type-label">SELECT LOG:</span>
            <select
              value={activeReplayId}
              onChange={(e) => {
                setActiveReplayId(e.target.value);
                setCurrentStepIndex(0);
              }}
              className="bg-panel border border-line p-1.5 rounded-sm text-xs text-ink"
            >
              {replays.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nodeName} ({r.date})
                </option>
              ))}
            </select>
          </div>

          {/* Replay Details */}
          <div className="bg-panel border border-line p-3.5 rounded-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-sm text-ink">{currentReplay.nodeName}</h4>
                <span className="text-ink-muted">{currentReplay.targetDigits} Digits • Code: {currentReplay.secretCodeRevealed}</span>
              </div>
              <span className="type-label text-accent-text font-bold">
                {currentReplay.won ? 'BREACH SUCCESS' : 'FAILED'}
              </span>
            </div>

            {/* Stepper Controls */}
            <div className="bg-panel-light border border-line p-3 rounded-sm space-y-2 text-center">
              <span className="type-label text-[10px]">
                STEP {currentStepIndex + 1} OF {currentReplay.guesses.length}
              </span>

              {currentReplay.guesses[currentStepIndex] && (
                <div className="space-y-1">
                  <div className="font-data text-2xl font-bold tracking-widest text-ink">
                    {currentReplay.guesses[currentStepIndex].guess}
                  </div>
                  <div className="flex justify-center gap-4 text-xs font-semibold">
                    <span className="text-accent-text">
                      ● POT: {currentReplay.guesses[currentStepIndex].pots}
                    </span>
                    <span className="text-money-text">
                      ○ PAN: {currentReplay.guesses[currentStepIndex].pans}
                    </span>
                    <span className="text-ink-muted">
                      T+{currentReplay.guesses[currentStepIndex].timeElapsedSeconds}s
                    </span>
                  </div>
                  {currentReplay.guesses[currentStepIndex].note && (
                    <p className="text-[11px] italic text-ink-muted mt-1">
                      "{currentReplay.guesses[currentStepIndex].note}"
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  compact
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
                  className="flex-1"
                >
                  PREV GUESS
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  compact
                  arrow
                  disabled={currentStepIndex === currentReplay.guesses.length - 1}
                  onClick={() => setCurrentStepIndex((i) => Math.min(currentReplay.guesses.length - 1, i + 1))}
                  className="flex-1"
                >
                  NEXT GUESS
                </Button>
              </div>
            </div>
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
                  className="shrink-0"
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
