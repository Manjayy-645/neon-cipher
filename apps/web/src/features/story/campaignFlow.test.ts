import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getCampaignRoute } from '@/app/api/mock/campaign/route';
import { POST as acceptRoute } from '@/app/api/mock/campaign/accept/route';
import { POST as completeRoute } from '@/app/api/mock/campaign/complete/route';
import { POST as tutorialRoute } from '@/app/api/mock/campaign/tutorial/route';
import { POST as resetRoute } from '@/app/api/mock/campaign/reset/route';
import { POST as purchaseRoute } from '@/app/api/mock/wallet/purchase/route';
import { getCampaignState, resetCampaignProgress, mockWallet } from '@/app/api/mock/db';
import { getChapterById } from '@neon-cipher/game-rules/src/index';

describe('Task 10: Campaign Mock Server Persistence & Progression', () => {
  beforeEach(() => {
    resetCampaignProgress();
  });

  it('GET /api/mock/campaign returns initial campaign state with $10,000 debt', async () => {
    const res = await getCampaignRoute();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.debt.initial).toBe(10000);
    expect(data.debt.current).toBe(10000);
    expect(data.debt.paid).toBe(0);
    expect(data.chapters['chapter-1'].status).toBe('available');
    expect(data.chapters['chapter-2'].status).toBe('locked');
    expect(data.unlocks.blackMarket).toBe(false);
    expect(data.unlocks.onlinePlay).toBe(false);
  });

  it('POST /api/mock/campaign/accept sets the chapter as active', async () => {
    const req = new Request('http://localhost/api/mock/campaign/accept', {
      method: 'POST',
      body: JSON.stringify({ chapterId: 'chapter-1' }),
    });
    const res = await acceptRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.state.activeChapterId).toBe('chapter-1');
    expect(data.state.chapters['chapter-1'].status).toBe('active');
  });

  it('progresses from Chapter 1 to Chapter 4 with exact unlocks and debt reduction', async () => {
    // 1. Complete Chapter 1
    const req1 = new Request('http://localhost/api/mock/campaign/complete', {
      method: 'POST',
      body: JSON.stringify({ chapterId: 'chapter-1' }),
    });
    const res1 = await completeRoute(req1);
    const data1 = await res1.json();

    expect(data1.success).toBe(true);
    expect(data1.debtReduced).toBe(1500);
    expect(data1.remainingDebt).toBe(8500);
    // Chapter 2 unlocked!
    expect(data1.state.chapters['chapter-2'].status).toBe('available');
    expect(data1.state.unlocks.blackMarket).toBe(false);

    // 2. Complete Chapter 2 -> Unlocks Black Market!
    const req2 = new Request('http://localhost/api/mock/campaign/complete', {
      method: 'POST',
      body: JSON.stringify({ chapterId: 'chapter-2' }),
    });
    const res2 = await completeRoute(req2);
    const data2 = await res2.json();

    expect(data2.debtReduced).toBe(2500);
    expect(data2.remainingDebt).toBe(6000);
    expect(data2.state.chapters['chapter-3'].status).toBe('available');
    // Acceptance criterion: Chapter 2 completion unlocks Black Market on the map!
    expect(data2.state.unlocks.blackMarket).toBe(true);

    // 3. Complete Chapter 3 -> Unlocks Bridge!
    const req3 = new Request('http://localhost/api/mock/campaign/complete', {
      method: 'POST',
      body: JSON.stringify({ chapterId: 'chapter-3' }),
    });
    const res3 = await completeRoute(req3);
    const data3 = await res3.json();

    expect(data3.debtReduced).toBe(3000);
    expect(data3.remainingDebt).toBe(3000);
    expect(data3.state.unlocks.bridge).toBe(true);
    expect(data3.state.chapters['chapter-4'].status).toBe('available');

    // 4. Complete Chapter 4 -> Unlocks Online Play and clears debt!
    const req4 = new Request('http://localhost/api/mock/campaign/complete', {
      method: 'POST',
      body: JSON.stringify({ chapterId: 'chapter-4' }),
    });
    const res4 = await completeRoute(req4);
    const data4 = await res4.json();

    expect(data4.debtReduced).toBe(3000);
    expect(data4.remainingDebt).toBe(0);
    expect(data4.state.debt.paid).toBe(10000);
    // Acceptance criterion: Chapter 4 completion unlocks online play!
    expect(data4.state.unlocks.onlinePlay).toBe(true);
  });

  it('updates and skips tutorial progress via API', async () => {
    const req = new Request('http://localhost/api/mock/campaign/tutorial', {
      method: 'POST',
      body: JSON.stringify({ chapterId: 'chapter-1', skipped: true }),
    });
    const res = await tutorialRoute(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.state.tutorials['chapter-1'].skipped).toBe(true);
  });

  it('resets campaign to initial state via reset API', async () => {
    // Complete ch 1 first
    await completeRoute(
      new Request('http://localhost/api/mock/campaign/complete', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-1' }),
      })
    );

    // Reset
    const res = await resetRoute();
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.state.debt.current).toBe(10000);
    expect(data.state.debt.paid).toBe(0);
    expect(data.state.chapters['chapter-1'].status).toBe('available');
    expect(data.state.chapters['chapter-2'].status).toBe('locked');
  });
});

describe('Task 10 Acceptance: Chapter 1 On-Screen Guidance Walkthrough', () => {
  it('supplies complete sequential on-screen steps for a new player to finish Chapter 1', () => {
    const chapter1 = getChapterById('chapter-1');
    expect(chapter1).toBeDefined();

    const steps = chapter1!.tutorialSteps!;
    expect(steps.length).toBeGreaterThanOrEqual(6);

    // Step 1: Spotlight on soda machine node on the map
    expect(steps[0].phase).toBe('map');
    expect(steps[0].targetSelector).toBe('[data-marker-id="n1"]');
    expect(steps[0].actionRequired).toBe('tap-node');
    expect(steps[0].nixDialogue).toContain('soda machine');

    // Step 2: Spotlight on JACK IN button in bottom sheet
    expect(steps[1].phase).toBe('sheet');
    expect(steps[1].targetSelector).toBe('[data-tutorial="jack-in"]');
    expect(steps[1].actionRequired).toBe('tap-jack-in');
    expect(steps[1].nixDialogue).toContain('JACK IN');

    // Step 3: Spotlight on keypad probe input
    expect(steps[2].phase).toBe('terminal');
    expect(steps[2].targetSelector).toBe('[data-tutorial="keypad"]');
    expect(steps[2].actionRequired).toBe('input-digits');
    expect(steps[2].nixDialogue).toContain('3 different digits');

    // Step 4: Spotlight on SUBMIT guess button
    expect(steps[3].phase).toBe('terminal');
    expect(steps[3].targetSelector).toBe('[data-tutorial="submit"]');
    expect(steps[3].actionRequired).toBe('submit-guess');
    expect(steps[3].nixDialogue).toContain('SUBMIT');

    // Step 5: Spotlight on Guess History clue explanation (Pot, Pan, Miss)
    expect(steps[4].phase).toBe('terminal');
    expect(steps[4].targetSelector).toBe('[data-tutorial="history"]');
    expect(steps[4].actionRequired).toBe('dismiss-callout');
    expect(steps[4].nixDialogue).toContain('POT');
    expect(steps[4].nixDialogue).toContain('PAN');

    // Step 6: Elimination and crack
    expect(steps[5].phase).toBe('terminal');
    expect(steps[5].targetSelector).toBe('[data-tutorial="keypad"]');
    expect(steps[5].actionRequired).toBe('free-play');
    expect(steps[5].nixDialogue).toContain('Dead digits');
  });
});

describe('Story Mode Power-Up Rewards & Black Market Gating', () => {
  beforeEach(() => {
    resetCampaignProgress();
    mockWallet.credits = 10000;
  });

  it('rewards Starter Intrusion Bundle (Firewall Patch x2 + Static Injector x2) on completing Chapter 2', async () => {
    const initialPatch = mockWallet.inventory['tool-firewall-patch'] || 0;
    const initialInjector = mockWallet.inventory['tool-static-injector'] || 0;

    // Complete Chapter 1 first
    await completeRoute(
      new Request('http://localhost/api/mock/campaign/complete', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-1' }),
      })
    );

    // Complete Chapter 2
    const res = await completeRoute(
      new Request('http://localhost/api/mock/campaign/complete', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-2' }),
      })
    );
    expect(res.status).toBe(200);

    expect(mockWallet.inventory['tool-firewall-patch']).toBe(initialPatch + 2);
    expect(mockWallet.inventory['tool-static-injector']).toBe(initialInjector + 2);
  });

  it('rewards Tactical Care Package (Frequency Probe x2 + Cryo-Pulse Spike x1) on accepting Chapter 3', async () => {
    const initialProbe = mockWallet.inventory['tool-frequency-probe'] || 0;
    const initialCryo = mockWallet.inventory['tool-cryo-pulse'] || 0;

    const res = await acceptRoute(
      new Request('http://localhost/api/mock/campaign/accept', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-3' }),
      })
    );
    expect(res.status).toBe(200);

    expect(mockWallet.inventory['tool-frequency-probe']).toBe(initialProbe + 2);
    expect(mockWallet.inventory['tool-cryo-pulse']).toBe(initialCryo + 1);
  });

  it('enforces Black Market lock on Cryo-Pulse Spike until Chapter 3 is completed, and Zero-Day until Chapter 4', async () => {
    // 1. Attempt to buy Cryo-Pulse Spike before Chapter 3 is cleared -> blocked (403)
    const cryoReq1 = new Request('http://localhost/api/mock/wallet/purchase', {
      method: 'POST',
      body: JSON.stringify({ itemId: 'tool-cryo-pulse' }),
    });
    const cryoRes1 = await purchaseRoute(cryoReq1);
    expect(cryoRes1.status).toBe(403);
    const cryoErr1 = await cryoRes1.json();
    expect(cryoErr1.error).toContain('requires clearing Chapter 3');

    // 2. Complete Chapters 1, 2, and 3
    await completeRoute(
      new Request('http://localhost/api/mock/campaign/complete', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-1' }),
      })
    );
    await completeRoute(
      new Request('http://localhost/api/mock/campaign/complete', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-2' }),
      })
    );
    await completeRoute(
      new Request('http://localhost/api/mock/campaign/complete', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-3' }),
      })
    );

    // Now purchasing Cryo-Pulse Spike succeeds!
    const cryoRes2 = await purchaseRoute(
      new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'tool-cryo-pulse' }),
      })
    );
    expect(cryoRes2.status).toBe(200);

    // 3. Attempt to buy Zero-Day Exploit before Chapter 4 is cleared -> blocked (403)
    const zdRes1 = await purchaseRoute(
      new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'tool-zero-day' }),
      })
    );
    expect(zdRes1.status).toBe(403);
    const zdErr1 = await zdRes1.json();
    expect(zdErr1.error).toContain('requires clearing Chapter 4');

    // Complete Chapter 4
    await completeRoute(
      new Request('http://localhost/api/mock/campaign/complete', {
        method: 'POST',
        body: JSON.stringify({ chapterId: 'chapter-4' }),
      })
    );

    // Now purchasing Zero-Day Exploit succeeds!
    const zdRes2 = await purchaseRoute(
      new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'tool-zero-day' }),
      })
    );
    expect(zdRes2.status).toBe(200);
  });
});

