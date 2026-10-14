import { describe, it, expect } from 'vitest';
import {
  analyzeBreachReplay,
  canUnlockSkill,
  respecSkillTree,
  SPECIALIZATION_SKILLS,
  SKILL_BRANCH_GUIDES,
  FACTION_CATALOG,
  getFactionMilestone,
  SkillNode,
} from './index';

describe('Module 10: Decker Profile, Specialization Skill Tree & Breach Replay Coach', () => {
  describe('1. Turn-by-Turn Breach Replay & Candidate Pool Analyzer (analyzeBreachReplay)', () => {
    it('verifies 5,040 initial candidate pool for 4-digit unique and narrows accurately down to 1', () => {
      const secret = '4829';
      const guesses = [
        { guess: '1234', pans: 0, pots: 2 }, // digits 2, 4
        { guess: '5678', pans: 0, pots: 1 }, // digit 8
        { guess: '9024', pans: 1, pots: 2 }, // 2, 4, 9
        { guess: '4829', pans: 4, pots: 0 }, // solve
      ];

      const report = analyzeBreachReplay(secret, guesses, { length: 4, allowDuplicates: false });

      expect(report.initialCandidatesCount).toBe(5040);
      expect(report.totalGuesses).toBe(4);
      expect(report.solved).toBe(true);
      expect(report.finalCandidatesCount).toBe(1);

      // Verify each turn candidate narrowing
      expect(report.steps[0].candidatesBefore).toBe(5040);
      expect(report.steps[0].candidatesAfter).toBeLessThan(5040);
      expect(report.steps[0].eliminatedPercent).toBeGreaterThan(50);

      // Verify the final step solves to exactly 1 candidate and is tagged CLUTCH_SOLVE
      const lastStep = report.steps[3];
      expect(lastStep.candidatesAfter).toBe(1);
      expect(lastStep.efficiencyTag).toBe('CLUTCH_SOLVE');
      expect(report.funnelFlow).toContain('5,040 ->');
      expect(report.funnelFlow).toContain('(SOLVED!)');
    });

    it('flags OPTIMAL_ELIMINATION when remaining candidates are slashed by >= 75%', () => {
      const secret = '3718';
      // Guess 0123 gives 0 pans, 2 pots (1 and 3)
      const report = analyzeBreachReplay(secret, [{ guess: '0123', pans: 0, pots: 2 }]);
      const firstStep = report.steps[0];

      // Slashing from 5040 to ~1200 or less is > 75%
      expect(firstStep.eliminatedPercent).toBeGreaterThanOrEqual(75);
      expect(firstStep.efficiencyTag).toBe('OPTIMAL_ELIMINATION');
      expect(firstStep.nixCommentary).toContain('Sharp probe!');
      expect(firstStep.nixCommentary).toContain(`${firstStep.eliminatedPercent}%`);
    });

    it('accurately detects WASTED_DEAD_DIGIT when a player re-tests numbers from a 0 Pan / 0 Pot row', () => {
      const secret = '7890';
      const guesses = [
        { guess: '1234', pans: 0, pots: 0 }, // all 1, 2, 3, 4 are dead!
        { guess: '5678', pans: 0, pots: 2 },
        { guess: '9280', pans: 2, pots: 1 }, // used '2', which was proven dead in turn 1!
      ];

      const report = analyzeBreachReplay(secret, guesses);

      expect(report.steps[0].pans).toBe(0);
      expect(report.steps[0].pots).toBe(0);

      const step3 = report.steps[2];
      expect(step3.efficiencyTag).toBe('WASTED_DEAD_DIGIT');
      expect(step3.wastedDigits).toContain(2);
      expect(step3.nixCommentary).toContain('On Turn 3');
      expect(step3.nixCommentary).toContain('[2]');
      expect(step3.nixCommentary).toContain('already proved it wasn\'t in the cipher');
      expect(report.mistakesCount).toBeGreaterThanOrEqual(1);
    });

    it('accurately detects MISSED_POSITION_LOCK when repeating a known wrong Pot slot', () => {
      const secret = '4829';
      // In guess 1: '1234' -> '2' is at index 1. In secret '4829', 2 is at index 2 (so index 1 is WRONG).
      // If guess 2 repeats '2' at index 1: '0289', that's keeping a Pot in the exact same wrong slot!
      const guesses = [
        { guess: '1234', pans: 0, pots: 2 },
        { guess: '0289', pans: 1, pots: 2 }, // 2 at index 1 again!
      ];

      const report = analyzeBreachReplay(secret, guesses);
      expect(report.steps[1].efficiencyTag).toBe('MISSED_POSITION_LOCK');
      expect(report.steps[1].nixCommentary).toContain('Watch your slot alignment!');
    });

    it('generates a complete ReplayAnalysisReport with Nix overall review', () => {
      const secret = '1234';
      const cleanGuesses = [
        { guess: '5678', pans: 0, pots: 0 },
        { guess: '9012', pans: 0, pots: 2 },
        { guess: '1234', pans: 4, pots: 0 },
      ];

      const report = analyzeBreachReplay(secret, cleanGuesses);
      expect(report.mistakesCount).toBe(0);
      expect(report.nixOverallReview).toContain('Flawless deduction!');
    });
  });

  describe('2. Specialization Skill Tree & Capstone Mutual Exclusivity', () => {
    it('defines 3 distinct specialization branches with Tier 1, Tier 2, and Tier 3 Capstones', () => {
      expect(SPECIALIZATION_SKILLS).toHaveLength(9);

      const infSkills = SPECIALIZATION_SKILLS.filter((s) => s.branch === 'infiltration');
      const anlSkills = SPECIALIZATION_SKILLS.filter((s) => s.branch === 'analysis');
      const expSkills = SPECIALIZATION_SKILLS.filter((s) => s.branch === 'exploitation');

      expect(infSkills).toHaveLength(3);
      expect(anlSkills).toHaveLength(3);
      expect(expSkills).toHaveLength(3);

      expect(infSkills.find((s) => s.id === 'phantom_protocol')?.isCapstone).toBe(true);
      expect(anlSkills.find((s) => s.id === 'quantum_sieve')?.isCapstone).toBe(true);
      expect(expSkills.find((s) => s.id === 'zero_day_payload')?.isCapstone).toBe(true);
    });

    it('provides clear plain-English Nix summaries for all 3 branches', () => {
      expect(SKILL_BRANCH_GUIDES.infiltration.nixSummary).toContain('countdown timers');
      expect(SKILL_BRANCH_GUIDES.analysis.nixSummary).toContain('eliminate numbers and expose lying ICE');
      expect(SKILL_BRANCH_GUIDES.exploitation.nixSummary).toContain('credit bounties');
    });

    it('enforces prerequisite progression within a branch', () => {
      const coolRunning = SPECIALIZATION_SKILLS.find((s) => s.id === 'cool_running')!;
      // Prerequisite is slipstream_boot
      const cannotUnlock = canUnlockSkill(coolRunning, [], 10);
      expect(cannotUnlock.canUnlock).toBe(false);
      expect(cannotUnlock.reason).toContain('Missing prerequisite skills: slipstream_boot');

      const canUnlock = canUnlockSkill(coolRunning, ['slipstream_boot'], 10);
      expect(canUnlock.canUnlock).toBe(true);
    });

    it('enforces STRICT Capstone mutual exclusivity: only ONE Tier 3 skill can be active at a time', () => {
      const phantom = SPECIALIZATION_SKILLS.find((s) => s.id === 'phantom_protocol')!;
      const quantum = SPECIALIZATION_SKILLS.find((s) => s.id === 'quantum_sieve')!;

      // 1. Can unlock Phantom Protocol when prereqs met and no active capstone
      const check1 = canUnlockSkill(phantom, ['slipstream_boot', 'cool_running'], 5);
      expect(check1.canUnlock).toBe(true);

      // 2. If Phantom Protocol is already unlocked, attempting to unlock Quantum Sieve is rejected
      const unlockedIdsWithPhantom = [
        'slipstream_boot',
        'cool_running',
        'phantom_protocol',
        'dead_channel_sweep',
        'ice_diagnostics',
      ];
      const check2 = canUnlockSkill(quantum, unlockedIdsWithPhantom, 5);
      expect(check2.canUnlock).toBe(false);
      expect(check2.reason).toContain('Only one Capstone skill can be active at a time');
    });

    it('free respec refunds 100% of spent points and allows swapping active Capstones', () => {
      const skillsCopy: SkillNode[] = SPECIALIZATION_SKILLS.map((s) => ({
        ...s,
        unlocked: ['slipstream_boot', 'cool_running', 'phantom_protocol'].includes(s.id),
      }));

      // slipstream_boot (1) + cool_running (2) + phantom_protocol (3) = 6 SP spent
      const respecResult = respecSkillTree(skillsCopy, 2);
      expect(respecResult.refundedPoints).toBe(6);
      expect(respecResult.totalAvailablePoints).toBe(8);
      expect(respecResult.skills.every((s) => !s.unlocked)).toBe(true);

      // Now quantum_sieve can be unlocked without capstone conflict (once its prereqs are unlocked)
      const quantum = SPECIALIZATION_SKILLS.find((s) => s.id === 'quantum_sieve')!;
      const canUnlockQuantum = canUnlockSkill(
        quantum,
        ['dead_channel_sweep', 'ice_diagnostics'],
        5,
        respecResult.skills
      );
      expect(canUnlockQuantum.canUnlock).toBe(true);
    });
  });

  describe('3. Faction Standing Milestones & Reputation Ranks', () => {
    it('defines 3 reputation milestones (Known, Trusted, Inner Circle)', () => {
      expect(getFactionMilestone(0).rankName).toBe('Neutral');
      expect(getFactionMilestone(15).rankName).toBe('Rank 1: Known');
      expect(getFactionMilestone(45).rankName).toBe('Rank 2: Trusted');
      expect(getFactionMilestone(70).rankName).toBe('Rank 3: Inner Circle');
    });

    it('includes Kovacs Syndicate, Street Collective, and Aeris Corp with perks & Glitch commentary', () => {
      const kovacs = FACTION_CATALOG.find((f) => f.id === 'kovacs-syndicate');
      const collective = FACTION_CATALOG.find((f) => f.id === 'street-collective');
      const aeris = FACTION_CATALOG.find((f) => f.id === 'aeris-corp');

      expect(kovacs).toBeDefined();
      expect(collective).toBeDefined();
      expect(aeris).toBeDefined();

      expect(kovacs?.glitchCommentary).toContain('debt');
      expect(collective?.glitchCommentary).toContain('Slum');
      expect(aeris?.glitchCommentary).toContain('Tier 4+');

      expect(kovacs?.milestones).toHaveLength(3);
      expect(collective?.milestones).toHaveLength(3);
      expect(aeris?.milestones).toHaveLength(3);
    });
  });
});
