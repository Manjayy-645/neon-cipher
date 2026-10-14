import { describe, it, expect, beforeEach } from 'vitest';
import {
  setNodeDefense,
  getNodeDefense,
  setActiveAccount,
  getActiveAccount,
  mockAccounts,
  mockSessions,
} from '../../../app/api/mock/db';
import { POST as sessionPost } from '../../../app/api/mock/session/route';
import { POST as guessPost } from '../../../app/api/mock/guess/route';

describe('Task 12 Acceptance: Set defense, see applied to node, and attack from second mock account', () => {
  beforeEach(() => {
    setActiveAccount('ZERO_COOL');
  });

  it('allows ZERO_COOL to set defense, PHREAK to attack, and ZERO_COOL to earn fines on repelled attack', async () => {
    // 1. Account 1 (ZERO_COOL) sets defense on node n2 with custom code "8419" and ICE "Ghost"
    const zeroCool = getActiveAccount();
    expect(zeroCool.handle).toBe('ZERO_COOL');

    const deployedDefense = setNodeDefense('n2', {
      code: '8419',
      ice: 'Ghost',
      iceModifiers: ['Ghost'],
      dailyBudget: 350,
      finesEarned: 0,
      ownerHandle: 'ZERO_COOL',
    });

    expect(deployedDefense.code).toBe('8419');
    expect(deployedDefense.ice).toBe('Ghost');

    // 2. Verify defense is applied to the node
    const verifiedDefense = getNodeDefense('n2');
    expect(verifiedDefense).toBeDefined();
    expect(verifiedDefense?.code).toBe('8419');
    expect(verifiedDefense?.ownerHandle).toBe('ZERO_COOL');

    // 3. Switch to Account 2 (PHREAK)
    const phreak = setActiveAccount('PHREAK');
    expect(phreak.handle).toBe('PHREAK');
    expect(getActiveAccount().handle).toBe('PHREAK');

    // 4. PHREAK attacks node n2: initiates attack session
    const sessionReq = new Request('http://localhost:3000/api/mock/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'n2' }),
    });

    const sessionRes = await sessionPost(sessionReq);
    expect(sessionRes.status).toBe(200);
    const sessionData = await sessionRes.json();
    expect(sessionData.sessionId).toBeDefined();
    expect(sessionData.config.ice).toBe('Ghost');

    // Verify server session holds the secret code deployed by ZERO_COOL
    const storedSession = mockSessions.get(sessionData.sessionId);
    expect(storedSession).toBeDefined();
    expect(storedSession?.secret).toBe('8419');

    // 5. PHREAK fails the breach (submits incorrect guesses until out of attempts)
    const initialZeroCoolCredits = mockAccounts['ZERO_COOL'].wallet.credits;
    const initialPhreakCredits = mockAccounts['PHREAK'].wallet.credits;

    let lastGuessRes: any = null;
    const attempts = sessionData.config.attempts;
    for (let i = 0; i < attempts; i++) {
      const guessReq = new Request('http://localhost:3000/api/mock/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          guess: '0123',
        }),
      });
      const res = await guessPost(guessReq);
      lastGuessRes = await res.json();
    }

    // 6. Verify PHREAK lost and was fined
    expect(lastGuessRes.status).toBe('lost');
    expect(lastGuessRes.fine).toBeGreaterThan(0);
    expect(lastGuessRes.secret).toBe('8419');

    // 7. Verify defense fine was credited to ZERO_COOL
    const updatedZeroCool = mockAccounts['ZERO_COOL'];
    expect(updatedZeroCool.wallet.credits).toBe(initialZeroCoolCredits + lastGuessRes.fine);

    const updatedDefense = getNodeDefense('n2');
    expect(updatedDefense?.finesEarned).toBe(lastGuessRes.fine);
  });

  it('allows PHREAK to successfully breach the defended node and contest/transfer ownership', async () => {
    // ZERO_COOL defends node n2 with secret "6192"
    setActiveAccount('ZERO_COOL');
    setNodeDefense('n2', {
      code: '6192',
      ice: 'None',
      iceModifiers: [],
      dailyBudget: 200,
      ownerHandle: 'ZERO_COOL',
    });

    // Switch to PHREAK
    setActiveAccount('PHREAK');

    // Start session
    const sessionReq = new Request('http://localhost:3000/api/mock/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'n2' }),
    });
    const sessionRes = await sessionPost(sessionReq);
    const sessionData = await sessionRes.json();

    // PHREAK guesses the exact code "6192"
    const guessReq = new Request('http://localhost:3000/api/mock/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        guess: '6192',
      }),
    });
    const guessRes = await guessPost(guessReq);
    const guessData = await guessRes.json();

    expect(guessData.status).toBe('won');
    expect(guessData.pans).toBe(4);
    expect(guessData.pots).toBe(0);

    // Ownership transfers to PHREAK
    const updatedDefense = getNodeDefense('n2');
    expect(updatedDefense?.ownerHandle).toBe('PHREAK');
  });
});
