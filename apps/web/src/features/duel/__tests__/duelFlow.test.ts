import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDuelRooms,
  createDuelRoom,
  startDuelSession,
  submitDuelGuess,
  applyDuelSabotage,
  triggerDoubleOrNothing,
  mockWallet,
  mockDuelSessions,
} from '@/app/api/mock/db';
import { calculateScore } from '@neon-cipher/game-rules';

describe('Task 11: Duel Full Flow & Mock Backend Integration', () => {
  beforeEach(() => {
    mockWallet.credits = 10000;
  });

  it('1. Room creation and listing', () => {
    const initialCount = getDuelRooms().length;
    const room = createDuelRoom({
      name: 'Cyber Alley 09',
      matchType: 'wager',
      wager: 300,
      host: 'HEX_VAL',
    });

    expect(room.id).toBeDefined();
    expect(room.name).toBe('Cyber Alley 09');
    expect(room.wager).toBe(300);
    expect(room.ante).toBe(30); // 10%
    expect(room.status).toBe('open');
    expect(getDuelRooms().length).toBe(initialCount + 1);
  });

  it('2. Start duel session: creates session, generates secret, hides secret in safe payload', () => {
    const session = startDuelSession({
      matchType: 'wager',
      wager: 500,
      playerHandle: 'DECKER_PRIME',
    });

    expect(session.id).toBeDefined();
    expect(session.secret).toHaveLength(4);
    expect(session.sharedAttempts).toBe(12);
    expect(session.status).toBe('active');
    expect(session.rival.handle).toBe('Null_Byte');
    // Total pot = 1000, rake = 100, net = 900
    expect(session.totalPot).toBe(1000);
    expect(session.rake).toBe(100);
    expect(session.netPot).toBe(900);
  });

  it('3. Submit guess: scores player guess, triggers rival AI response, decrements shared attempts', () => {
    const session = startDuelSession({
      matchType: 'casual',
      wager: 0,
      playerHandle: 'DECKER_PRIME',
    });

    // Known secret for deterministic test
    const secret = session.secret;
    const testGuess = secret === '1234' ? '5678' : '1234';

    const result = submitDuelGuess({
      duelId: session.id,
      guess: testGuess,
    });

    expect(result.playerGuess.guess).toBe(testGuess);
    expect(result.playerGuess.pots).toBeDefined();
    expect(result.playerGuess.pans).toBeDefined();

    // Rival AI reacted with a guess
    expect(result.rivalGuess).toBeDefined();
    expect(result.rivalGuess?.guess).toHaveLength(4);

    // Shared attempts decremented by 2 (1 player + 1 rival)
    expect(result.session.sharedAttempts).toBe(10);
  });

  it('4. Sabotage: Firewall Patch primes shield, blocks next incoming attack', () => {
    const session = startDuelSession({
      matchType: 'wager',
      wager: 200,
    });

    // 1. Player activates Firewall Patch (450 CR)
    const shieldResult = applyDuelSabotage({
      duelId: session.id,
      toolId: 'tool-firewall-patch',
    });
    expect(shieldResult.success).toBe(true);
    expect(shieldResult.effectApplied).toBe('firewall_shield');
    expect(session.player.shieldActive).toBe(true);

    // 2. Rival has shield activated as well to test absorption
    session.rival.shieldActive = true;

    // Player attacks with Static Injector
    const attackResult = applyDuelSabotage({
      duelId: session.id,
      toolId: 'tool-static-injector',
    });

    // Rival's shield absorbed the attack!
    expect(attackResult.shielded).toBe(true);
    expect(session.rival.shieldActive).toBe(false);
  });

  it('5. Sabotage: Blackout Ping applies 6-second static history effect', () => {
    const session = startDuelSession({
      matchType: 'casual',
      wager: 0,
    });

    const blackoutResult = applyDuelSabotage({
      duelId: session.id,
      toolId: 'tool-blackout-ping',
    });

    expect(blackoutResult.success).toBe(true);
    expect(session.rival.activeEffects).toContain('static_history');
    expect(session.rival.staticExpiry).toBeGreaterThan(Date.now());
  });

  it('6. Double or Nothing: doubles pot and re-calculates rake', () => {
    const session = startDuelSession({
      matchType: 'wager',
      wager: 500,
    });

    // Simulate winning session
    session.status = 'player_won';
    session.winner = 'player';

    const newSession = triggerDoubleOrNothing(session.id);
    expect(newSession.status).toBe('active');
    expect(newSession.totalPot).toBe(1800); // 900 * 2
    expect(newSession.rake).toBe(180);
    expect(newSession.netPot).toBe(1620);
    expect(newSession.sharedAttempts).toBe(12);
  });

  it('7. Ranked exploit restrictions: rejects cheats in wager matches', () => {
    const session = startDuelSession({
      matchType: 'wager',
      wager: 400,
    });

    expect(() => {
      submitDuelGuess({
        duelId: session.id,
        guess: '1234',
        exploitUsed: 'force-pin',
      });
    }).toThrow(/disabled in ranked/i);
  });

  it('8. Stealth Guess: deducts 150 CR stealth fee and marks guess as stealth', () => {
    const session = startDuelSession({
      matchType: 'casual',
      wager: 0,
    });
    mockWallet.credits = 5000;

    const result = submitDuelGuess({
      duelId: session.id,
      guess: '1234',
      isStealth: true,
    });

    expect(result.playerGuess.isStealth).toBe(true);
    expect(mockWallet.credits).toBe(5000 - 150);
  });

  it('9. False Flag Echo: arms deceptive clue broadcast and marks falsified on next guess', () => {
    const session = startDuelSession({
      matchType: 'casual',
      wager: 0,
    });
    mockWallet.credits = 5000;

    const sabotageResult = applyDuelSabotage({
      duelId: session.id,
      toolId: 'tool-false-flag-echo',
    });
    expect(sabotageResult.success).toBe(true);
    expect(session.player.falseFlagActive).toBe(true);

    const testGuess = session.secret === '1234' ? '5678' : '1234';
    const guessResult = submitDuelGuess({
      duelId: session.id,
      guess: testGuess,
    });

    expect(guessResult.playerGuess.falsified).toBe(true);
    expect(session.player.falseFlagActive).toBe(false); // Consumed
  });

  it('10. Snoop Packet: unmasks opponent stealth moves', () => {
    const session = startDuelSession({
      matchType: 'casual',
      wager: 0,
    });
    mockWallet.credits = 5000;

    // Rival has stealth guess
    session.rival.guesses.push({
      guess: '9876',
      pots: 1,
      pans: 0,
      timestamp: Date.now(),
      isStealth: true,
      unmasked: false,
    });

    const snoopResult = applyDuelSabotage({
      duelId: session.id,
      toolId: 'tool-snoop-packet',
    });

    expect(snoopResult.success).toBe(true);
    expect(session.player.snoopActive).toBe(true);
    expect(session.rival.guesses[0].unmasked).toBe(true);
  });
});
