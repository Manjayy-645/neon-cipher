'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHydrated } from '@/lib/useHydrated';
import { getChapterById } from '@neon-cipher/game-rules';
import { ChapterData } from '@neon-cipher/game-rules/src/index';
import { ChapterSelect } from '@/features/story/ChapterSelect';
import { NarrativeBriefing } from '@/features/story/NarrativeBriefing';
import { CoopConsole } from '@/features/coop/CoopConsole';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCampaignStore } from '@/stores/campaign-store';
import { emit } from '@/features/onboarding/events';

export default function CommsPage() {
  const router = useRouter();
  const { acceptChapter, chapters } = useCampaignStore();
  const [activeMode, setActiveMode] = useState<'campaign' | 'coop'>('campaign');
  const hydrated = useHydrated();
  const queryChapter = hydrated ? getChapterById(new URLSearchParams(window.location.search).get('chapter') ?? '') : undefined;
  const [chapterChoice, setSelectedChapter] = useState<ChapterData | null | undefined>(undefined);
  const selectedChapter = chapterChoice === undefined ? queryChapter : chapterChoice;
  const selectedLocked = Boolean(selectedChapter && (chapters[selectedChapter.id]?.status === 'locked' || (!chapters[selectedChapter.id] && selectedChapter.number > 1)));

  useEffect(() => {
    emit({ type: 'comms:viewed' });
  }, []);

  const handleSelectChapter = (chapter: ChapterData) => {
    setSelectedChapter(chapter);
  };

  const handleAcceptAssignment = async () => {
    if (!selectedChapter || selectedLocked) return;
    await acceptChapter(selectedChapter.id);
    router.push('/map');
  };

  return (
    <main className="scene-ground scene-arrive flex h-full w-full min-h-0 flex-col text-ink overflow-hidden">
      {activeMode !== 'coop' && <>
      {/* Paper dossier heading: Missions remains a real destination even before online play unlocks. */}
      <header className="shrink-0 border-b border-line bg-panel px-4 py-3 sm:py-4 [@media(max-height:500px)]:py-2">
        <span className="block font-data text-[10px] uppercase tracking-[0.18em] text-accent-text [@media(max-height:500px)]:hidden">OPERATIONS DOSSIER / 02</span>
        <h1 className="font-heading text-xl font-semibold text-ink leading-tight mt-1">Missions & Heists</h1>
        <p className="font-data text-[11px] text-ink-muted mt-1 leading-relaxed [@media(max-height:500px)]:hidden">Track your campaign or practice a three-stage heist with Nix (AI).</p>
      </header>
      {/* Top Tab Bar: Story Campaign vs Co-op Heists */}
      <div className="bg-panel-light border-b border-line px-4 py-2 shrink-0 relative z-20">
        <SegmentedControl
          ariaLabel="Comms mode selector"
          value={activeMode}
          onChange={(val) => {
            setSelectedChapter(null);
            setActiveMode(val as 'campaign' | 'coop');
          }}
          options={[
            { id: 'campaign', label: 'STORY CAMPAIGN', testId: 'tab-campaign' },
            { id: 'coop', label: 'CO-OP PRACTICE', testId: 'tab-coop' },
          ]}
        />
      </div>

      </>}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        {activeMode === 'coop' ? (
          <CoopConsole onExit={() => setActiveMode('campaign')} />
        ) : selectedChapter ? (
          <NarrativeBriefing
            chapter={selectedChapter}
            locked={selectedLocked}
            onAccept={handleAcceptAssignment}
            onBack={() => setSelectedChapter(null)}
          />
        ) : (
          <ChapterSelect
            onSelectChapter={handleSelectChapter}
            onOpenMap={() => router.push('/map')}
          />
        )}
      </div>
    </main>
  );
}
