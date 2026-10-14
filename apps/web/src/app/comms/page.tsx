'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChapterData, getChapterById } from '@neon-cipher/game-rules/src/index';
import { ChapterSelect } from '@/features/story/ChapterSelect';
import { NarrativeBriefing } from '@/features/story/NarrativeBriefing';
import { useCampaignStore } from '@/stores/campaign-store';
import { emit } from '@/features/onboarding/events';

export default function CommsPage() {
  const router = useRouter();
  const { acceptChapter, activeChapterId } = useCampaignStore();
  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(null);

  useEffect(() => {
    emit({ type: 'comms:viewed' });
  }, []);

  const handleSelectChapter = (chapter: ChapterData) => {
    setSelectedChapter(chapter);
  };

  const handleAcceptAssignment = async () => {
    if (!selectedChapter) return;
    await acceptChapter(selectedChapter.id);
    router.push('/map');
  };

  return (
    <main className="scene-ground scene-arrive w-full h-full relative overflow-hidden">
      {selectedChapter ? (
        <NarrativeBriefing
          chapter={selectedChapter}
          onAccept={handleAcceptAssignment}
          onBack={() => setSelectedChapter(null)}
        />
      ) : (
        <ChapterSelect
          onSelectChapter={handleSelectChapter}
          onOpenMap={() => router.push('/map')}
        />
      )}
    </main>
  );
}
