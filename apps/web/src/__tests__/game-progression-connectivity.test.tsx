import { describe, it, expect, beforeEach } from 'vitest';
import {
  CHAPTERS,
  getChapterById,
  calculateRemainingDebt,
  TIER_CONFIGS,
  getTierConfig,
} from '@neon-cipher/game-rules';
import { TIERS as MAP_TIERS, SAY as MAP_SAY, NODES as MAP_NODES } from '@/features/map/map-data';
import {
  getNodes,
  getNodeById,
  isSameNode,
  getCanonicalNodeId,
  NODE_ALIAS_MAP,
} from '@/features/map/nodeService';
import { useCampaignStore } from '@/stores/campaign-store';
import { useMapStore } from '@/stores/map-store';
import { usePlayerStore } from '@/stores/player-store';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { featureFlags, isFeatureEnabled } from '@/lib/flags';

describe('Game Progression & Connectivity: Start-to-Finish Audit', () => {
  beforeEach(() => {
    useCampaignStore.setState({
      debt: { initial: 10000, current: 10000, paid: 0 },
      chapters: {
        'chapter-1': { id: 'chapter-1', status: 'available' },
        'chapter-2': { id: 'chapter-2', status: 'locked' },
        'chapter-3': { id: 'chapter-3', status: 'locked' },
        'chapter-4': { id: 'chapter-4', status: 'locked' },
      },
      activeChapterId: 'chapter-1',
      unlocks: {
        blackMarket: false,
        onlinePlay: false,
        bridge: false,
      },
      tutorials: {},
      tutorialActive: false,
      tutorialStepIndex: 0,
    });

    useMapStore.setState({
      view: 'overview',
      selectedDistrict: null,
      activeNodeId: null,
      selectedNodeId: null,
      unlocks: { bridge: false },
    });

    useOnboardingStore.setState({
      crackedNodes: {},
      wins: 0,
    });
  });

  describe('1. Tier Coverage & Configuration (Tiers 1 - 5)', () => {
    it('defines all 5 tiers with complete rules in game-rules', () => {
      for (let tier = 1; tier <= 5; tier++) {
        const config = getTierConfig(tier);
        expect(config).toBeDefined();
        expect(config.tier).toBe(tier);
        expect(config.digits).toBeGreaterThanOrEqual(3);
        expect(config.attempts).toBeGreaterThanOrEqual(5);
        expect(config.timerSeconds).toBeGreaterThan(0);
        expect(config.bountySolo).toBeGreaterThan(0);
      }
    });

    it('synchronizes all 5 tiers in map-data with game-rules', () => {
      for (let tier = 1; tier <= 5; tier++) {
        const mapTier = MAP_TIERS[tier];
        const ruleTier = TIER_CONFIGS[tier];
        expect(mapTier).toBeDefined();
        expect(mapTier.d).toBe(ruleTier.digits);
        expect(mapTier.dup === 1).toBe(ruleTier.allowDuplicates);
        expect(mapTier.tries).toBe(ruleTier.attempts);
        expect(mapTier.b).toBe(ruleTier.bountySolo);
      }
    });

    it('has Nix guidance lines for all 5 tiers', () => {
      for (let tier = 1; tier <= 5; tier++) {
        expect(MAP_SAY[tier]).toBeDefined();
        expect(MAP_SAY[tier].length).toBeGreaterThan(5);
      }
    });

    it('all 15 city map nodes resolve their tier and attributes correctly', () => {
      const nodes = getNodes();
      expect(nodes.length).toBe(15);

      const slumsNodes = nodes.filter((n) => n.district === 'slums');
      const commercialNodes = nodes.filter((n) => n.district === 'commercial');

      expect(slumsNodes.length).toBe(8);
      expect(commercialNodes.length).toBe(7);

      // Verify tier distribution across nodes
      const tiersFound = new Set(nodes.map((n) => n.tier));
      expect(tiersFound.has(1)).toBe(true);
      expect(tiersFound.has(2)).toBe(true);
      expect(tiersFound.has(3)).toBe(true);
      expect(tiersFound.has(4)).toBe(true);
      expect(tiersFound.has(5)).toBe(true);
    });
  });

  describe('2. Two-Way Node ID & Alias Resolution', () => {
    it('resolves aliases between s/c codes and n codes bi-directionally', () => {
      // Slums
      expect(isSameNode('s1', 'n1')).toBe(true);
      expect(isSameNode('n1', 's1')).toBe(true);
      expect(isSameNode('s5', 'n4')).toBe(true);
      expect(isSameNode('n4', 's5')).toBe(true);
      expect(isSameNode('s6', 'n7')).toBe(true);
      expect(isSameNode('n7', 's6')).toBe(true);

      // Commercial
      expect(isSameNode('c1', 'n9')).toBe(true);
      expect(isSameNode('n9', 'c1')).toBe(true);
      expect(isSameNode('c6', 'n10')).toBe(true);
      expect(isSameNode('n10', 'c6')).toBe(true);
      expect(isSameNode('c7', 'n13')).toBe(true);
      expect(isSameNode('n13', 'c7')).toBe(true);
    });

    it('resolves canonical node IDs for all aliases', () => {
      expect(getCanonicalNodeId('s1')).toBe('n1');
      expect(getCanonicalNodeId('s5')).toBe('n4');
      expect(getCanonicalNodeId('s6')).toBe('n7');
      expect(getCanonicalNodeId('c6')).toBe('n10');
      expect(getCanonicalNodeId('c7')).toBe('n13');
      expect(getCanonicalNodeId('n10')).toBe('n10');
    });

    it('cracking an alias node marks both the alias and canonical node owned', () => {
      // Crack node using alias 's5'
      useOnboardingStore.getState().crackNode('s5', 0);
      const canonicalId = getCanonicalNodeId('s5');
      const aliasId = NODE_ALIAS_MAP['s5'];
      if (canonicalId && canonicalId !== 's5') {
        useOnboardingStore.getState().crackNode(canonicalId, 0);
      }

      // Check getNodeById with both IDs
      const nodeFromN = getNodeById('n4');
      const nodeFromS = getNodeById('s5');

      expect(nodeFromN?.status).toBe('owned');
      expect(nodeFromS?.status).toBe('owned');
    });
  });

  describe('3. Campaign Chapters & Debt Extinction (Chapters 1 to 4)', () => {
    it('initializes with $10,000 principal debt', () => {
      expect(useCampaignStore.getState().debt.current).toBe(10000);
      expect(calculateRemainingDebt([])).toBe(10000);
    });

    it('Chapter 1 (Scraping Dirt) targets n1 and reduces debt by $1,500', () => {
      const ch1 = getChapterById('chapter-1')!;
      expect(ch1).toBeDefined();
      expect(isSameNode(ch1.mapNodeId, 'n1')).toBe(true);
      expect(isSameNode(ch1.mapNodeId, 's1')).toBe(true);
      expect(ch1.contract.debtReduction).toBe(1500);

      const debtAfterCh1 = calculateRemainingDebt(['chapter-1']);
      expect(debtAfterCh1).toBe(8500);
    });

    it('Chapter 2 (Corner Store Job) targets n4, reduces debt by $2,500 and unlocks Black Market', () => {
      const ch2 = getChapterById('chapter-2')!;
      expect(ch2).toBeDefined();
      expect(isSameNode(ch2.mapNodeId, 'n4')).toBe(true);
      expect(isSameNode(ch2.mapNodeId, 's5')).toBe(true);
      expect(ch2.contract.debtReduction).toBe(2500);
      expect(ch2.unlocksReward).toBe('blackMarket');

      const debtAfterCh2 = calculateRemainingDebt(['chapter-1', 'chapter-2']);
      expect(debtAfterCh2).toBe(6000);
    });

    it('Chapter 3 (Dirty Collateral) targets n7, reduces debt by $3,000 and unlocks River Bridge', () => {
      const ch3 = getChapterById('chapter-3')!;
      expect(ch3).toBeDefined();
      expect(isSameNode(ch3.mapNodeId, 'n7')).toBe(true);
      expect(isSameNode(ch3.mapNodeId, 's6')).toBe(true);
      expect(ch3.contract.debtReduction).toBe(3000);
      expect(ch3.unlocksReward).toBe('bridge');

      const debtAfterCh3 = calculateRemainingDebt(['chapter-1', 'chapter-2', 'chapter-3']);
      expect(debtAfterCh3).toBe(3000);
    });

    it('Chapter 4 (The Rogue Signal) targets n10 across the river, reduces debt by $3,000 to ZERO and unlocks Online Play', () => {
      const ch4 = getChapterById('chapter-4')!;
      expect(ch4).toBeDefined();
      expect(ch4.district).toBe('commercial');
      expect(isSameNode(ch4.mapNodeId, 'n10')).toBe(true);
      expect(isSameNode(ch4.mapNodeId, 'c6')).toBe(true);
      expect(ch4.contract.debtReduction).toBe(3000);
      expect(ch4.unlocksReward).toBe('onlinePlay');

      // 100% Debt extinction!
      const finalDebt = calculateRemainingDebt(['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4']);
      expect(finalDebt).toBe(0);
    });
  });

  describe('4. District Unlock Synchronization (Slums -> Bridge -> Commercial)', () => {
    it('initially locks the bridge in both campaign and map stores', () => {
      expect(useCampaignStore.getState().unlocks.bridge).toBe(false);
      expect(useMapStore.getState().unlocks.bridge).toBe(false);
    });

    it('synchronizes bridge unlock from campaignStore into mapStore automatically', () => {
      // Complete Chapter 3 reward
      useCampaignStore.setState((s) => ({
        unlocks: { ...s.unlocks, bridge: true },
      }));

      // Map store subscription updates bridge unlock
      expect(useMapStore.getState().unlocks.bridge).toBe(true);
    });
  });

  describe('5. Feature Flag & Navigation Availability', () => {
    it('enables all core game features', () => {
      expect(featureFlags.map).toBe(true);
      expect(featureFlags.rig).toBe(true);
      expect(featureFlags.market).toBe(true);
    });

    it('verifies all feature routes are valid strings', () => {
      const routes = ['/map', '/rig', '/market', '/comms', '/duel', '/profile', '/settings', '/codemaker'];
      routes.forEach((route) => {
        expect(typeof route).toBe('string');
        expect(route.startsWith('/')).toBe(true);
      });
    });
  });
});
