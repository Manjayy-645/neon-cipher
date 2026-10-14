import { describe, it, expect } from 'vitest';
import {
  calculateDuelPot,
  calculateDoubleOrNothing,
  isExploitAllowed,
  SABOTAGE_RULES,
  SABOTAGE_TOOL_CATALOG,
  normalizeSabotageToolId,
  generateNullByteGuess,
  generateFalseFlagClue,
  resolveSabotageAction,
  evaluateDuelGuess,
  formatTelemetryGuess,
  getNixDuelCallout,
  NIX_DUEL_BRIEFINGS,
  DuelMatchState,
  SabotageToolId,
} from './duel';

describe('Duel Game Rules (packages/game-rules)', () => {
  describe('Pot & Rake Calculations', () => {
    it('calculates total pot, 10% rake, and net payout correctly for 500 wager', () => {
      const pot = calculateDuelPot(500, 0.10);
      expect(pot.playerWager).toBe(500);
      expect(pot.totalPot).toBe(1000);
      expect(pot.rake).toBe(100);
      expect(pot.netPot).toBe(900);
    });

    it('handles zero wager casual matches without negative numbers', () => {
      const pot = calculateDuelPot(0, 0.10);
      expect(pot.totalPot).toBe(0);
      expect(pot.rake).toBe(0);
      expect(pot.netPot).toBe(0);
    });

    it('calculates Double or Nothing with 2x multiplier and rake deduction', () => {
      const don = calculateDoubleOrNothing(900, 0.10);
      expect(don.totalPot).toBe(1800);
      expect(don.rake).toBe(180);
      expect(don.netPot).toBe(1620);
    });
  });

  describe('Exploit Restrictions in Ranked vs Casual', () => {
    it('permits exploits in casual matches', () => {
      const result = isExploitAllowed('casual');
      expect(result.allowed).toBe(true);
    });

    it('strictly forbids exploits in High-stakes wager matches', () => {
      const result = isExploitAllowed('wager');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('disabled in ranked');
    });

    it('strictly forbids exploits in Turf war matches', () => {
      const result = isExploitAllowed('turf');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Sabotage Rules & Legacy Costs', () => {
    it('defines Static Injector at 300 credits with scramble_keypad effect in legacy map', () => {
      const rule = SABOTAGE_RULES['tool-static-injector'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(300);
      expect(rule.effectType).toBe('scramble_keypad');
    });

    it('defines Blackout Ping at 550 credits with 6 second static effect', () => {
      const rule = SABOTAGE_RULES['tool-blackout-ping'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(550);
      expect(rule.durationSeconds).toBe(6);
      expect(rule.effectType).toBe('static_history');
    });

    it('defines Trace Accelerator at 800 credits with drain_clock effect', () => {
      const rule = SABOTAGE_RULES['tool-trace-accelerator'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(800);
      expect(rule.effectType).toBe('drain_clock');
    });

    it('defines Firewall Patch at 450 credits with firewall_shield effect', () => {
      const rule = SABOTAGE_RULES['tool-firewall-patch'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(450);
      expect(rule.effectType).toBe('firewall_shield');
    });

    it('defines Snoop Packet at 750 credits with snoop_packet effect', () => {
      const rule = SABOTAGE_RULES['tool-snoop-packet'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(750);
      expect(rule.effectType).toBe('snoop_packet');
    });

    it('defines False Flag Echo at 1100 credits with false_flag_echo effect', () => {
      const rule = SABOTAGE_RULES['tool-false-flag-echo'];
      expect(rule).toBeDefined();
      expect(rule.creditCost).toBe(1100);
      expect(rule.effectType).toBe('false_flag_echo');
    });

    it('generates deceptive clue with generateFalseFlagClue', () => {
      const fake = generateFalseFlagClue(1, 1, 4);
      expect(fake.pots + fake.pans).toBeLessThanOrEqual(4);
      const winFake = generateFalseFlagClue(4, 0, 4);
      expect(winFake.pans).toBe(4);
    });
  });

  describe('Expanded 9-Tool Sabotage Catalog & Metadata', () => {
    const requiredTools: Array<{ id: SabotageToolId; cost: number; effect: string }> = [
      { id: 'static_injector', cost: 250, effect: 'static_history' },
      { id: 'firewall_patch', cost: 400, effect: 'firewall_shield' },
      { id: 'clock_drainer', cost: 350, effect: 'drain_clock' },
      { id: 'packet_sniffer', cost: 500, effect: 'snoop_packet' },
      { id: 'echo_decoy', cost: 300, effect: 'false_flag_echo' },
      { id: 'parity_jammer', cost: 325, effect: 'parity_jam' },
      { id: 'key_latch_virus', cost: 450, effect: 'key_latch' },
      { id: 'logic_bomb', cost: 550, effect: 'logic_bomb' },
      { id: 'mirror_daemon', cost: 650, effect: 'mirror_shield' },
    ];

    it.each(requiredTools)('verifies $id configuration and plain-language guidance tips', ({ id, cost, effect }) => {
      const tool = SABOTAGE_TOOL_CATALOG[id];
      expect(tool).toBeDefined();
      expect(tool.creditCost).toBe(cost);
      expect(tool.effectType).toBe(effect);
      expect(tool.nixExplanation).toBeDefined();
      expect(tool.nixExplanation.length).toBeGreaterThan(10);
      expect(tool.counterPlayTip).toBeDefined();
      expect(tool.counterPlayTip.length).toBeGreaterThan(10);
    });

    it('normalizes legacy and snake_case sabotage tool IDs', () => {
      expect(normalizeSabotageToolId('tool-static-injector')).toBe('tool-static-injector');
      expect(normalizeSabotageToolId('static_injector')).toBe('static_injector');
      expect(normalizeSabotageToolId('tool-blackout-ping')).toBe('tool-blackout-ping');
      expect(normalizeSabotageToolId('clock_drainer')).toBe('clock_drainer');
      expect(normalizeSabotageToolId('parity_jammer')).toBe('parity_jammer');
    });
  });

  describe('LIFO Defensive Buff Interception & Resolution Queue', () => {
    function createMockMatchState(): DuelMatchState {
      return {
        id: 'test-match-1',
        secret: '3819',
        digits: 4,
        sharedAttempts: 12,
        playerAttempts: 7,
        rivalAttempts: 7,
        turnClockSeconds: 30,
        startedAt: Date.now(),
        status: 'active',
        player: {
          handle: 'ZERO_COOL',
          avatar: 'avatar1',
          guesses: [],
          activeEffects: [],
          shieldActive: false,
          cheatUsed: false,
          defensiveBuffs: [],
          stealthChargesRemaining: 1,
        },
        rival: {
          handle: 'Null_Byte',
          avatar: 'avatar2',
          guesses: [],
          activeEffects: [],
          shieldActive: false,
          cheatUsed: false,
          defensiveBuffs: [],
          stealthChargesRemaining: 1,
        },
      };
    }

    it('applies offensive sabotage directly when target has zero defensive buffs', () => {
      const state = createMockMatchState();
      const res = resolveSabotageAction(state, {
        sourceDeckerId: 'player',
        targetDeckerId: 'rival',
        toolId: 'clock_drainer',
      });

      expect(res.event).toBe('SABOTAGE_APPLIED');
      expect(res.effectApplied).toBe('drain_clock');
      expect(state.turnClockSeconds).toBe(22); // 30 - 8s
      expect(state.rival.activeEffects).toContain('drain_clock');
    });

    it('consumes Firewall Patch to block incoming offensive attack 100%', () => {
      const state = createMockMatchState();
      // Prime target with firewall
      resolveSabotageAction(state, {
        sourceDeckerId: 'rival',
        targetDeckerId: 'rival',
        toolId: 'firewall_patch',
      });
      expect(state.rival.shieldActive).toBe(true);
      expect(state.rival.defensiveBuffs).toHaveLength(1);

      // Player fires Clock Drainer
      const attackRes = resolveSabotageAction(state, {
        sourceDeckerId: 'player',
        targetDeckerId: 'rival',
        toolId: 'clock_drainer',
      });

      expect(attackRes.event).toBe('FIREWALL_BLOCKED');
      expect(state.turnClockSeconds).toBe(30); // Clock not drained
      expect(state.rival.shieldActive).toBe(false); // Shield consumed
      expect(state.rival.defensiveBuffs).toHaveLength(0);
    });

    it('consumes Mirror Daemon and reflects 50% penalty back onto attacker', () => {
      const state = createMockMatchState();
      // Rival primes Mirror Daemon
      resolveSabotageAction(state, {
        sourceDeckerId: 'rival',
        targetDeckerId: 'rival',
        toolId: 'mirror_daemon',
      });
      expect(state.rival.shieldActive).toBe(true);

      // Player attacks with Clock Drainer (8 seconds drain)
      const attackRes = resolveSabotageAction(state, {
        sourceDeckerId: 'player',
        targetDeckerId: 'rival',
        toolId: 'clock_drainer',
      });

      expect(attackRes.event).toBe('MIRROR_REFLECTED');
      expect(attackRes.reflectedPenalty?.reflectedSeconds).toBe(4); // 50% of 8s
      expect(state.turnClockSeconds).toBe(26); // 30 - 4s reflected on attacker
      expect(state.player.turnClockSeconds).toBe(26);
      expect(state.rival.shieldActive).toBe(false);
    });

    it('evaluates defensive buffs in strict LIFO order', () => {
      const state = createMockMatchState();
      // 1. First prime Firewall Patch
      resolveSabotageAction(state, {
        sourceDeckerId: 'rival',
        targetDeckerId: 'rival',
        toolId: 'firewall_patch',
      });
      // 2. Then prime Mirror Daemon on top
      resolveSabotageAction(state, {
        sourceDeckerId: 'rival',
        targetDeckerId: 'rival',
        toolId: 'mirror_daemon',
      });

      expect(state.rival.defensiveBuffs).toHaveLength(2);

      // Attack 1 hits top of stack: Mirror Daemon
      const res1 = resolveSabotageAction(state, {
        sourceDeckerId: 'player',
        targetDeckerId: 'rival',
        toolId: 'clock_drainer',
      });
      expect(res1.event).toBe('MIRROR_REFLECTED');
      expect(state.rival.defensiveBuffs).toHaveLength(1);
      expect(state.rival.shieldActive).toBe(true);

      // Attack 2 hits next on stack: Firewall Patch
      const res2 = resolveSabotageAction(state, {
        sourceDeckerId: 'player',
        targetDeckerId: 'rival',
        toolId: 'static_injector',
      });
      expect(res2.event).toBe('FIREWALL_BLOCKED');
      expect(state.rival.defensiveBuffs).toHaveLength(0);
      expect(state.rival.shieldActive).toBe(false);
    });
  });

  describe('evaluateDuelGuess & Sabotage Triggers', () => {
    function createMatch(): DuelMatchState {
      return {
        id: 'test-eval',
        secret: '1234',
        digits: 4,
        sharedAttempts: 12,
        playerAttempts: 7,
        rivalAttempts: 7,
        turnClockSeconds: 30,
        startedAt: Date.now(),
        status: 'active',
        player: {
          handle: 'ZERO_COOL',
          avatar: 'avatar1',
          guesses: [],
          activeEffects: [],
          shieldActive: false,
          cheatUsed: false,
          stealthChargesRemaining: 1,
        },
        rival: {
          handle: 'Null_Byte',
          avatar: 'avatar2',
          guesses: [],
          activeEffects: [],
          shieldActive: false,
          cheatUsed: false,
          stealthChargesRemaining: 1,
        },
      };
    }

    it('Key Latch Virus rejects guesses containing latched keys without burning an attempt', () => {
      const match = createMatch();
      match.player.latchedKeys = ['8', '9'];
      match.player.activeEffects.push('key_latch');

      // Attempt guess containing locked digit '8'
      const rejected = evaluateDuelGuess(match, 'player', '1284');
      expect(rejected.valid).toBe(false);
      expect(rejected.rejectionReason).toContain('Key [8] is locked');
      expect(match.playerAttempts).toBe(7); // No attempt burned
      expect(match.player.latchedKeys).toEqual(['8', '9']); // Still locked

      // Valid guess without locked digits succeeds and releases the latch
      const valid = evaluateDuelGuess(match, 'player', '1235');
      expect(valid.valid).toBe(true);
      expect(match.playerAttempts).toBe(6);
      expect(match.player.latchedKeys).toBeUndefined();
      expect(match.player.activeEffects).not.toContain('key_latch');
    });

    it('Logic Bomb detonates on matching digit, costing 1 extra attempt pip and 5 seconds', () => {
      const match = createMatch();
      match.player.activeLogicBomb = {
        targetDigit: '5',
        sourceDeckerId: 'rival',
      };
      match.player.activeEffects.push('logic_bomb');

      // Guess containing '5' triggers the bomb
      const result = evaluateDuelGuess(match, 'player', '5678');
      expect(result.valid).toBe(true);
      expect(result.logicBombDetonated).toBe(true);
      expect(result.trappedDigit).toBe('5');
      // Standard guess costs 1 attempt + logic bomb costs 1 extra = 2 attempts deducted
      expect(match.playerAttempts).toBe(5); // 7 - 2 = 5
      expect(match.turnClockSeconds).toBe(25); // 30 - 5 = 25s
      expect(match.player.activeLogicBomb).toBeUndefined();
    });

    it('Logic Bomb does NOT trigger if submitted guess lacks the trapped digit', () => {
      const match = createMatch();
      match.player.activeLogicBomb = {
        targetDigit: '9',
        sourceDeckerId: 'rival',
      };

      const result = evaluateDuelGuess(match, 'player', '1234');
      expect(result.valid).toBe(true);
      expect(result.logicBombDetonated).toBe(false);
      expect(match.playerAttempts).toBe(6); // Only standard 1 attempt burned
      expect(match.turnClockSeconds).toBe(30);
    });

    it('Parity Jammer formats clue outputs as [EVEN] or [ODD]', () => {
      const match = createMatch(); // Secret: '1234'
      match.player.parityJamActive = true;

      // Guess '1256' has 2 pans (1, 2) and 0 pots -> total hits = 2 (EVEN)
      const resEven = evaluateDuelGuess(match, 'player', '1256');
      expect(resEven.playerGuess?.parityLabel).toBe('EVEN');

      // Re-arm parity jammer
      match.player.parityJamActive = true;
      // Guess '1987' has 1 pan (1) and 0 pots -> total hits = 1 (ODD)
      const resOdd = evaluateDuelGuess(match, 'player', '1987');
      expect(resOdd.playerGuess?.parityLabel).toBe('ODD');
    });

    it('Stealth Probe consumes free charge on first use', () => {
      const match = createMatch();
      expect(match.player.stealthChargesRemaining).toBe(1);

      const res = evaluateDuelGuess(match, 'player', '1234', { isStealth: true });
      expect(res.playerGuess?.isStealth).toBe(true);
      expect(match.player.stealthChargesRemaining).toBe(0);
    });
  });

  describe('formatTelemetryGuess & Opponent Masking', () => {
    it('shows true digits and clues to the guess owner', () => {
      const guess = {
        guess: '1234',
        pans: 2,
        pots: 1,
        timestamp: Date.now(),
        isStealth: true,
      };
      const formatted = formatTelemetryGuess(guess, true);
      expect(formatted.digits).toEqual(['1', '2', '3', '4']);
      expect(formatted.pans).toBe(2);
      expect(formatted.pots).toBe(1);
    });

    it('masks digits to [?, ?, ?, ?] and hides clues for opponent viewing a stealth guess', () => {
      const guess = {
        guess: '1234',
        pans: 3,
        pots: 0,
        timestamp: Date.now(),
        isStealth: true,
      };
      const formatted = formatTelemetryGuess(guess, false);
      expect(formatted.digits).toEqual(['?', '?', '?', '?']);
      expect(formatted.pans).toBeNull();
      expect(formatted.pots).toBeNull();
      expect(formatted.isStealth).toBe(true);
    });
  });

  describe('Nix In-Game Tactical Mentor Callouts & Briefings', () => {
    it('returns plain-language guidance for parity_jammer', () => {
      const callout = getNixDuelCallout({ type: 'parity_jammer' });
      expect(callout.title).toContain('PARITY JAMMER');
      expect(callout.message).toContain("'EVEN' means 0, 2, or 4 hits");
      expect(callout.advice).toContain('Compare it with your last line');
    });

    it('returns plain-language guidance for key_latch_virus', () => {
      const callout = getNixDuelCallout({ type: 'key_latch_virus' });
      expect(callout.title).toContain('KEY LATCH VIRUS');
      expect(callout.message).toContain('mechanically latched');
      expect(callout.advice).toContain('locks drop after you submit');
    });

    it('returns plain-language guidance for logic_bomb detonation', () => {
      const callout = getNixDuelCallout({ type: 'logic_bomb', trappedDigit: '4' });
      expect(callout.title).toContain('LOGIC BOMB');
      expect(callout.message).toContain('digit [4]');
    });

    it('returns plain-language guidance for opponent stealth_probe', () => {
      const callout = getNixDuelCallout({ type: 'stealth_probe' });
      expect(callout.title).toContain('STEALTH PROBE');
      expect(callout.advice).toContain('Clock Drainer');
    });

    it('returns plain-language guidance for firewall_blocked', () => {
      const callout = getNixDuelCallout({ type: 'firewall_blocked' });
      expect(callout.title).toContain('FIREWALL INTERCEPTION');
      expect(callout.message).toContain('shield just ate their sabotage');
    });

    it('returns plain-language guidance for mirror_reflected', () => {
      const callout = getNixDuelCallout({ type: 'mirror_reflected' });
      expect(callout.title).toContain('MIRROR DAEMON');
      expect(callout.message).toContain('Bounced 50%');
    });

    it('defines clear onboarding briefings for shared feed and sabotage deck', () => {
      expect(NIX_DUEL_BRIEFINGS.shared_feed.body).toContain('both of you are cracking the exact same lock');
      expect(NIX_DUEL_BRIEFINGS.sabotage_deck.body).toContain('Tap and hold any tool on your rig bar');
    });
  });

  describe('Null_Byte AI Opponent Simulation', () => {
    it('generates valid digits of the exact specified length', () => {
      const guess = generateNullByteGuess(4, [], '4567');
      expect(guess).toHaveLength(4);
      expect(/^\d+$/.test(guess)).toBe(true);
    });

    it('avoids repeating identical guesses already submitted', () => {
      const guess = generateNullByteGuess(4, ['1234', '5678'], '9012');
      expect(guess).not.toBe('1234');
      expect(guess).not.toBe('5678');
    });
  });
});
