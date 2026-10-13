import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getSettings, POST as postSettings } from './settings/route';
import { GET as getAuth, POST as postAuth } from './auth/route';
import { POST as resetAccount } from './account/reset/route';
import { GET as exportAccount } from './account/export/route';
import { getActiveAccount, setActiveAccount, mockAccounts } from './db';

describe('Mock Settings and Auth API Endpoints (0.2 & 6.0)', () => {
  beforeEach(() => {
    setActiveAccount('ZERO_COOL');
  });

  it('GET /api/mock/settings returns active account settings', async () => {
    const req = new Request('http://localhost:3000/api/mock/settings');
    const res = await getSettings(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.rookieAssist).toBeDefined();
    expect(data.reducedMotion).toBeDefined();
    expect(data.colorBlindMode).toBeDefined();
    expect(data.audio).toBeDefined();
  });

  it('POST /api/mock/settings persists settings per account in mock DB', async () => {
    const req = new Request('http://localhost:3000/api/mock/settings', {
      method: 'POST',
      body: JSON.stringify({
        rookieAssist: false,
        colorBlindMode: true,
        reducedMotion: 'reduced',
        dailySpendLimit: 5000,
      }),
    });

    const res = await postSettings(req);
    expect(res.status).toBe(200);

    const updated = await res.json();
    expect(updated.rookieAssist).toBe(false);
    expect(updated.colorBlindMode).toBe(true);
    expect(updated.reducedMotion).toBe('reduced');
    expect(updated.dailySpendLimit).toBe(5000);

    // Verify persisted in DB for active account
    const activeAcc = getActiveAccount();
    expect(activeAcc.settings.rookieAssist).toBe(false);
    expect(activeAcc.settings.colorBlindMode).toBe(true);
  });

  it('POST /api/mock/auth logs in or creates new account', async () => {
    const req = new Request('http://localhost:3000/api/mock/auth', {
      method: 'POST',
      body: JSON.stringify({
        handle: 'NEO_CYPHER',
        avatarUrl: '/icons/glyph-terminal.svg',
      }),
    });

    const res = await postAuth(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.profile.handle).toBe('NEO_CYPHER');
    expect(data.profile.avatarUrl).toBe('/icons/glyph-terminal.svg');
    expect(data.wallet.credits).toBe(10000);
    expect(mockAccounts['NEO_CYPHER']).toBeDefined();
  });

  it('POST /api/mock/account/reset resets campaign progress and bankroll', async () => {
    const res = await resetAccount();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.wallet.credits).toBe(10000);
    expect(data.account.campaignProgress.chapter).toBe(1);
  });

  it('GET /api/mock/account/export returns complete JSON backup payload', async () => {
    const res = await exportAccount();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.exportVersion).toBe('1.0.0');
    expect(data.account.handle).toBeDefined();
    expect(data.settings).toBeDefined();
    expect(data.wallet).toBeDefined();
    expect(data.safehouses).toBeDefined();
  });
});
