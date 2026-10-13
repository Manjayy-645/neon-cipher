import { describe, it, expect, beforeEach } from 'vitest';
import { POST as sessionPOST } from './session/route';
import { POST as guessPOST } from './guess/route';
import { mockSessions, Session } from './db';

// Mock getNodes
import { getNodes } from '@/features/map/nodeService';
import { GameNode } from '@/features/map/nodeService';

describe('Mock Server Routes', () => {
  beforeEach(() => {
    mockSessions.clear();
  });

  describe('POST /api/mock/session', () => {
    it('creates a session for a valid node', async () => {
      const request = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: 'n1' }),
      });

      const response = await sessionPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.sessionId).toBeDefined();
      expect(data.config).toBeDefined();
      expect(data.config.tier).toBeDefined();
      expect(data.config.ice).toBeDefined();
      expect(data.startedAt).toBeDefined();
      expect(data.secret).toBeUndefined(); // NEVER return secret

      // Check DB
      const session = mockSessions.get(data.sessionId);
      expect(session).toBeDefined();
      expect(session?.nodeId).toBe('n1');
      expect(session?.secret).toBeDefined(); // Server should know it
      expect(session?.ice).toBe(data.config.ice); // Server session retains ICE
    });

    it('returns 404 for invalid node', async () => {
      const request = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: 'invalid-node' }),
      });

      const response = await sessionPOST(request);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/mock/guess', () => {
    let testSessionId: string;
    let mockNode: GameNode;
    let secret: string;

    beforeEach(() => {
      mockNode = getNodes().find(n => n.id === 'n1')!;
      testSessionId = 'test-session';
      secret = '123'; // n1 has 3 digits
      
      const session: Session = {
        id: testSessionId,
        nodeId: mockNode.id,
        secret,
        attemptsLeft: 5,
        startedAt: Date.now(),
        status: 'active',
        node: mockNode
      };
      mockSessions.set(testSessionId, session);
    });

    it('processes a valid guess', async () => {
      const request = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: testSessionId, guess: '124' }),
      });

      const response = await guessPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('active');
      expect(data.pots).toBe(2);
      expect(data.pans).toBe(0);
      expect(data.attemptsLeft).toBe(4);
      expect(data.secret).toBeUndefined();
    });

    it('handles a win correctly', async () => {
      const request = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: testSessionId, guess: '123' }),
      });

      const response = await guessPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('won');
      expect(data.pots).toBe(3);
      expect(data.pans).toBe(0);
      expect(data.attemptsLeft).toBe(4);
      expect(data.secret).toBe('123'); // Secret is returned on win
      expect(data.payout).toBe(mockNode.bounty);

      const session = mockSessions.get(testSessionId);
      expect(session?.status).toBe('won');
    });

    it('handles a loss due to attempts correctly', async () => {
      const session = mockSessions.get(testSessionId)!;
      session.attemptsLeft = 1;

      const request = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: testSessionId, guess: '456' }),
      });

      const response = await guessPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('lost');
      expect(data.attemptsLeft).toBe(0);
      expect(data.secret).toBe('123'); // Secret is returned on loss
      expect(data.fine).toBeDefined();

      const updatedSession = mockSessions.get(testSessionId);
      expect(updatedSession?.status).toBe('lost');
    });

    it('handles a timeout loss correctly', async () => {
      const session = mockSessions.get(testSessionId)!;
      session.startedAt = Date.now() - (mockNode.timerSeconds + 10) * 1000;

      const request = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: testSessionId, guess: '124' }),
      });

      const response = await guessPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('lost');
      expect(data.error).toBe('Time expired');
      expect(data.secret).toBe('123');
    });

    it('evaluates Pot-only ICE by suppressing pans to zero', async () => {
      const session = mockSessions.get(testSessionId)!;
      session.ice = 'Pot-only';
      // secret is 123. Guess 132 would normally give 1 pot, 2 pans.
      const request = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: testSessionId, guess: '132' }),
      });

      const response = await guessPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pots).toBe(1);
      expect(data.pans).toBe(0); // Pans suppressed by Pot-only ICE
      expect(data.ice).toBe('Pot-only');
    });

    it('evaluates Ghost ICE by returning totalHits instead of pots and pans', async () => {
      const session = mockSessions.get(testSessionId)!;
      session.ice = 'Ghost';
      // secret is 123. Guess 132 would normally give 1 pot, 2 pans -> totalHits 3
      const request = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: testSessionId, guess: '132' }),
      });

      const response = await guessPOST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.totalHits).toBe(3);
      expect(data.pots).toBe(0);
      expect(data.pans).toBe(0);
      expect(data.ice).toBe('Ghost');
    });

    it('mutates the secret when an attempt fails against Drift ICE', async () => {
      const session = mockSessions.get(testSessionId)!;
      session.ice = 'Drift';
      const initialSecret = session.secret; // '123'

      const request = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: testSessionId, guess: '456' }),
      });

      const response = await guessPOST(request);
      expect(response.status).toBe(200);

      const updatedSession = mockSessions.get(testSessionId);
      expect(updatedSession?.secret).not.toBe(initialSecret);
      expect(updatedSession?.secret).toHaveLength(initialSecret.length);
    });
  });
});
