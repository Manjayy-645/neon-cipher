import { describe, it, expect, beforeEach } from 'vitest';
import { POST as sessionPOST } from '@/app/api/mock/session/route';
import { POST as toolPOST } from '@/app/api/mock/session/tool/route';
import { mockSessions, mockWallet } from '@/app/api/mock/db';

describe('POST /api/mock/session/tool', () => {
  beforeEach(() => {
    mockSessions.clear();
    mockWallet.credits = 10000;
    mockWallet.coins = 20;
    mockWallet.inventory = {
      'tool-static-injector': 2,
      'tool-firewall-patch': 1,
      'tool-trace-accelerator': 1,
    };
    mockWallet.equippedTools = ['tool-static-injector', 'tool-firewall-patch'];
  });

  it('activates Static Injector, consumes 1 item from inventory, and returns eliminated dead digit', async () => {
    // Start session
    const startReq = new Request('http://localhost/api/mock/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'n1' }),
    });
    const startRes = await sessionPOST(startReq);
    const sessionData = await startRes.json();

    // Use tool
    const toolReq = new Request('http://localhost/api/mock/session/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        toolId: 'tool-static-injector',
      }),
    });
    const toolRes = await toolPOST(toolReq);
    expect(toolRes.status).toBe(200);

    const data = await toolRes.json();
    expect(data.success).toBe(true);
    expect(data.eliminatedDigit).toBeDefined();
    expect(data.inventory['tool-static-injector']).toBe(1);
    expect(mockWallet.inventory['tool-static-injector']).toBe(1);
  });

  it('rejects activation if tool is not in inventory', async () => {
    const startReq = new Request('http://localhost/api/mock/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'n1' }),
    });
    const startRes = await sessionPOST(startReq);
    const sessionData = await startRes.json();

    const toolReq = new Request('http://localhost/api/mock/session/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        toolId: 'tool-snoop-packet', // not in inventory
      }),
    });
    const toolRes = await toolPOST(toolReq);
    expect(toolRes.status).toBe(400);

    const data = await toolRes.json();
    expect(data.error).toContain('None remaining in inventory');
  });

  it('arms Firewall Patch and marks iceShield on server session', async () => {
    const startReq = new Request('http://localhost/api/mock/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: 'n1' }),
    });
    const startRes = await sessionPOST(startReq);
    const sessionData = await startRes.json();

    const toolReq = new Request('http://localhost/api/mock/session/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        toolId: 'tool-firewall-patch',
      }),
    });
    const toolRes = await toolPOST(toolReq);
    expect(toolRes.status).toBe(200);

    const data = await toolRes.json();
    expect(data.success).toBe(true);
    expect(data.shieldArmed).toBe(true);

    const sessionInDb = mockSessions.get(sessionData.sessionId);
    expect((sessionInDb as any).iceShield).toBe(true);
  });
});
