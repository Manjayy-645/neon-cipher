import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore, isChromeVisible } from '../onboardingStore';
import {
  getOnboardingRedirect,
  shouldExitGuidedChapterHack,
} from '../components/OnboardingGate';
import { getPendingQuest } from '../components/PendingQuestNotification';
import { AVATAR_OPTIONS, validateCallsign } from '../components/ProfileScreen';
import { STEP_ORDER } from '../steps';

describe('Onboarding Foundation (Task O-A)', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  describe('onboardingStore', () => {
    it('initializes with default state', () => {
      const state = useOnboardingStore.getState();
      expect(state.step).toBe('splash');
      expect(state.skipped).toBe(false);
      expect(state.callsign).toBeNull();
      expect(state.avatarId).toBeNull();
      expect(state.wins).toBe(0);
      expect(state.ch2Fails).toBe(0);
      expect(state.guestId).toBeDefined();
    });

    it('advances sequentially when to is not provided', () => {
      useOnboardingStore.getState().advance();
      expect(useOnboardingStore.getState().step).toBe('cold.intro');

      useOnboardingStore.getState().advance();
      expect(useOnboardingStore.getState().step).toBe('cold.clues');
    });

    it('advances forward to a specific step', () => {
      useOnboardingStore.getState().advance('glitch.intro');
      expect(useOnboardingStore.getState().step).toBe('glitch.intro');
    });

    it('ignores advance attempts to earlier steps (cannot go backwards)', () => {
      useOnboardingStore.getState().advance('map.overview');
      expect(useOnboardingStore.getState().step).toBe('map.overview');

      // Attempt to go back to splash or cold.intro
      useOnboardingStore.getState().advance('cold.intro');
      expect(useOnboardingStore.getState().step).toBe('map.overview');

      useOnboardingStore.getState().advance('splash');
      expect(useOnboardingStore.getState().step).toBe('map.overview');
    });

    it('skip sets skipped to true and step to done', () => {
      useOnboardingStore.getState().skip();
      const state = useOnboardingStore.getState();
      expect(state.skipped).toBe(true);
      expect(state.step).toBe('done');
    });

    it('records wins, failures, and cracked nodes', () => {
      useOnboardingStore.getState().recordWin();
      useOnboardingStore.getState().recordWin();
      expect(useOnboardingStore.getState().wins).toBe(2);

      useOnboardingStore.getState().recordCh2Fail();
      expect(useOnboardingStore.getState().ch2Fails).toBe(1);

      useOnboardingStore.getState().crackNode('s1', 840000);
      const cracked = useOnboardingStore.getState().crackedNodes['s1'];
      expect(cracked).toBeDefined();
      expect(cracked.cooldownMs).toBe(840000);
      expect(cracked.crackedAt).toBeGreaterThan(0);
    });

    it('reset clears state to initial defaults', () => {
      useOnboardingStore.getState().setProfile('TESTER', 'avatar-nx');
      useOnboardingStore.getState().recordWin();
      useOnboardingStore.getState().advance('map.overview');

      useOnboardingStore.getState().reset();
      const state = useOnboardingStore.getState();
      expect(state.step).toBe('splash');
      expect(state.callsign).toBeNull();
      expect(state.avatarId).toBeNull();
      expect(state.wins).toBe(0);
      expect(state.skipped).toBe(false);
    });

    it('evaluates chromeVisible correctly', () => {
      // At splash: chrome is false
      expect(isChromeVisible('splash', false, false)).toBe(false);

      // In terminal: chrome is false
      expect(isChromeVisible('cold.intro', false, false)).toBe(false);

      // On map: chrome is true
      expect(isChromeVisible('map.overview', false, true)).toBe(true);

      // When skipped without profile: chrome is false
      expect(isChromeVisible('splash', true, false)).toBe(false);

      // When skipped with profile: chrome is true
      expect(isChromeVisible('splash', true, true)).toBe(true);
    });
  });

  describe('getOnboardingRedirect (pure gate decision)', () => {
    it('returns null when onboarding is done', () => {
      const redirect = getOnboardingRedirect('/map', {
        step: 'done',
        skipped: false,
        callsign: 'ROOKIE',
        ch2Fails: 0,
      });
      expect(redirect).toBeNull();
    });

    it('returns null when skipped with an existing profile', () => {
      const redirect = getOnboardingRedirect('/map', {
        step: 'splash',
        skipped: true,
        callsign: 'ROOKIE',
        ch2Fails: 0,
      });
      expect(redirect).toBeNull();
    });

    it('redirects to splash when visiting protected app routes without profile', () => {
      const redirect = getOnboardingRedirect('/map', {
        step: 'splash',
        skipped: false,
        callsign: null,
        ch2Fails: 0,
      });
      expect(redirect).toBe('/');
    });

    it('does not force redirect when visiting other routes with an incomplete task (shows pending quest notification instead)', () => {
      const redirect = getOnboardingRedirect('/map', {
        step: 'cold.intro',
        skipped: false,
        callsign: null,
        ch2Fails: 0,
      });
      expect(redirect).toBeNull();
    });

    it('allows player to stay on current step route', () => {
      const redirect = getOnboardingRedirect('/terminal/tutorial-soda', {
        step: 'cold.intro',
        skipped: false,
        callsign: null,
        ch2Fails: 0,
      });
      expect(redirect).toBeNull();
    });

    it('does not force redirect when visiting market before reaching market step', () => {
      const redirect = getOnboardingRedirect('/market', {
        step: 'map.district',
        skipped: false,
        callsign: 'ROOKIE',
        ch2Fails: 0,
      });
      expect(redirect).toBeNull();
    });

    it('allows returning to the map during the Chapter 2 hack', () => {
      const redirect = getOnboardingRedirect('/map', {
        step: 'ch2.hack',
        skipped: false,
        callsign: 'ROOKIE',
        ch2Fails: 0,
      });
      expect(redirect).toBeNull();
    });

    it('exits the guided hack when a profiled player navigates to another game page', () => {
      const state = {
        step: 'ch2.hack' as const,
        skipped: false,
        callsign: 'ROOKIE',
        ch2Fails: 0,
      };
      expect(shouldExitGuidedChapterHack('/market', state)).toBe(true);
      expect(getOnboardingRedirect('/market', state)).toBeNull();
      expect(shouldExitGuidedChapterHack('/terminal/n4', state)).toBe(false);

      expect(getOnboardingRedirect('/terminal/n4', {
          step: 'ch2.hack',
          skipped: false,
          callsign: 'ROOKIE',
          ch2Fails: 0,
        })).toBeNull();
    });
  });

  describe('validateCallsign', () => {
    it('rejects empty callsign', () => {
      expect(validateCallsign('').valid).toBe(false);
      expect(validateCallsign('   ').valid).toBe(false);
    });

    it('rejects callsigns shorter than 3 characters', () => {
      const res = validateCallsign('AB');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Callsign must be at least 3 characters.');
    });

    it('rejects callsigns longer than 16 characters', () => {
      const res = validateCallsign('A'.repeat(17));
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Callsign cannot exceed 16 characters.');
    });

    it('rejects invalid characters', () => {
      const res = validateCallsign('USER-NAME!');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Only letters, numbers, and underscores allowed.');
    });

    it('rejects reserved callsigns', () => {
      const reserved = ['NULL_BYTE', 'GLITCH', 'NIX', 'ALEX', 'ADMIN', 'KOVACS'];
      for (const name of reserved) {
        const res = validateCallsign(name);
        expect(res.valid).toBe(false);
        expect(res.error).toBe('That name is taken.');

        // Case insensitive
        const lowerRes = validateCallsign(name.toLowerCase());
        expect(lowerRes.valid).toBe(false);
        expect(lowerRes.error).toBe('That name is taken.');
      }
    });

    it('accepts valid callsigns', () => {
      expect(validateCallsign('ZERO_COOL').valid).toBe(true);
      expect(validateCallsign('ROOKIE_99').valid).toBe(true);
      expect(validateCallsign('NEO').valid).toBe(true);
    });
  });

  it('uses all six configured player portraits for onboarding avatars', () => {
    expect(AVATAR_OPTIONS).toHaveLength(6);
    expect(AVATAR_OPTIONS.every((avatar) => avatar.id && avatar.name && avatar.url)).toBe(true);
    expect(AVATAR_OPTIONS.map((avatar) => avatar.id)).toEqual([
      'avatar-nx',
      'avatar-gl',
      'avatar-zk',
      'avatar-ph',
      'avatar-cy',
      'avatar-op',
    ]);
  });

  describe('getPendingQuest (pending quest detection)', () => {
    it('returns tutorial soda quest when in cold intro', () => {
      const quest = getPendingQuest('cold.intro', false, null);
      expect(quest).not.toBeNull();
      expect(quest?.id).toBe('quest-tutorial-soda');
      expect(quest?.title).toBe('Tutorial: Breach Soda Machine');
      expect(quest?.route).toBe('/terminal/tutorial-soda');
    });

    it('returns Chapter 2 quest when in ch2.hack', () => {
      const quest = getPendingQuest('ch2.hack', false, null);
      expect(quest).not.toBeNull();
      expect(quest?.id).toBe('quest-ch2-hack');
      expect(quest?.title).toBe('Chapter 02: First Clean Run');
      expect(quest?.route).toBe('/terminal/n4');
    });

    it('returns black market quest when in market.buy', () => {
      const quest = getPendingQuest('market.buy', false, null);
      expect(quest).not.toBeNull();
      expect(quest?.id).toBe('quest-market');
      expect(quest?.route).toBe('/market');
    });

    it('returns active campaign chapter quest when onboarding is done and chapter active', () => {
      const quest = getPendingQuest('done', false, 'chapter-2', {
        'chapter-2': { status: 'active' },
      });
      expect(quest).not.toBeNull();
      expect(quest?.id).toBe('campaign-chapter-2');
      expect(quest?.route).toBe('/terminal/n4');
    });

    it('returns null when onboarding is done and no active chapter', () => {
      const quest = getPendingQuest('done', false, null);
      expect(quest).toBeNull();
    });

    it('returns null at splash step', () => {
      const quest = getPendingQuest('splash', false, null);
      expect(quest).toBeNull();
    });
  });
});

