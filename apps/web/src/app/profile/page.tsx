'use client';

import React, { useState, useEffect } from 'react';
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
      <div className="h-full w-full bg-panel p-6 flex items-center justify-center font-data text-ink">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="type-label text-xs">SYNCHRONIZING PROFILE MATRIX...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-panel overflow-y-auto p-4 sm:p-5 font-data text-ink space-y-4">
      {/* Top Section Navigation */}
      <div className="sticky top-0 z-10 bg-panel border-b border-line pb-2.5 pt-1">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: '8.0 Profile' },
            { id: 'skills', label: '8.1 Skills' },
            { id: 'factions', label: '8.2 Factions' },
            { id: 'daily', label: '8.3 Daily' },
            { id: 'extras', label: '8.4 Extras' },
          ].map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={activeSection === tab.id ? 'primary' : 'secondary'}
              compact
              onClick={() => setActiveSection(tab.id as any)}
              className="flex-none"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Toast Feedback */}
      {statusMessage && (
        <div className="bg-accent/15 border border-accent px-4 py-2 text-accent-text text-xs rounded-sm flex items-center justify-between">
          <span>{statusMessage}</span>
          <Button
            type="button"
            variant="icon"
            compact
            onClick={() => setStatusMessage(null)}
            className="text-accent ml-2"
            aria-label="Dismiss message"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Screen Sections */}
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
  );
}
