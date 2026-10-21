'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChapterData } from '@neon-cipher/game-rules/src/index';
import { ChapterSelect } from '@/features/story/ChapterSelect';
import { NarrativeBriefing } from '@/features/story/NarrativeBriefing';
import { CoopConsole } from '@/features/coop/CoopConsole';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCampaignStore } from '@/stores/campaign-store';
import { emit } from '@/features/onboarding/events';

export default function CommsPage() {
  const router = useRouter();
  const { acceptChapter } = useCampaignStore();
  const [activeMode, setActiveMode] = useState<'campaign' | 'coop'>('campaign');
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
    <main className="scene-ground scene-arrive flex h-full w-full min-h-0 flex-col text-ink overflow-hidden">
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
            { id: 'coop', label: 'CO-OP HEISTS', testId: 'tab-coop' },
          ]}
        />
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        {activeMode === 'coop' ? (
          <CoopConsole onExit={() => setActiveMode('campaign')} />
        ) : selectedChapter ? (
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
      </div>
    </main>
  );
}
