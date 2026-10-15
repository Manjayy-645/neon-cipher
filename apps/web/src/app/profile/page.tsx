'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeckerProfileCard } from '@/features/profile/DeckerProfileCard';
import { SkillTreeView } from '@/features/profile/SkillTreeView';
import { FactionView } from '@/features/profile/FactionView';
import { DailyBreachView } from '@/features/profile/DailyBreachView';
import { ExtrasHub } from '@/features/profile/ExtrasHub';
import { profileService, ProfileAllData } from '@/features/profile/profileService';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const [data, setData] = useState<ProfileAllData | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'skills' | 'factions' | 'daily' | 'extras'>('profile');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRespeccing, setIsRespeccing] = useState(false);
  const [unlockingSkillId, setUnlockingSkillId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await profileService.getAll();
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCosmetics = async (cosmetics: any) => {
    try {
      const updatedProfile = await profileService.updateCosmetics(cosmetics);
      if (data) {
        setData({ ...data, profile: updatedProfile });
      }
      setStatusMessage('Cosmetics loadout updated.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to update cosmetics.');
    }
  };

  const handleUnlockSkill = async (skillId: string) => {
    setUnlockingSkillId(skillId);
    try {
      const res = await profileService.unlockSkill(skillId);
      if (data) {
        const updatedSkills = data.skillTree.skills.map((s) => (s.id === skillId ? res.skill : s));
        setData({
          ...data,
          skillTree: {
            skills: updatedSkills,
            availablePoints: res.remainingPoints,
          },
        });
      }
      setStatusMessage(`Skill unlocked: ${res.skill.name}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to unlock skill.');
    } finally {
      setUnlockingSkillId(null);
    }
  };

  const handleRespecSkills = async () => {
    setIsRespeccing(true);
    try {
      const res = await profileService.respecSkills();
      if (data) {
        setData({
          ...data,
          skillTree: {
            skills: res.skills,
            availablePoints: res.availablePoints,
          },
        });
      }
      setStatusMessage('Skill tree reset! All skill points refunded.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to respec skills.');
    } finally {
      setIsRespeccing(false);
    }
  };

  const handleAcceptContract = async (contractId: string) => {
    try {
      const res = await profileService.acceptContract(contractId);
      await loadData();
      setStatusMessage(res.warning ? `${res.message}. ${res.warning}` : res.message);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to accept contract.');
    }
  };

  const handleSubmitDaily = async (guesses: number, seconds: number) => {
    try {
      const updated = await profileService.submitDailyBreach(guesses, seconds);
      if (data) {
        setData({ ...data, dailyBreach: updated });
      }
      setStatusMessage(`Daily Breach submitted! Rank #${updated.userResult?.rank}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to submit daily breach.');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const updatedNotifs = await profileService.markNotificationRead(id);
      if (data) {
        setData({ ...data, notifications: updatedNotifs });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="scene-ground h-full w-full p-6 flex items-center justify-center font-data text-ink">
        <div className="text-center space-y-3 bg-panel-light border border-line p-6 rounded-md shadow-card max-w-xs">
          <div className="relative w-10 h-10 mx-auto">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            </div>
          </div>
          <p className="type-label text-xs tracking-wider text-ink font-bold">SYNCHRONIZING PROFILE MATRIX...</p>
          <p className="text-[10px] text-ink-muted">Establishing secure link with City grid</p>
        </div>
      </div>
    );
  }

  const SECTIONS = [
    {
      id: 'profile' as const,
      label: '8.0 Profile',
      tag: 'DOSSIER',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'skills' as const,
      label: '8.1 Skills',
      tag: `${data.skillTree.availablePoints} SP`,
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      id: 'factions' as const,
      label: '8.2 Factions',
      tag: 'DIPLOMACY',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: 'daily' as const,
      label: '8.3 Daily',
      tag: data.dailyBreach?.userCompleted ? '✓ DONE' : 'READY',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="22" y1="12" x2="18" y2="12" />
          <line x1="6" y1="12" x2="2" y2="12" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="18" />
        </svg>
      ),
    },
    {
      id: 'extras' as const,
      label: '8.4 Extras',
      tag: `${data.notifications?.filter((n) => !n.read).length || 0} NEW`,
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="scene-ground scene-arrive h-full w-full overflow-y-auto p-3 sm:p-5 font-data text-ink space-y-4">
      {/* Top Dossier Command Bar */}
      <div className="bg-panel-light border border-line rounded-md p-3 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm sm:text-base font-bold text-ink tracking-wide uppercase truncate">
                OPERATIVE DOSSIER
              </span>
              <span className="type-label text-[10px] bg-accent/15 text-accent-text border border-accent/30 px-1.5 py-0.5 rounded-sm font-bold shrink-0">
                LVL {data.profile.rank.level}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted truncate">
              {data.profile.rank.title} • GRID STATUS: ENCRYPTED & ACTIVE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-panel border border-line px-2.5 py-1 rounded-sm text-right">
            <span className="type-label text-[9px] block text-ink-muted">SKILL POINTS</span>
            <span className="font-bold text-accent-text text-xs sm:text-sm">
              {data.skillTree.availablePoints} SP
            </span>
          </div>
          <div className="bg-panel border border-line px-2.5 py-1 rounded-sm text-right">
            <span className="type-label text-[9px] block text-ink-muted">WIN STREAK</span>
            <span className="font-bold text-money-text text-xs sm:text-sm">
              {data.profile.stats.currentStreak} WINS
            </span>
          </div>
        </div>
      </div>

      {/* Top Section Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-panel/95 backdrop-blur-sm border-b border-line pb-2.5 pt-1 -mx-3 px-3 sm:-mx-5 sm:px-5">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {SECTIONS.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <Button
                key={tab.id}
                type="button"
                variant={isActive ? 'primary' : 'secondary'}
                compact
                onClick={() => setActiveSection(tab.id)}
                className={`flex-none min-h-[44px] px-3 transition-all duration-150 ${
                  isActive
                    ? 'ring-1 ring-accent/40 shadow-sm'
                    : 'hover:border-ink/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.icon}
                  <span className="font-bold tracking-wide">{tab.label}</span>
                  <span
                    className={`type-label text-[9px] px-1 py-0.2 rounded-sm border ${
                      isActive
                        ? 'bg-ink/10 text-ink border-ink/20'
                        : 'bg-panel-light text-ink-muted border-line'
                    }`}
                  >
                    {tab.tag}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Animated Toast Feedback */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-accent/15 border border-accent/40 px-4 py-2.5 text-accent-text text-xs rounded-sm shadow-sm flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="font-medium truncate">{statusMessage}</span>
            </div>
            <Button
              type="button"
              variant="icon"
              compact
              onClick={() => setStatusMessage(null)}
              className="text-accent hover:text-ink shrink-0 h-7 w-7 p-0 flex items-center justify-center border-none"
              aria-label="Dismiss message"
            >
              ✕
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Sections with Transitions */}
      <AnimatePresence>
        <div key={activeSection}>
          {activeSection === 'profile' && (
            <DeckerProfileCard
              profile={data.profile}
              onUpdateCosmetics={handleUpdateCosmetics}
            />
          )}

          {activeSection === 'skills' && (
            <SkillTreeView
              skills={data.skillTree.skills}
              availablePoints={data.skillTree.availablePoints}
              onUnlockSkill={handleUnlockSkill}
              unlockingId={unlockingSkillId}
              onRespec={handleRespecSkills}
              isRespeccing={isRespeccing}
            />
          )}

          {activeSection === 'factions' && (
            <FactionView
              factions={data.factions}
              onAcceptContract={handleAcceptContract}
            />
          )}

          {activeSection === 'daily' && (
            <DailyBreachView
              data={data.dailyBreach}
              onSubmitAttempt={handleSubmitDaily}
            />
          )}

          {activeSection === 'extras' && (
            <ExtrasHub
              achievements={data.achievements}
              replays={data.replays}
              friends={data.friends}
              notifications={data.notifications}
              onMarkNotificationRead={handleMarkNotificationRead}
            />
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}

