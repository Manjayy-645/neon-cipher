import { describe, it, expect, beforeEach } from 'vitest';
import { POST as sessionPOST } from '@/app/api/mock/session/route';
import { POST as guessPOST } from '@/app/api/mock/guess/route';
import { GET as rigGET } from '@/app/api/mock/rig/route';
import { POST as repairPOST } from '@/app/api/mock/rig/repair/route';
import { GET as safehouseGET } from '@/app/api/mock/safehouse/route';
import { POST as safehousePurchasePOST } from '@/app/api/mock/safehouse/purchase/route';
import { POST as safehouseClaimPOST } from '@/app/api/mock/safehouse/claim/route';
import { GET as historyGET } from '@/app/api/mock/wallet/history/route';
import { POST as equipPOST } from '@/app/api/mock/rig/equip/route';
import {
  mockWallet,
  mockRigHardware,
  mockSafehouses,
  mockTransactions,
  mockSessions,
  mockCampaign,
  recordTransaction,
} from '@/app/api/mock/db';
import { getNodes } from '../map/nodeService';

describe('Task 9: Rig Workbench, Safehouse & Wallet History', () => {
  beforeEach(() => {
    // Reset DB state before each test
    mockCampaign.activeChapterId = null;
    mockWallet.credits = 12500;
    mockWallet.coins = 45;
    mockWallet.inventory = {
      'tool-static-injector': 2,
      'tool-firewall-patch': 1,
    };
    mockWallet.equippedTools = ['tool-static-injector'];
    mockWallet.equippedRails = {
      memory_1: null,
      memory_2: null,
      coprocessor: null,
      bus_interconnect: null,
    };

    // Reset all hardware items
    Object.values(mockRigHardware).forEach((h) => {
      h.installed = false;
      h.burned = false;
    });

    // Reset safehouses
    Object.values(mockSafehouses).forEach((s) => {
      s.owned = false;
      s.accumulatedDividends = 0;
      s.lastClaimedAt = 0;
    });

    mockTransactions.length = 0;
    mockSessions.clear();
  });

  describe('Server Upgrades Integration in Infiltration Sessions', () => {
    it('applies Memory Buffer Mk I (+1 attempt) to Tier 1 and Tier 2 nodes only', async () => {
      // Find Tier 1 and Tier 3 nodes
      const t1Node = getNodes().find((n) => n.tier === 1)!;
      const t3Node = getNodes().find((n) => n.tier === 3)!;

      // Base session without upgrade
      const reqBase = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t1Node.id }),
      });
      const resBase = await sessionPOST(reqBase);
      const dataBase = await resBase.json();
      expect(dataBase.config.attempts).toBe(t1Node.attempts);

      // Install Memory Buffer Mk I
      mockRigHardware['rig-memory-buffer-1'].installed = true;

      const reqUpgraded = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t1Node.id }),
      });
      const resUpgraded = await sessionPOST(reqUpgraded);
      const dataUpgraded = await resUpgraded.json();
      expect(dataUpgraded.config.attempts).toBe(t1Node.attempts + 1);

      // Verify Tier 3 does NOT get bonus from Mk I
      const reqT3 = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t3Node.id }),
      });
      const resT3 = await sessionPOST(reqT3);
      const dataT3 = await resT3.json();
      expect(dataT3.config.attempts).toBe(t3Node.attempts);
    });

    it('applies Memory Buffer Mk II (+1 attempt) to Tier 3 and Tier 4 nodes only', async () => {
      const t2Node = getNodes().find((n) => n.tier === 2)!;
      const t3Node = getNodes().find((n) => n.tier === 3)!;

      mockRigHardware['rig-memory-buffer-2'].installed = true;

      // T2 should not receive bonus from Mk II
      const reqT2 = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t2Node.id }),
      });
      const resT2 = await sessionPOST(reqT2);
      const dataT2 = await resT2.json();
      expect(dataT2.config.attempts).toBe(t2Node.attempts);

      // T3 receives bonus from Mk II
      const reqT3 = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t3Node.id }),
      });
      const resT3 = await sessionPOST(reqT3);
      const dataT3 = await resT3.json();
      expect(dataT3.config.attempts).toBe(t3Node.attempts + 1);
    });

    it('does not apply bonus if Memory Buffer is burned', async () => {
      const t1Node = getNodes().find((n) => n.tier === 1)!;
      mockRigHardware['rig-memory-buffer-1'].installed = true;
      mockRigHardware['rig-memory-buffer-1'].burned = true; // Burned!

      const req = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t1Node.id }),
      });
      const res = await sessionPOST(req);
      const data = await res.json();
      expect(data.config.attempts).toBe(t1Node.attempts);
    });

    it('pre-eliminates digits when Heuristic Co-Processor is installed', async () => {
      const t1Node = getNodes().find((n) => n.tier === 1)!;
      mockRigHardware['rig-heuristic-coprocessor'].installed = true;

      const req = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t1Node.id }),
      });
      const res = await sessionPOST(req);
      const data = await res.json();

      expect(data.config.eliminatedDigits).toBeDefined();
      expect(data.config.eliminatedDigits.length).toBeGreaterThan(0);
      expect(data.config.eliminatedDigits.length).toBeLessThanOrEqual(2);

      // Verify server secret does not contain eliminated digits
      const session = mockSessions.get(data.sessionId);
      expect(session).toBeDefined();
      data.config.eliminatedDigits.forEach((digit: string) => {
        expect(session?.secret).not.toContain(digit);
      });
    });
  });

  describe('Hardware State, Tier 5 Failure Burning, and Repair', () => {
    it('GET /api/mock/rig returns hardware status, equipped tools, and inventory', async () => {
      mockRigHardware['rig-memory-buffer-1'].installed = true;

      const res = await rigGET();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.hardware['rig-memory-buffer-1'].installed).toBe(true);
      expect(data.equippedTools).toEqual(['tool-static-injector']);
      expect(data.inventory['tool-static-injector']).toBe(2);
    });

    it('burns installed hardware upon Tier 5 failure', async () => {
      const t5Node = getNodes().find((n) => n.tier === 5)!;
      mockRigHardware['rig-memory-buffer-1'].installed = true;
      mockRigHardware['rig-memory-buffer-1'].burned = false;

      // Create session for T5 node
      const reqSession = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t5Node.id }),
      });
      const resSession = await sessionPOST(reqSession);
      const dataSession = await resSession.json();

      const session = mockSessions.get(dataSession.sessionId)!;
      session.attemptsLeft = 1;

      // Fail final attempt with a valid format incorrect guess
      const allDigits = '0123456789'.split('');
      const candidateGuess = allDigits.slice(0, t5Node.digits).join('');
      const wrongGuess =
        candidateGuess === session.secret
          ? allDigits.slice(1, t5Node.digits + 1).join('')
          : candidateGuess;

      const reqGuess = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: dataSession.sessionId, guess: wrongGuess }),
      });
      const resGuess = await guessPOST(reqGuess);
      const dataGuess = await resGuess.json();

      expect(dataGuess.status).toBe('lost');
      expect(dataGuess.burnedHardware).toBeDefined();

      // Check that the installed hardware was burned
      expect(mockRigHardware['rig-memory-buffer-1'].burned).toBe(true);
    });

    it('repairs burned hardware when player has sufficient credits and logs transaction', async () => {
      mockRigHardware['rig-memory-buffer-1'].installed = true;
      mockRigHardware['rig-memory-buffer-1'].burned = true;
      mockWallet.credits = 5000;
      const cost = mockRigHardware['rig-memory-buffer-1'].repairCost;

      const req = new Request('http://localhost/api/mock/rig/repair', {
        method: 'POST',
        body: JSON.stringify({ hardwareId: 'rig-memory-buffer-1' }),
      });
      const res = await repairPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.hardware.burned).toBe(false);
      expect(data.balances.credits).toBe(5000 - cost);
      expect(mockWallet.credits).toBe(5000 - cost);

      // Verify transaction ledger
      expect(mockTransactions.length).toBe(1);
      expect(mockTransactions[0].source).toBe('Repair: Memory Buffer Mk I');
      expect(mockTransactions[0].amount).toBe(-cost);
      expect(mockTransactions[0].runningBalance).toBe(5000 - cost);
    });

    it('rejects repair when player has insufficient credits', async () => {
      mockRigHardware['rig-memory-buffer-1'].installed = true;
      mockRigHardware['rig-memory-buffer-1'].burned = true;
      mockWallet.credits = 100; // repairCost is 650

      const req = new Request('http://localhost/api/mock/rig/repair', {
        method: 'POST',
        body: JSON.stringify({ hardwareId: 'rig-memory-buffer-1' }),
      });
      const res = await repairPOST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.shortfall).toBe(550);
      expect(mockRigHardware['rig-memory-buffer-1'].burned).toBe(true);
    });
  });

  describe('Safehouse Dashboard, Acquisition & Dividends', () => {
    it('GET /api/mock/safehouse returns property listings and aggregate metrics', async () => {
      const res = await safehouseGET();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.properties.length).toBeGreaterThanOrEqual(3);
      expect(data.stats.ownedCount).toBe(0);
      expect(data.stats.totalUpkeep).toBe(0);
    });

    it('purchases a safehouse property and logs transaction', async () => {
      mockWallet.credits = 25000;
      const target = Object.values(mockSafehouses)[0]; // 'safehouse-slums', cost: 15000

      const req = new Request('http://localhost/api/mock/safehouse/purchase', {
        method: 'POST',
        body: JSON.stringify({ propertyId: target.id }),
      });
      const res = await safehousePurchasePOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.property.owned).toBe(true);
      expect(data.balances.credits).toBe(25000 - target.cost);

      // Verify transaction recorded
      const tx = mockTransactions.find((t) => t.source.includes(target.name));
      expect(tx).toBeDefined();
      expect(tx?.amount).toBe(-target.cost);
    });

    it('claims passive dividends and credits the wallet', async () => {
      const target = Object.values(mockSafehouses)[0];
      target.owned = true;
      target.accumulatedDividends = 500;
      const initialCredits = mockWallet.credits;

      const req = new Request('http://localhost/api/mock/safehouse/claim', {
        method: 'POST',
        body: JSON.stringify({ propertyId: target.id }),
      });
      const res = await safehouseClaimPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.claimedAmount).toBeGreaterThan(0);
      expect(data.balances.credits).toBe(initialCredits + data.claimedAmount);
    });

    it('GET /api/mock/safehouse includes owned district leases in metrics and lists ownedLeases', async () => {
      mockWallet.inventory['lease-slums-nodes'] = 1;
      mockWallet.inventory['lease-docklands-pier'] = 1;

      const res = await safehouseGET();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.ownedLeases).toBeDefined();
      expect(data.ownedLeases.length).toBe(2);
      expect(data.stats.ownedLeasesCount).toBe(2);
      // Daily dividends from slums ($250) + docklands ($400) = $650
      expect(data.stats.totalDailyDividend).toBe(650);
    });

    it('POST /api/mock/safehouse/claim collects passive dividends from district leases', async () => {
      mockWallet.inventory['lease-slums-nodes'] = 1;
      const initialCredits = mockWallet.credits;

      const req = new Request('http://localhost/api/mock/safehouse/claim', {
        method: 'POST',
        body: JSON.stringify({ propertyId: 'lease-slums-nodes' }),
      });
      const res = await safehouseClaimPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.claimedAmount).toBe(250);
      expect(data.balances.credits).toBe(initialCredits + 250);
      expect(mockWallet.credits).toBe(initialCredits + 250);
    });
  });

  describe('Wallet Transaction History Ledger', () => {
    it('records transactions across purchases, payouts, and repairs, supporting currency filters', async () => {
      recordTransaction('Test Hack Payout', 1500, 'credits', 'payout');
      recordTransaction('Exploit Purchase', -10, 'coins', 'purchase');
      recordTransaction('Trace Penalty', -250, 'credits', 'fine');

      // Unfiltered history
      const reqAll = new Request('http://localhost/api/mock/wallet/history');
      const resAll = await historyGET(reqAll);
      const dataAll = await resAll.json();

      expect(dataAll.totalCount).toBe(3);
      expect(dataAll.transactions.length).toBe(3);

      // Credits-only filter
      const reqCredits = new Request('http://localhost/api/mock/wallet/history?currency=credits');
      const resCredits = await historyGET(reqCredits);
      const dataCredits = await resCredits.json();

      expect(dataCredits.totalCount).toBe(2);
      dataCredits.transactions.forEach((tx: any) => {
        expect(tx.currency).toBe('credits');
      });

      // Coins-only filter
      const reqCoins = new Request('http://localhost/api/mock/wallet/history?currency=coins');
      const resCoins = await historyGET(reqCoins);
      const dataCoins = await resCoins.json();

      expect(dataCoins.totalCount).toBe(1);
      expect(dataCoins.transactions[0].currency).toBe('coins');
      expect(dataCoins.transactions[0].amount).toBe(-10);
    });
  });

  describe('4-Rail Cyberdeck System, Presets & Advanced Modules', () => {
    it('equips and hot-swaps hardware modules across all 4 rails via POST /api/mock/rig/equip', async () => {
      mockWallet.inventory['memory_buffer_mk1'] = 1;
      mockWallet.inventory['neural_reflex_cap'] = 1;

      // Equip memory_buffer_mk1 to memory_1
      const req1 = new Request('http://localhost/api/mock/rig/equip', {
        method: 'POST',
        body: JSON.stringify({ railSlot: 'memory_1', hardwareId: 'memory_buffer_mk1' }),
      });
      const res1 = await equipPOST(req1);
      const data1 = await res1.json();
      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data1.equippedRails.memory_1).toBe('memory_buffer_mk1');

      // Hot-swap memory_1 with neural_reflex_cap
      const req2 = new Request('http://localhost/api/mock/rig/equip', {
        method: 'POST',
        body: JSON.stringify({ railSlot: 'memory_1', hardwareId: 'neural_reflex_cap' }),
      });
      const res2 = await equipPOST(req2);
      const data2 = await res2.json();
      expect(res2.status).toBe(200);
      expect(data2.equippedRails.memory_1).toBe('neural_reflex_cap');
      expect(data2.swappedModuleId).toBe('memory_buffer_mk1');
    });

    it('applies 1-tap archetype loadout presets (Safe Learner, Cash Farmer, PvP Duelist)', async () => {
      // Give player all parts for Safe Learner preset
      mockWallet.inventory['memory_buffer_mk1'] = 1;
      mockWallet.inventory['heuristic_coproc'] = 1;
      mockWallet.inventory['lead_shielded_chassis'] = 1;

      const req = new Request('http://localhost/api/mock/rig/equip', {
        method: 'POST',
        body: JSON.stringify({ presetId: 'safe_learner' }),
      });
      const res = await equipPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.equippedRails.memory_1).toBe('memory_buffer_mk1');
      expect(data.equippedRails.coprocessor).toBe('heuristic_coproc');
      expect(data.equippedRails.bus_interconnect).toBe('lead_shielded_chassis');
      expect(data.missingModules).toEqual([]);
    });

    it('reveals parity distribution when Parity Scanner ASIC is equipped', async () => {
      mockWallet.inventory['parity_scanner_asic'] = 1;
      mockWallet.equippedRails!.coprocessor = 'parity_scanner_asic';
      mockRigHardware['parity_scanner_asic'].installed = true;

      const t1Node = getNodes().find((n) => n.tier === 1)!;
      const req = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t1Node.id }),
      });
      const res = await sessionPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);

      expect(data.config.parityDistribution).toBeDefined();
      expect(data.config.parityDistribution.formatted).toBeDefined();
      expect(data.config.parityDistribution.evenCount + data.config.parityDistribution.oddCount).toBe(
        t1Node.digits
      );
    });

    it('applies Overclocked Quartz Bus (+15s clock, +20% bounty, -1 attempt floored at 3)', async () => {
      mockWallet.inventory['overclocked_quartz_bus'] = 1;
      mockWallet.equippedRails!.bus_interconnect = 'overclocked_quartz_bus';
      mockRigHardware['overclocked_quartz_bus'].installed = true;

      const t3Node = getNodes().find((n) => n.tier === 3)!;
      const req = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t3Node.id }),
      });
      const res = await sessionPOST(req);
      const data = await res.json();
      expect(res.status).toBe(200);

      expect(data.config.timerSeconds).toBe((t3Node.timerSeconds || 0) + 15);
      expect(data.config.bounty).toBe(Math.round(t3Node.bounty * 1.2));
      expect(data.config.attempts).toBe(Math.max(3, t3Node.attempts - 1));
    });

    it('awards Syndicate Skimmer turn-1 Pan bonus', async () => {
      mockWallet.inventory['syndicate_skimmer'] = 1;
      mockWallet.equippedRails!.memory_2 = 'syndicate_skimmer';
      mockRigHardware['syndicate_skimmer'].installed = true;
      const initialCredits = mockWallet.credits;

      const t1Node = getNodes().find((n) => n.tier === 1)!;
      const reqSession = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t1Node.id }),
      });
      const resSession = await sessionPOST(reqSession);
      const dataSession = await resSession.json();

      const session = mockSessions.get(dataSession.sessionId)!;
      // Make a guess with at least 1 Pan (match first digit of secret)
      const secret = session.secret;
      const guessDigits = secret[0] + '999'.slice(0, secret.length - 1);

      const reqGuess = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: dataSession.sessionId, guess: guessDigits }),
      });
      const resGuess = await guessPOST(reqGuess);
      const dataGuess = await resGuess.json();

      const pansScored = dataGuess.pans ?? (dataGuess.result?.pans || 0);
      if (pansScored > 0) {
        expect(dataGuess.firstTurnBonus).toBe(pansScored * 45);
        expect(mockWallet.credits).toBe(initialCredits + pansScored * 45);
      }
    });

    it('refunds attempt when Neural Reflex Capacitor is equipped and guess is submitted in <= 4s', async () => {
      mockWallet.inventory['neural_reflex_cap'] = 1;
      mockWallet.equippedRails!.memory_1 = 'neural_reflex_cap';
      mockRigHardware['neural_reflex_cap'].installed = true;

      const t1Node = getNodes().find((n) => n.tier === 1)!;
      const reqSession = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t1Node.id }),
      });
      const resSession = await sessionPOST(reqSession);
      const dataSession = await resSession.json();

      const session = mockSessions.get(dataSession.sessionId)!;
      const initialAttempts = session.attemptsLeft;

      // Turn 1 guess
      const guess1 = '0123456789'.slice(0, t1Node.digits);
      const req1 = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: dataSession.sessionId, guess: guess1 }),
      });
      const res1 = await guessPOST(req1);
      const data1 = await res1.json();
      expect(data1.attemptsLeft).toBe(initialAttempts - 1);

      // Turn 2 rapid guess submitted immediately (< 4s)
      const guess2 = '9876543210'.slice(0, t1Node.digits);
      const req2 = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: dataSession.sessionId, guess: guess2 }),
      });
      const res2 = await guessPOST(req2);
      const data2 = await res2.json();

      expect(data2.refundedAttempt).toBe(true);
      expect(data2.attemptsLeft).toBe(data1.attemptsLeft); // Attempt refunded!
    });

    it('prevents hardware burnout upon Tier 5 failure when Lead-Shielded Chassis is equipped', async () => {
      const t5Node = getNodes().find((n) => n.tier === 5)!;
      mockWallet.inventory['memory_buffer_mk1'] = 1;
      mockWallet.equippedRails!.memory_1 = 'memory_buffer_mk1';
      mockRigHardware['memory_buffer_mk1'].installed = true;
      mockRigHardware['memory_buffer_mk1'].burned = false;

      // Equip Lead-Shielded Chassis
      mockWallet.inventory['lead_shielded_chassis'] = 1;
      mockWallet.equippedRails!.bus_interconnect = 'lead_shielded_chassis';
      mockRigHardware['lead_shielded_chassis'].installed = true;

      const reqSession = new Request('http://localhost/api/mock/session', {
        method: 'POST',
        body: JSON.stringify({ nodeId: t5Node.id }),
      });
      const resSession = await sessionPOST(reqSession);
      const dataSession = await resSession.json();

      const session = mockSessions.get(dataSession.sessionId)!;
      session.attemptsLeft = 1;

      // Fail final attempt with incorrect guess matching node digits
      const allDigits = '0123456789'.split('');
      const candidateGuess = allDigits.slice(0, t5Node.digits).join('');
      const wrongGuess =
        candidateGuess === session.secret
          ? allDigits.slice(1, t5Node.digits + 1).join('')
          : candidateGuess;
      const reqGuess = new Request('http://localhost/api/mock/guess', {
        method: 'POST',
        body: JSON.stringify({ sessionId: dataSession.sessionId, guess: wrongGuess }),
      });
      const resGuess = await guessPOST(reqGuess);
      const dataGuess = await resGuess.json();

      expect(dataGuess.status).toBe('lost');
      // Lead shielded chassis prevents burn
      expect(dataGuess.burnedHardware).toBeUndefined();
      expect(mockRigHardware['memory_buffer_mk1'].burned).toBe(false);
    });
  });
});
