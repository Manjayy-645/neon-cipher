'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProfileReturnPath } from '@/lib/profile-navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DeckerProfileCard } from '@/features/profile/DeckerProfileCard';
import { SkillTreeView } from '@/features/profile/SkillTreeView';
import { FactionView } from '@/features/profile/FactionView';
import { DailyBreachView } from '@/features/profile/DailyBreachView';
import { ExtrasHub } from '@/features/profile/ExtrasHub';
import { profileService, ProfileAllData } from '@/features/profile/profileService';
import { Button } from '@/components/ui/Button';
import { usePlayerStore } from '@/stores/player-store';

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileAllData | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'skills' | 'factions' | 'daily' | 'extras'>('profile');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isRespeccing, setIsRespeccing] = useState(false);
  const [unlockingSkillId, setUnlockingSkillId] = useState<string | null>(null);

  const player = usePlayerStore();
  const { callsign, handle, level, xp, nextLevelXp, breachesWon, breachesTotal, careerEarnings, avatarUrl } = player;

  const effectiveProfile = React.useMemo(() => {
    if (!data?.profile) return null;
    const activeHandle = handle || callsign;
    const won = breachesWon;
    const total = breachesTotal;
    const failed = Math.max(0, total - won);
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

    return {
      ...data.profile,
      handle: activeHandle,
      avatarUrl: avatarUrl || data.profile.avatarUrl,
      rank: {
        ...data.profile.rank,
        level,
        currentXp: xp,
        nextLevelXp,
      },
      stats: {
        ...data.profile.stats,
        successfulBreaches: won,
        totalHacks: total,
        failedBreaches: failed,
        winRatePercent: winRate,
        totalCreditsEarned: careerEarnings,
      },
    };
  }, [data, callsign, handle, level, xp, nextLevelXp, breachesWon, breachesTotal, careerEarnings, avatarUrl]);

  const loadData = async () => {
    try {
      const res = await profileService.getAll();
      setData(res);
    } catch (err: any) {
      console.error(err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    profileService.getAll().then(setData).catch(() => setLoadError(true)).finally(() => setIsLoading(false));
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
      setStatusMessage(`Preview result saved. Sample rank #${updated.userResult?.rank}`);
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

  if (loadError && !data) {
    return <div className="scene-ground h-full overflow-y-auto p-6 flex flex-col items-start justify-center gap-4">
      <h1 className="font-heading text-2xl">Profile unavailable</h1>
      <p className="text-sm text-ink-muted" role="alert">The dossier could not be loaded. Your current game progress is unchanged.</p>
      <Button onClick={() => { setLoadError(false); setIsLoading(true); void loadData(); }}>Try again</Button>
      <Link href="/map" onClick={(event) => { event.preventDefault(); router.push(getProfileReturnPath()); }} className="min-h-[44px] inline-flex items-center underline text-accent-text">Back to previous screen</Link>
    </div>;
  }

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
    { id: 'profile' as const, label: 'Profile', tag: 'Dossier' },
    { id: 'skills' as const, label: 'Skills', tag: `${data.skillTree.availablePoints} SP` },
    { id: 'factions' as const, label: 'Factions', tag: 'Contracts' },
    { id: 'daily' as const, label: 'Daily', tag: 'Preview' },
    { id: 'extras' as const, label: 'Network & extras', tag: 'Sample archive' },
  ];

  return (
    <div className="scene-ground scene-arrive h-full w-full overflow-y-auto min-h-0 p-3 sm:p-5 font-data text-ink space-y-4 pb-6 pb-safe-bottom lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-4 lg:space-y-0 lg:content-start">
      <Link href="/map" onClick={(event) => { event.preventDefault(); router.push(getProfileReturnPath()); }} className="lg:col-span-2 inline-flex items-center min-h-[44px] text-sm text-accent-text underline underline-offset-4">← Back to previous screen</Link>
      {/* Top Dossier Command Bar */}
      <div className="lg:col-span-2 bg-panel-light border border-line rounded-md p-3 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm sm:text-base font-bold text-ink tracking-wide uppercase truncate">
                Profile dossier
              </span>
              <span className="type-label text-[10px] bg-accent/15 text-accent-text border border-accent/30 px-1.5 py-0.5 rounded-sm font-bold shrink-0">
                LVL {effectiveProfile?.rank.level ?? data.profile.rank.level}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted truncate">
              {effectiveProfile?.rank.title ?? data.profile.rank.title} • Player record
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

      <nav aria-label="Profile sections" className="lg:col-start-1 lg:row-span-3 lg:sticky lg:top-0 lg:self-start bg-panel-light border border-line rounded-md p-3">
        <label htmlFor="profile-section" className="type-label block mb-2 lg:hidden">Dossier section</label>
        <select id="profile-section" value={activeSection}
          onChange={(event) => setActiveSection(event.target.value as typeof activeSection)}
          className="lg:hidden w-full min-h-[44px] bg-panel-light border border-line rounded-sm px-3 text-sm text-ink">
          {SECTIONS.map((section) => <option key={section.id} value={section.id}>{section.label} · {section.tag}</option>)}
        </select>
        <div className="hidden lg:flex lg:flex-col gap-2">
          {SECTIONS.map((section) => (
            <Button key={section.id} type="button" variant={activeSection === section.id ? 'primary' : 'secondary'}
              onClick={() => setActiveSection(section.id)} aria-current={activeSection === section.id ? 'page' : undefined}
              className="min-h-[44px] w-full justify-between text-left">
              <span>{section.label}</span><span className="text-[10px] normal-case tracking-normal">{section.tag}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Animated Toast Feedback */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="lg:col-start-2 bg-accent/15 border border-accent/40 px-4 py-2.5 text-accent-text text-xs rounded-sm shadow-sm flex items-center justify-between gap-2"
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
        <div key={activeSection} className="lg:col-start-2 min-w-0" aria-label={`${SECTIONS.find((section) => section.id === activeSection)?.label} section`}>
          {activeSection === 'profile' && (
            <DeckerProfileCard
              profile={effectiveProfile || data.profile}
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

