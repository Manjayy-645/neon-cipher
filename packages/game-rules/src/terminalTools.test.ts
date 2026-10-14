import { describe, it, expect } from 'vitest';
import {
  applyTerminalTool,
  TERMINAL_TOOL_RULES,
  TerminalToolRule,
  RIG_HARDWARE_MODULES,
  RigHardwareId,
  EquippedRigState,
  validateEquippedRails,
  equipRailModule,
  computeEffectiveRigStats,
  calculateParityDistribution,
  RIG_PRESETS,
  applyRigPreset,
  getHardwareStatPreview,
} from './terminalTools';

describe('Terminal Tools (game-rules)', () => {
  describe('Rule Registry', () => {
    it('contains rules for all standard equipped consumable tools', () => {
      expect(TERMINAL_TOOL_RULES['tool-static-injector']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-firewall-patch']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-snoop-packet']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-trace-accelerator']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-signal-sniffer']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-blackout-ping']).toBeDefined();
      expect(TERMINAL_TOOL_RULES['tool-false-flag-echo']).toBeDefined();
    });
  });

  describe('Static Injector', () => {
    it('eliminates a dead digit not in secret and not already eliminated', () => {
      const secret = '123';
      const eliminated = ['4', '5'];
      const result = applyTerminalTool({
        toolId: 'tool-static-injector',
        secret,
        eliminatedDigits: eliminated,
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('eliminate_digit');
      expect(result.eliminatedDigit).toBeDefined();
      expect(secret.includes(result.eliminatedDigit!)).toBe(false);
      expect(eliminated.includes(result.eliminatedDigit!)).toBe(false);
      expect(result.message).toContain(result.eliminatedDigit!);
    });
  });

  describe('Firewall Patch', () => {
    it('primes a defensive ICE shield', () => {
      const result = applyTerminalTool({
        toolId: 'tool-firewall-patch',
        secret: '456',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('firewall_shield');
      expect(result.shieldArmed).toBe(true);
      expect(result.message).toContain('Firewall Patch');
    });
  });

  describe('Trace Accelerator', () => {
    it('adds 10 seconds to the clock', () => {
      const result = applyTerminalTool({
        toolId: 'tool-trace-accelerator',
        secret: '789',
        eliminatedDigits: [],
        timerSeconds: 45,
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('add_time');
      expect(result.timeAddedSeconds).toBe(10);
      expect(result.message).toContain('10 seconds');
    });
  });

  describe('Signal Sniffer', () => {
    it('correctly reports no duplicate digits when digits are unique', () => {
      const result = applyTerminalTool({
        toolId: 'tool-signal-sniffer',
        secret: '381',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('detect_duplicates');
      expect(result.hasDuplicates).toBe(false);
      expect(result.message).toContain('unique');
    });

    it('correctly reports duplicate digits when digits repeat', () => {
      const result = applyTerminalTool({
        toolId: 'tool-signal-sniffer',
        secret: '338',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('detect_duplicates');
      expect(result.hasDuplicates).toBe(true);
      expect(result.message).toContain('Duplicate');
    });
  });

  describe('Snoop Packet', () => {
    it('unmasks a dead digit from carrier telemetry', () => {
      const secret = '492';
      const result = applyTerminalTool({
        toolId: 'tool-snoop-packet',
        secret,
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('eliminate_digit');
      expect(result.eliminatedDigit).toBeDefined();
      expect(secret.includes(result.eliminatedDigit!)).toBe(false);
    });
  });

  describe('Frequency Probe', () => {
    it('correctly calculates and reports parity of secret digit sum', () => {
      // 1 + 2 + 3 = 6 (even)
      const evenResult = applyTerminalTool({
        toolId: 'tool-frequency-probe',
        secret: '123',
      });
      expect(evenResult.success).toBe(true);
      expect(evenResult.effectType).toBe('probe_parity');
      expect(evenResult.message).toContain('EVEN');

      // 1 + 2 + 4 = 7 (odd)
      const oddResult = applyTerminalTool({
        toolId: 'tool-frequency-probe',
        secret: '124',
      });
      expect(oddResult.success).toBe(true);
      expect(oddResult.effectType).toBe('probe_parity');
      expect(oddResult.message).toContain('ODD');
    });
  });

  describe('Exploit: Digit Scrub', () => {
    it('eliminates a dead digit from cipher candidates', () => {
      const secret = '359';
      const result = applyTerminalTool({
        toolId: 'exploit-digit-scrub',
        secret,
        eliminatedDigits: ['0', '1'],
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('eliminate_digit');
      expect(result.eliminatedDigit).toBeDefined();
      expect(secret.includes(result.eliminatedDigit!)).toBe(false);
      expect(['0', '1'].includes(result.eliminatedDigit!)).toBe(false);
    });
  });

  describe('Exploit: Time Freeze', () => {
    it('adds 20 seconds to the countdown clock', () => {
      const result = applyTerminalTool({
        toolId: 'exploit-time-freeze',
        secret: '123',
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('add_time');
      expect(result.timeAddedSeconds).toBe(20);
      expect(result.message).toContain('20 seconds');
    });
  });

  describe('Exploit: Extra Cycle', () => {
    it('adds +2 extra guess attempts', () => {
      const result = applyTerminalTool({
        toolId: 'exploit-extra-cycle',
        secret: '123',
        attemptsLeft: 3,
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('extra_attempts');
      expect(result.extraAttempts).toBe(2);
      expect(result.message).toContain('+2');
    });
  });

  describe('Exploit: Slot Peek', () => {
    it('unmasks the exact digit for the requested/next unrevealed slot', () => {
      const result = applyTerminalTool({
        toolId: 'exploit-slot-peek',
        secret: '782',
        revealedSlots: [0], // Slot 0 already known
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('slot_peek');
      expect(result.revealedSlot).toEqual({ slotIndex: 1, digit: '8' });
      expect(result.message).toContain('Slot [2]');
      expect(result.message).toContain('[8]');
    });
  });

  describe('Exploit: Contradiction Scan', () => {
    it('detects contradiction with prior clue history', () => {
      const history = [{ guess: '123', pots: 0, pans: 0 }];
      const result = applyTerminalTool({
        toolId: 'exploit-contradiction-scan',
        secret: '456',
        history,
        currentEntry: '145',
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('contradiction_scan');
      expect(result.message).toContain('Contradiction');
    });

    it('approves mathematically consistent candidate', () => {
      const history = [{ guess: '123', pots: 0, pans: 1 }];
      const result = applyTerminalTool({
        toolId: 'exploit-contradiction-scan',
        secret: '156',
        history,
        currentEntry: '156',
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('contradiction_scan');
      expect(result.message).toContain('consistent');
    });
  });

  describe('Exploit: Second Chance', () => {
    it('grants +3 emergency attempts with history intact', () => {
      const result = applyTerminalTool({
        toolId: 'exploit-second-chance',
        secret: '123',
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('second_chance');
      expect(result.extraAttempts).toBe(3);
    });
  });

  describe('Exploit: Skeleton Key', () => {
    it('auto-cracks Tier 1 or Tier 2 nodes', () => {
      const result = applyTerminalTool({
        toolId: 'exploit-skeleton-key',
        secret: '482',
        tier: 1,
      });
      expect(result.success).toBe(true);
      expect(result.effectType).toBe('skeleton_key');
      expect(result.autoCrack).toBe(true);
      expect(result.secret).toBe('482');
    });

    it('rejects cracking on Tier 3 or higher nodes', () => {
      const result = applyTerminalTool({
        toolId: 'exploit-skeleton-key',
        secret: '482',
        tier: 3,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Tier 1 or Tier 2');
    });
  });

  describe('Cryo-Pulse Spike (freeze_timer)', () => {
    it('freezes the countdown clock for 15 seconds', () => {
      const result = applyTerminalTool({
        toolId: 'tool-cryo-pulse',
        secret: '918',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('freeze_timer');
      expect(result.timerFrozenSeconds).toBe(15);
      expect(result.message).toContain('15 seconds');
    });
  });

  describe('Zero-Day Exploit (slot_peek)', () => {
    it('unmasks the first unrevealed slot digit', () => {
      const result = applyTerminalTool({
        toolId: 'tool-zero-day',
        secret: '918',
        revealedSlots: [0],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('slot_peek');
      expect(result.revealedSlot).toEqual({
        slotIndex: 1,
        digit: '1',
      });
      expect(result.message).toContain('Slot [2] is confirmed to be digit [1]');
    });
  });

  describe('Cryo-Spike utility consumable (12s freeze)', () => {
    it('freezes the countdown clock for 12 seconds with glitch and nix guidance', () => {
      const rule = TERMINAL_TOOL_RULES['cryo_spike'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(375);
      expect(rule.category).toBe('utility');
      expect(rule.freezeDurationSeconds).toBe(12);
      expect(rule.freezeDurationMs).toBe(12000);
      expect(rule.nixExplanation).toContain('12 seconds');

      const result = applyTerminalTool({
        toolId: 'cryo_spike',
        secret: '918',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('freeze_timer');
      expect(result.timerFrozenSeconds).toBe(12);
      expect(result.timerFrozenMs).toBe(12000);
      expect(result.timeAddedSeconds).toBe(12);
      expect(result.message).toContain('12 seconds');
    });
  });

  describe('Cleanse Subroutine utility consumable (ICE purge)', () => {
    it('purges active ICE and reveals true Pan/Pot counts from previous history', () => {
      const rule = TERMINAL_TOOL_RULES['cleanse_subroutine'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(425);
      expect(rule.category).toBe('utility');
      expect(rule.cleanseTurns).toBe(2);
      expect(rule.nixExplanation).toContain('scrub the virus');

      const history = [{ guess: '123', pots: 0, pans: 1 }];
      const result = applyTerminalTool({
        toolId: 'cleanse_subroutine',
        secret: '145',
        history,
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('cleanse_ice');
      expect(result.cleanseTurns).toBe(2);
      expect(result.purgedIce).toBe(true);
      expect(result.revealedClue).toEqual({
        pans: 1,
        pots: 0,
        rawFeedback: 'True Clues: 1 PAN (Green exact) / 0 POT (Amber misplaced)',
      });
      expect(result.message).toContain('Malicious ICE purged for 2 turns');
    });

    it('cleanses successfully on first turn even when no prior history exists', () => {
      const result = applyTerminalTool({
        toolId: 'cleanse_subroutine',
        secret: '145',
        history: [],
      });

      expect(result.success).toBe(true);
      expect(result.effectType).toBe('cleanse_ice');
      expect(result.cleanseTurns).toBe(2);
      expect(result.purgedIce).toBe(true);
    });
  });

  describe('4-Rail Cyberdeck Hardware Modules & Slot Exclusivity', () => {
    it('defines all 8 hardware modules across 4 rail slots with complete mentor guidance', () => {
      const moduleIds = Object.keys(RIG_HARDWARE_MODULES) as RigHardwareId[];
      expect(moduleIds).toHaveLength(8);

      moduleIds.forEach((id) => {
        const mod = RIG_HARDWARE_MODULES[id];
        expect(mod.id).toBe(id);
        expect(mod.name).toBeTruthy();
        expect(['memory_1', 'memory_2', 'coprocessor', 'bus_interconnect']).toContain(mod.railSlot);
        expect(mod.cost).toBeGreaterThan(0);
        expect(mod.buildArchetype).toBeTruthy();
        expect(mod.mechanicalEffect).toBeTruthy();
        expect(mod.alexExplanation).toBeTruthy();
        expect(mod.nixTip).toBeTruthy();
        expect(mod.glitchPitch).toBeTruthy();
      });
    });

    it('validates mutual exclusivity on rail slots', () => {
      // Valid loadout: 1 module per rail slot
      const validLoadout: EquippedRigState = {
        memory_1: 'memory_buffer_mk1',
        memory_2: 'memory_buffer_mk2',
        coprocessor: 'heuristic_coproc',
        bus_interconnect: 'overclocked_quartz_bus',
      };
      expect(validateEquippedRails(validLoadout).valid).toBe(true);

      // Invalid loadout: module equipped into the wrong slot
      const invalidLoadout: EquippedRigState = {
        memory_1: 'heuristic_coproc' as any, // coproc in memory_1
      };
      const check = validateEquippedRails(invalidLoadout);
      expect(check.valid).toBe(false);
      expect(check.errors![0]).toContain('belongs to coprocessor, cannot equip to memory_1');
    });

    it('hot-swaps modules safely into designated rail slots', () => {
      let state: EquippedRigState = {
        memory_1: 'memory_buffer_mk1',
        coprocessor: 'heuristic_coproc',
      };

      // Hot swap Memory 1 to Neural Reflex Capacitor
      state = equipRailModule(state, 'memory_1', 'neural_reflex_cap');
      expect(state.memory_1).toBe('neural_reflex_cap');

      // Hot swap Co-Processor to Parity Scanner ASIC
      state = equipRailModule(state, 'coprocessor', 'parity_scanner_asic');
      expect(state.coprocessor).toBe('parity_scanner_asic');

      // Unequip slot
      state = equipRailModule(state, 'memory_1', null);
      expect(state.memory_1).toBeNull();
    });

    it('rejects hot-swapping into mismatched rail slots', () => {
      const state: EquippedRigState = {};
      expect(() => {
        equipRailModule(state, 'bus_interconnect', 'memory_buffer_mk1');
      }).toThrow(/cannot be equipped into slot bus_interconnect/);
    });
  });

  describe('Pure Rig Stat Calculator (computeEffectiveRigStats)', () => {
    const baseT1 = { tier: 1, attempts: 8, timerSeconds: 90, bounty: 120 };
    const baseT2 = { tier: 2, attempts: 6, timerSeconds: 45, bounty: 650 };
    const baseT3 = { tier: 3, attempts: 6, timerSeconds: 45, bounty: 2800 };

    it('applies Memory Buffer Mk I (+1 attempt) only on Tier 1 and Tier 2 nodes', () => {
      const t1Stats = computeEffectiveRigStats(baseT1, { memory_1: 'memory_buffer_mk1' });
      expect(t1Stats.maxAttempts).toBe(9);

      const t2Stats = computeEffectiveRigStats(baseT2, { memory_1: 'memory_buffer_mk1' });
      expect(t2Stats.maxAttempts).toBe(7);

      const t3Stats = computeEffectiveRigStats(baseT3, { memory_1: 'memory_buffer_mk1' });
      expect(t3Stats.maxAttempts).toBe(6); // No bonus on Tier 3
    });

    it('applies Memory Buffer Mk II (+1 attempt) only on Tier 3, 4, and 5 nodes', () => {
      const t2Stats = computeEffectiveRigStats(baseT2, { memory_2: 'memory_buffer_mk2' });
      expect(t2Stats.maxAttempts).toBe(6); // No bonus on Tier 2

      const t3Stats = computeEffectiveRigStats(baseT3, { memory_2: 'memory_buffer_mk2' });
      expect(t3Stats.maxAttempts).toBe(7);
    });

    it('applies Overclocked Quartz Bus (+15s timer, +20% bounty, -1 attempt, floor at 3)', () => {
      const stats = computeEffectiveRigStats(baseT2, { bus_interconnect: 'overclocked_quartz_bus' });
      expect(stats.timerSeconds).toBe(60); // 45 + 15
      expect(stats.bounty).toBe(780); // 650 * 1.2
      expect(stats.bountyMultiplier).toBe(1.2);
      expect(stats.maxAttempts).toBe(5); // 6 - 1

      // Verify safety floor at 3 attempts
      const tightNode = { tier: 5, attempts: 3, timerSeconds: 30, bounty: 35000 };
      const floorStats = computeEffectiveRigStats(tightNode, { bus_interconnect: 'overclocked_quartz_bus' });
      expect(floorStats.maxAttempts).toBe(3); // Never drops below 3
    });

    it('applies Lead-Shielded Chassis (-60% fines, -50% heat, burn immune)', () => {
      const stats = computeEffectiveRigStats(baseT2, { bus_interconnect: 'lead_shielded_chassis' });
      expect(stats.fineReductionPercent).toBe(60);
      expect(stats.heatMultiplier).toBe(0.5);
      expect(stats.burnImmune).toBe(true);
    });

    it('applies Heuristic Co-Processor (2 dead digits purged)', () => {
      const stats = computeEffectiveRigStats(baseT2, { coprocessor: 'heuristic_coproc' });
      expect(stats.autoDeadDigitsCount).toBe(2);
    });

    it('applies Parity Scanner ASIC (reveals parity distribution)', () => {
      const stats = computeEffectiveRigStats(baseT2, { coprocessor: 'parity_scanner_asic' });
      expect(stats.revealParityDistribution).toBe(true);
    });

    it('applies Neural Reflex Capacitor and Syndicate Skimmer flags', () => {
      const stats = computeEffectiveRigStats(baseT2, {
        memory_1: 'neural_reflex_cap',
        memory_2: 'syndicate_skimmer',
      });
      expect(stats.hasNeuralReflex).toBe(true);
      expect(stats.hasSyndicateSkimmer).toBe(true);
    });
  });

  describe('Parity Scanner ASIC & calculateParityDistribution', () => {
    it('accurately counts Even (0,2,4,6,8) vs Odd (1,3,5,7,9) across 3, 4, and 5-digit secrets', () => {
      // 3 digits: '123' -> 1 even (2), 2 odd (1, 3)
      const res3 = calculateParityDistribution('123');
      expect(res3.evenCount).toBe(1);
      expect(res3.oddCount).toBe(2);
      expect(res3.formatted).toBe('[ 1 EVEN // 2 ODD ]');

      // 4 digits: '0482' -> 4 even, 0 odd (0 is even!)
      const res4 = calculateParityDistribution('0482');
      expect(res4.evenCount).toBe(4);
      expect(res4.oddCount).toBe(0);
      expect(res4.formatted).toBe('[ 4 EVEN // 0 ODD ]');

      // 4 digits balanced: '2479' -> 2 even, 2 odd
      const res4b = calculateParityDistribution('2479');
      expect(res4b.evenCount).toBe(2);
      expect(res4b.oddCount).toBe(2);
      expect(res4b.formatted).toBe('[ 2 EVEN // 2 ODD ]');

      // 5 digits: '13579' -> 0 even, 5 odd
      const res5 = calculateParityDistribution('13579');
      expect(res5.evenCount).toBe(0);
      expect(res5.oddCount).toBe(5);
      expect(res5.formatted).toBe('[ 0 EVEN // 5 ODD ]');
    });
  });

  describe('Alex\'s Recommended Loadout Presets', () => {
    it('defines 3 distinct archetypes with Alex\'s build notes', () => {
      expect(RIG_PRESETS).toHaveLength(3);
      const [safe, cash, pvp] = RIG_PRESETS;

      expect(safe.id).toBe('safe_learner');
      expect(safe.modules.memory_1).toBe('memory_buffer_mk1');
      expect(safe.modules.coprocessor).toBe('heuristic_coproc');
      expect(safe.modules.bus_interconnect).toBe('lead_shielded_chassis');
      expect(safe.alexNote).toContain('Maximum extra tries');

      expect(cash.id).toBe('cash_farmer');
      expect(cash.modules.memory_1).toBe('memory_buffer_mk1');
      expect(cash.modules.memory_2).toBe('syndicate_skimmer');
      expect(cash.modules.bus_interconnect).toBe('overclocked_quartz_bus');
      expect(cash.alexNote).toContain('Maximizes credit payouts');

      expect(pvp.id).toBe('pvp_duelist');
      expect(pvp.modules.memory_1).toBe('neural_reflex_cap');
      expect(pvp.modules.coprocessor).toBe('parity_scanner_asic');
      expect(pvp.alexNote).toContain('Null_Byte');
    });

    it('applies preset equipping only owned parts and tracking missing modules', () => {
      // Player only owns Memory Buffer Mk I and Heuristic Co-Processor
      const owned: RigHardwareId[] = ['memory_buffer_mk1', 'heuristic_coproc'];
      const res = applyRigPreset('safe_learner', owned);

      expect(res.equippedCount).toBe(2);
      expect(res.equipped.memory_1).toBe('memory_buffer_mk1');
      expect(res.equipped.coprocessor).toBe('heuristic_coproc');
      expect(res.equipped.bus_interconnect).toBeUndefined();
      expect(res.missingModules).toEqual(['lead_shielded_chassis']);
    });
  });

  describe('Hardware Stat Preview (getHardwareStatPreview)', () => {
    it('computes live before/after diffs and trade-off notes for Overclocked Quartz Bus', () => {
      const current: EquippedRigState = {};
      const preview = getHardwareStatPreview('overclocked_quartz_bus', current);

      expect(preview.moduleName).toBe('Overclocked Quartz Bus');
      expect(preview.slot).toBe('bus_interconnect');
      expect(preview.tradeOffNote?.toLowerCase()).toContain('reduces max attempts');

      // Check change rows
      const timerChange = preview.changes.find((c) => c.label === 'Trace Timer');
      expect(timerChange).toBeDefined();
      expect(timerChange?.before).toBe('45s');
      expect(timerChange?.after).toBe('60s');
      expect(timerChange?.tone).toBe('positive');

      const bountyChange = preview.changes.find((c) => c.label === 'Bounty Payout');
      expect(bountyChange).toBeDefined();
      expect(bountyChange?.before).toBe('$650');
      expect(bountyChange?.after).toBe('$780');

      const attemptsChange = preview.changes.find((c) => c.label === 'Attempt Pips');
      expect(attemptsChange).toBeDefined();
      expect(attemptsChange?.before).toBe('6');
      expect(attemptsChange?.after).toBe('5');
      expect(attemptsChange?.tone).toBe('warning');
    });

    it('includes clear slot swap notice when target rail slot is already occupied', () => {
      const current: EquippedRigState = {
        coprocessor: 'heuristic_coproc',
      };
      const preview = getHardwareStatPreview('parity_scanner_asic', current);

      expect(preview.slotSwapNotice).toContain('Replaces Heuristic Co-Processor on your Co-Processor Socket');
      expect(preview.slotSwapNotice).toContain('You keep both in storage and can swap back anytime');
    });
  });

  describe('Unknown Tool', () => {
    it('returns error when toolId is not recognized', () => {
      const result = applyTerminalTool({
        toolId: 'non-existent-tool',
        secret: '123',
        eliminatedDigits: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});


