import { describe, it, expect, beforeEach } from 'vitest';
import { GET as walletGET } from '@/app/api/mock/wallet/route';
import { POST as purchasePOST } from '@/app/api/mock/wallet/purchase/route';
import { POST as equipPOST } from '@/app/api/mock/wallet/equip/route';
import { mockWallet } from '@/app/api/mock/db';
import { CATALOG } from './catalog';

describe('Task 8: Black Market & Wallet Backend', () => {
  beforeEach(() => {
    // Reset mock wallet state for deterministic tests
    mockWallet.credits = 12500;
    mockWallet.coins = 45;
    mockWallet.inventory = {
      'tool-static-injector': 2,
      'tool-firewall-patch': 1,
    };
    mockWallet.equippedTools = ['tool-static-injector'];
  });

  describe('Catalog Structure', () => {
    it('contains all 4 categories with correct currencies', () => {
      const tools = CATALOG.filter((it) => it.category === 'tools');
      const exploits = CATALOG.filter((it) => it.category === 'exploits');
      const rig = CATALOG.filter((it) => it.category === 'rig');
      const leases = CATALOG.filter((it) => it.category === 'leases');

      expect(tools.length).toBeGreaterThan(0);
      expect(exploits.length).toBeGreaterThan(0);
      expect(rig.length).toBeGreaterThan(0);
      expect(leases.length).toBeGreaterThan(0);

      // Tools, Rig, and Leases use credits
      tools.forEach((t) => expect(t.currency).toBe('credits'));
      rig.forEach((r) => expect(r.currency).toBe('credits'));
      leases.forEach((l) => expect(l.currency).toBe('credits'));

      // Exploits MUST use coins and have bounty reductions
      exploits.forEach((e) => {
        expect(e.currency).toBe('coins');
        expect(e.bountyPenaltyPercent).toBeDefined();
        expect(e.bountyPenaltyPercent).toBeGreaterThan(0);
      });
    });

    it('includes newly added items and rebalanced exploit penalties', () => {
      const freqProbe = CATALOG.find((it) => it.id === 'tool-frequency-probe');
      const heatSink = CATALOG.find((it) => it.id === 'rig-heat-dispersal-sink');
      const pierLease = CATALOG.find((it) => it.id === 'lease-docklands-pier');

      expect(freqProbe).toBeDefined();
      expect(freqProbe?.price).toBe(400);

      expect(heatSink).toBeDefined();
      expect(heatSink?.maxOwned).toBe(1);

      expect(pierLease).toBeDefined();
      expect(pierLease?.price).toBe(9500);

      const slotPeek = CATALOG.find((it) => it.id === 'exploit-slot-peek');
      expect(slotPeek?.bountyPenaltyPercent).toBe(20);

      const secondChance = CATALOG.find((it) => it.id === 'exploit-second-chance');
      expect(secondChance?.bountyPenaltyPercent).toBe(25);
    });
  });

  describe('GET /api/mock/wallet', () => {
    it('returns current credits, coins, inventory and equipped tools', async () => {
      const response = await walletGET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.credits).toBe(12500);
      expect(data.coins).toBe(45);
      expect(data.inventory['tool-static-injector']).toBe(2);
      expect(data.equippedTools).toEqual(['tool-static-injector']);
    });
  });

  describe('POST /api/mock/wallet/purchase', () => {
    it('successfully purchases a tool with credits and deducts balance', async () => {
      const req = new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'tool-static-injector' }), // $300
      });

      const res = await purchasePOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.balances.credits).toBe(12200);
      expect(data.inventory['tool-static-injector']).toBe(3);
      expect(mockWallet.credits).toBe(12200);
    });

    it('successfully purchases an exploit with coins and deducts balance', async () => {
      const req = new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'exploit-digit-scrub' }), // 5 coins
      });

      const res = await purchasePOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.balances.coins).toBe(40);
      expect(data.inventory['exploit-digit-scrub']).toBe(1);
      expect(mockWallet.coins).toBe(40);
    });

    it('rejects purchase and reports exact shortfall when insufficient credits', async () => {
      mockWallet.credits = 100;

      const req = new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'tool-static-injector' }), // $300
      });

      const res = await purchasePOST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain('short by $200 credits');
      expect(data.shortfall).toBe(200);
      expect(mockWallet.credits).toBe(100); // Unchanged
    });

    it('rejects purchase and reports exact shortfall when insufficient coins', async () => {
      mockWallet.coins = 2;

      const req = new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'exploit-digit-scrub' }), // 5 coins
      });

      const res = await purchasePOST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain('short by 3 coins');
      expect(data.shortfall).toBe(3);
      expect(mockWallet.coins).toBe(2);
    });

    it('rejects purchase when already owning max allowed for unique rig upgrades', async () => {
      mockWallet.inventory['rig-memory-buffer-1'] = 1;

      const req = new Request('http://localhost/api/mock/wallet/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'rig-memory-buffer-1' }),
      });

      const res = await purchasePOST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain('maximum allowed quantity');
    });
  });

  describe('POST /api/mock/wallet/equip', () => {
    it('successfully equips up to two owned consumable tools', async () => {
      const req = new Request('http://localhost/api/mock/wallet/equip', {
        method: 'POST',
        body: JSON.stringify({
          toolIds: ['tool-static-injector', 'tool-firewall-patch'],
        }),
      });

      const res = await equipPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.equippedTools).toEqual(['tool-static-injector', 'tool-firewall-patch']);
      expect(mockWallet.equippedTools).toEqual(['tool-static-injector', 'tool-firewall-patch']);
    });

    it('rejects equipping more than two tools with plain language reason', async () => {
      const req = new Request('http://localhost/api/mock/wallet/equip', {
        method: 'POST',
        body: JSON.stringify({
          toolIds: ['tool-static-injector', 'tool-firewall-patch', 'tool-blackout-ping'],
        }),
      });

      const res = await equipPOST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain('maximum of two consumable tools');
    });

    it('rejects equipping a tool that is not owned', async () => {
      const req = new Request('http://localhost/api/mock/wallet/equip', {
        method: 'POST',
        body: JSON.stringify({
          toolIds: ['tool-trace-accelerator'], // Not in initial inventory
        }),
      });

      const res = await equipPOST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain('do not have any in your inventory');
    });
  });
});
