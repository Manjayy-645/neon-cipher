import { CampaignState } from '@/app/api/mock/db';
import { ChapterData } from '@neon-cipher/game-rules/src/index';

// MOCK: replace with Supabase.
export interface CompleteChapterResponse {
  success: boolean;
  state: CampaignState;
  chapter: ChapterData;
  debtReduced: number;
  remainingDebt: number;
  payout: number;
}

export const campaignService = {
  async getCampaign(): Promise<CampaignState> {
    const res = await fetch('/api/mock/campaign');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load campaign');
    }
    return res.json();
  },

  async acceptChapter(chapterId: string): Promise<CampaignState> {
    const res = await fetch('/api/mock/campaign/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept chapter');
    }
    const data = await res.json();
    return data.state;
  },

  async completeChapter(chapterId: string): Promise<CompleteChapterResponse> {
    const res = await fetch('/api/mock/campaign/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to complete chapter');
    }
    return res.json();
  },

  async updateTutorial(
    chapterId: string,
    update: { completed?: boolean; skipped?: boolean }
  ): Promise<CampaignState> {
    const res = await fetch('/api/mock/campaign/tutorial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, ...update }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update tutorial');
    }
    const data = await res.json();
    return data.state;
  },

  async resetCampaign(): Promise<CampaignState> {
    const res = await fetch('/api/mock/campaign/reset', {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset campaign');
    }
    const data = await res.json();
    return data.state;
  },
};
