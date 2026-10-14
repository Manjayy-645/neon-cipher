import { describe, it, expect, beforeEach } from 'vitest';
import { getNextStepOnEvent, getNextStallHint } from '../components/TourDirector';
import { subscribe, emit, OnboardingEvent } from '../events';
import { TUTORIAL, CH2_NODE_ID, START_BALANCE, STALL_HINTS } from '../steps';
import { CHAPTERS } from '@neon-cipher/game-rules/src/index';
import { CATALOG } from '@/features/market/catalog';

describe('Onboarding Tour Director & Mechanics (Task O-B)', () => {
  describe('getNextStepOnEvent', () => {
    it('advances cold.intro to cold.clues on terminal:guess', () => {
      const next = getNextStepOnEvent('cold.intro', {
        type: 'terminal:guess',
        count: 1,
        hasDeadDigit: false,
        solved: false,
      });
      expect(next).toBe('cold.clues');
    });

    it('advances cold.play to cold.breach on terminal:won', () => {
      const next = getNextStepOnEvent('cold.play', {
        type: 'terminal:won',
        nodeId: TUTORIAL.terminalId,
        guesses: 3,
      });
      expect(next).toBe('cold.breach');
    });

    it('advances ch2.hack to ch2.result on terminal:won', () => {
      const next = getNextStepOnEvent('ch2.hack', {
        type: 'terminal:won',
        nodeId: CH2_NODE_ID,
        guesses: 4,
      });
      expect(next).toBe('ch2.result');
    });

    it('does not advance the campaign when the Nix recovery practice is won', () => {
      const next = getNextStepOnEvent('ch2.hack', {
        type: 'terminal:won',
        nodeId: 'nix-recovery',
        guesses: 1,
      });
      expect(next).toBeNull();
    });

    it('advances map.overview to map.district only on slums district tag tap', () => {
      const wrong = getNextStepOnEvent('map.overview', {
        type: 'map:districtTagTapped',
        district: 'financial',
      });
      expect(wrong).toBeNull();

      const correct = getNextStepOnEvent('map.overview', {
        type: 'map:districtTagTapped',
        district: 'slums',
      });
      expect(correct).toBe('map.district');
    });

    it('advances map.district to map.node only on the corner-store node', () => {
      const wrong = getNextStepOnEvent('map.district', {
        type: 'map:nodeSelected',
        nodeId: 'n1',
      });
      expect(wrong).toBeNull();

      const correct = getNextStepOnEvent('map.district', {
        type: 'map:nodeSelected',
        nodeId: CH2_NODE_ID,
      });
      expect(correct).toBe('map.node');
    });

    it('advances map.node to ch2.hack only on the corner-store jack-in', () => {
      const wrong = getNextStepOnEvent('map.node', {
        type: 'map:jackIn',
        nodeId: 'n1',
      });
      expect(wrong).toBeNull();

      const correct = getNextStepOnEvent('map.node', {
        type: 'map:jackIn',
        nodeId: CH2_NODE_ID,
      });
      expect(correct).toBe('ch2.hack');
    });

    it('advances market.gate to market.buy on market:gateOpened', () => {
      const next = getNextStepOnEvent('market.gate', {
        type: 'market:gateOpened',
      });
      expect(next).toBe('market.buy');
    });

    it('advances market.buy to market.equip only on firewall-patch buy', () => {
      const wrong = getNextStepOnEvent('market.buy', {
        type: 'market:bought',
        itemId: 'signal-jammer',
      });
      expect(wrong).toBeNull();

      const correct = getNextStepOnEvent('market.buy', {
        type: 'market:bought',
        itemId: 'firewall-patch',
      });
      expect(correct).toBe('market.equip');
    });

    it('advances market.equip to comms.nav only on firewall-patch equip', () => {
      const wrong = getNextStepOnEvent('market.equip', {
        type: 'market:equipped',
        itemId: 'signal-jammer',
      });
      expect(wrong).toBeNull();

      const correct = getNextStepOnEvent('market.equip', {
        type: 'market:equipped',
        itemId: 'firewall-patch',
      });
      expect(correct).toBe('comms.nav');
    });

    it('advances comms.nav to comms.debt on comms:viewed', () => {
      const next = getNextStepOnEvent('comms.nav', {
        type: 'comms:viewed',
      });
      expect(next).toBe('comms.debt');
    });

    it('returns null for tap-to-advance or form steps when receiving events', () => {
      expect(
        getNextStepOnEvent('cold.clues', { type: 'terminal:guess', count: 2, hasDeadDigit: false, solved: false })
      ).toBeNull();
      expect(
        getNextStepOnEvent('comms.debt', { type: 'comms:viewed' })
      ).toBeNull();
      expect(
        getNextStepOnEvent('save.prompt', { type: 'comms:viewed' })
      ).toBeNull();
    });
  });

  describe('getNextStallHint rotation', () => {
    it('rotates through tutorial stall hints sequentially without back-to-back repeats', () => {
      const tutorialHints = STALL_HINTS.tutorial;
      let lastIndex = -1;

      const receivedIndices: number[] = [];
      const receivedHints: string[] = [];

      // Rotate through 2 full cycles (6 hints)
      for (let i = 0; i < tutorialHints.length * 2; i++) {
        const { hint, nextIndex } = getNextStallHint('tutorial', lastIndex);
        expect(nextIndex).not.toBe(lastIndex);
        expect(nextIndex).toBe((lastIndex + 1) % tutorialHints.length);
        expect(hint).toBe(tutorialHints[nextIndex]);

        receivedIndices.push(nextIndex);
        receivedHints.push(hint);
        lastIndex = nextIndex;
      }

      // Check sequence is 0, 1, 2, 0, 1, 2
      expect(receivedIndices).toEqual([0, 1, 2, 0, 1, 2]);
    });

    it('rotates through ch2 stall hints sequentially without back-to-back repeats', () => {
      const ch2Hints = STALL_HINTS.ch2;
      let lastIndex = -1;

      const receivedIndices: number[] = [];

      for (let i = 0; i < ch2Hints.length * 2; i++) {
        const { hint, nextIndex } = getNextStallHint('ch2', lastIndex);
        expect(nextIndex).not.toBe(lastIndex);
        expect(hint).toBe(ch2Hints[nextIndex]);
        receivedIndices.push(nextIndex);
        lastIndex = nextIndex;
      }

      expect(receivedIndices).toEqual([0, 1, 2, 0, 1, 2]);
    });
  });

  describe('Wallet affordability & progression economy', () => {
    it('confirms player earns enough credits from Chapter 1 and Chapter 2 to afford Firewall Patch', () => {
      const initialCredits = START_BALANCE.credits;
      expect(initialCredits).toBe(0);

      // Chapter 1 payout (soda tutorial)
      const ch1Payout = TUTORIAL.payout;
      expect(ch1Payout).toBe(120);

      // Chapter 2 bounty
      const ch2 = CHAPTERS.find((c) => c.id === 'chapter-2');
      expect(ch2).toBeDefined();
      const ch2Bounty = ch2?.contract.bounty ?? 0;
      expect(ch2Bounty).toBe(650);

      // Total earned before visiting Black Market
      const totalEarned = initialCredits + ch1Payout + ch2Bounty;
      expect(totalEarned).toBe(770);

      // Firewall Patch cost in Black Market catalog
      const firewallItem = CATALOG.find((item) => item.id === 'tool-firewall-patch' || item.id === 'firewall-patch');
      expect(firewallItem).toBeDefined();
      const firewallCost = firewallItem?.price ?? 0;
      expect(firewallCost).toBe(450);

      // Affordability check
      expect(totalEarned).toBeGreaterThanOrEqual(firewallCost);
      const remainingBalance = totalEarned - firewallCost;
      expect(remainingBalance).toBe(320);
    });
  });

  describe('Onboarding Event Bus (events.ts)', () => {
    it('notifies subscribers when events are emitted', () => {
      const received: OnboardingEvent[] = [];
      const unsubscribe = subscribe((e) => {
        received.push(e);
      });

      emit({ type: 'market:gateOpened' });
      emit({ type: 'map:districtTagTapped', district: 'slums' });

      expect(received).toHaveLength(2);
      expect(received[0].type).toBe('market:gateOpened');
      expect(received[1].type).toBe('map:districtTagTapped');

      unsubscribe();
      emit({ type: 'comms:viewed' });
      // Should not receive any more events after unsubscribe
      expect(received).toHaveLength(2);
    });
  });
});
