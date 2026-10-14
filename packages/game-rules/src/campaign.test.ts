import { describe, it, expect } from 'vitest';
import {
  CHAPTERS,
  INITIAL_DEBT,
  getChapterById,
  getChapterByNodeId,
  calculateRemainingDebt,
} from './campaign';
import {
  CHARACTERS,
  CHARACTER_MODE,
  getMentorCharacter,
  getBrokerCharacter,
  getCharacterById as getCharById,
} from './characters';

describe('Task 10: Characters Configuration and Roles', () => {
  it('defines Nix and Glitch with distinct roles and voice traits', () => {
    expect(CHARACTERS.nix).toBeDefined();
    expect(CHARACTERS.glitch).toBeDefined();

    expect(CHARACTERS.nix.role).toBe('mentor');
    expect(CHARACTERS.glitch.role).toBe('broker');

    expect(CHARACTERS.nix.name).toBe('Nix');
    expect(CHARACTERS.glitch.name).toBe('Glitch');
  });

  it('provides helper functions reflecting character mode', () => {
    // Default: two characters
    expect(getMentorCharacter().id).toBe('nix');
    expect(getBrokerCharacter().id).toBe('glitch');

    expect(getCharById('nix').id).toBe('nix');
    expect(getCharById('glitch').id).toBe('glitch');
  });

  it('supports single-character mode unification via configuration flag', () => {
    const originalMode = { ...CHARACTER_MODE };

    CHARACTER_MODE.singleCharacterMode = true;
    CHARACTER_MODE.activeMentor = 'nix';

    // In single character mode, mentor absorbs broker
    expect(getBrokerCharacter().id).toBe('nix');
    expect(getCharById('glitch').id).toBe('nix');

    // Restore
    CHARACTER_MODE.singleCharacterMode = originalMode.singleCharacterMode;
    CHARACTER_MODE.activeMentor = originalMode.activeMentor;
    CHARACTER_MODE.activeBroker = originalMode.activeBroker;
  });
});

describe('Task 10: Campaign Data & Progression Rules', () => {
  it('contains four chapters matching docs/HANDOFF.md Section 3.6', () => {
    expect(CHAPTERS).toHaveLength(4);

    const [c1, c2, c3, c4] = CHAPTERS;

    // Chapter 1
    expect(c1.id).toBe('chapter-1');
    expect(c1.title).toBe('Scraping Dirt');
    expect(c1.rules.digits).toBe(3);
    expect(c1.rules.timerSeconds).toBe(0); // no timer
    expect(c1.rules.unlimitedTries).toBe(true);
    expect(c1.rules.allowDuplicates).toBe(false);
    expect(c1.mapNodeId).toBe('n1');
    expect(c1.lesson).toBe('Pot, Pan and elimination');
    expect(c1.contract.debtReduction).toBe(1500);

    // Chapter 2
    expect(c2.id).toBe('chapter-2');
    expect(c2.title).toBe('The Corner Store Job');
    expect(c2.rules.digits).toBe(4);
    expect(c2.rules.attempts).toBe(8);
    expect(c2.rules.timerSeconds).toBe(120);
    expect(c2.mapNodeId).toBe('n4');
    expect(c2.unlocksReward).toBe('blackMarket');
    expect(c2.contract.debtReduction).toBe(2500);

    // Chapter 3
    expect(c3.id).toBe('chapter-3');
    expect(c3.title).toBe('Dirty Collateral');
    expect(c3.rules.digits).toBe(4);
    expect(c3.rules.ice).toBe('Liar');
    expect(c3.unlocksReward).toBe('bridge');
    expect(c3.contract.debtReduction).toBe(3000);

    // Chapter 4
    expect(c4.id).toBe('chapter-4');
    expect(c4.title).toBe('The Rogue Signal');
    expect(c4.rules.digits).toBe(5);
    expect(c4.district).toBe('commercial');
    expect(c4.unlocksReward).toBe('onlinePlay');
    expect(c4.contract.debtReduction).toBe(3000);
  });

  it('defines in-character dialogue lines for both Nix and Glitch in each chapter', () => {
    CHAPTERS.forEach((chapter) => {
      expect(chapter.briefingDialogue.length).toBeGreaterThanOrEqual(2);
      expect(chapter.debriefDialogue.length).toBeGreaterThanOrEqual(2);

      const briefingSpeakers = chapter.briefingDialogue.map((d) => d.speaker);
      expect(briefingSpeakers).toContain('glitch');
      expect(briefingSpeakers).toContain('nix');
    });
  });

  it('includes tutorial steps for Chapter 1 and Chapter 2', () => {
    const c1 = getChapterById('chapter-1');
    expect(c1?.tutorialSteps).toBeDefined();
    expect(c1!.tutorialSteps!.length).toBeGreaterThanOrEqual(5);

    const c2 = getChapterById('chapter-2');
    expect(c2?.tutorialSteps).toBeDefined();
    expect(c2!.tutorialSteps!.length).toBeGreaterThanOrEqual(3);
  });

  it('calculates remaining debt down to zero upon completing all 4 chapters', () => {
    expect(INITIAL_DEBT).toBe(10000);

    let debt = calculateRemainingDebt([]);
    expect(debt).toBe(10000);

    debt = calculateRemainingDebt(['chapter-1']);
    expect(debt).toBe(8500); // 10000 - 1500

    debt = calculateRemainingDebt(['chapter-1', 'chapter-2']);
    expect(debt).toBe(6000); // 8500 - 2500

    debt = calculateRemainingDebt(['chapter-1', 'chapter-2', 'chapter-3']);
    expect(debt).toBe(3000); // 6000 - 3000

    debt = calculateRemainingDebt(['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4']);
    expect(debt).toBe(0); // Completely cleared!
  });

  it('finds chapters by ID and by map node ID', () => {
    expect(getChapterById('chapter-1')?.title).toBe('Scraping Dirt');
    expect(getChapterByNodeId('n1')?.id).toBe('chapter-1');
    expect(getChapterByNodeId('n4')?.id).toBe('chapter-2');
  });
});
