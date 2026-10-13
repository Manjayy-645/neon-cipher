import { describe, it, expect } from 'vitest';
import {
  terminalReducer,
  initialTerminalState,
  TerminalState,
} from '../terminalReducer';

describe('terminalReducer', () => {
  const dummyConfig = {
    digits: 4,
    allowDuplicates: false,
    attempts: 7,
    timerSeconds: 60,
    tier: 2,
    ice: 'None' as const,
  };

  it('initializes session cleanly', () => {
    const state = terminalReducer(initialTerminalState, {
      type: 'INIT_SESSION',
      payload: {
        sessionId: 'sess-1',
        config: dummyConfig,
        startedAt: 1000,
      },
    });

    expect(state.sessionId).toBe('sess-1');
    expect(state.status).toBe('playing');
    expect(state.attemptsLeft).toBe(7);
    expect(state.history).toEqual([]);
    expect(state.entry).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('inputs digits and prevents repeats when allowDuplicates is false', () => {
    let state: TerminalState = {
      ...initialTerminalState,
      status: 'playing',
      config: dummyConfig,
      entry: [1, 2],
    };

    // Valid digit
    state = terminalReducer(state, { type: 'INPUT_DIGIT', digit: 3 });
    expect(state.entry).toEqual([1, 2, 3]);
    expect(state.validationError).toBeNull();

    // Repeated digit triggers validation error & shake
    const prevShake = state.shakeKey;
    state = terminalReducer(state, { type: 'INPUT_DIGIT', digit: 2 });
    expect(state.entry).toEqual([1, 2, 3]);
    expect(state.validationError).toBe('No repeats on this tier');
    expect(state.shakeKey).toBe(prevShake + 1);
  });

  it('caps entry at config digits length', () => {
    let state: TerminalState = {
      ...initialTerminalState,
      status: 'playing',
      config: dummyConfig,
      entry: [1, 2, 3, 4],
    };

    const prevShake = state.shakeKey;
    state = terminalReducer(state, { type: 'INPUT_DIGIT', digit: 5 });
    expect(state.entry).toEqual([1, 2, 3, 4]);
    expect(state.validationError).toBe('Max 4 digits');
    expect(state.shakeKey).toBe(prevShake + 1);
  });

  it('handles backspace and clear', () => {
    let state: TerminalState = {
      ...initialTerminalState,
      status: 'playing',
      config: dummyConfig,
      entry: [1, 2, 3],
    };

    state = terminalReducer(state, { type: 'BACKSPACE' });
    expect(state.entry).toEqual([1, 2]);

    state = terminalReducer(state, { type: 'CLEAR_ENTRY' });
    expect(state.entry).toEqual([]);
  });

  it('records guess on SUBMIT_SUCCESS and updates history, attempts, and status', () => {
    let state: TerminalState = {
      ...initialTerminalState,
      status: 'playing',
      config: dummyConfig,
      attemptsLeft: 7,
      entry: [1, 2, 3, 4],
    };

    state = terminalReducer(state, {
      type: 'SUBMIT_SUCCESS',
      payload: {
        pots: 2,
        pans: 1,
        attemptsLeft: 6,
        status: 'playing',
      },
    });

    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toEqual({ guess: [1, 2, 3, 4], pots: 2, pans: 1 });
    expect(state.attemptsLeft).toBe(6);
    expect(state.entry).toEqual([]);
    expect(state.status).toBe('playing');
  });

  it('sets status to won on winning guess', () => {
    let state: TerminalState = {
      ...initialTerminalState,
      status: 'playing',
      config: dummyConfig,
      attemptsLeft: 6,
      entry: [1, 2, 3, 4],
    };

    state = terminalReducer(state, {
      type: 'SUBMIT_SUCCESS',
      payload: {
        pots: 4,
        pans: 0,
        attemptsLeft: 5,
        status: 'won',
        secret: '1234',
        payout: 650,
      },
    });

    expect(state.status).toBe('won');
    expect(state.secret).toBe('1234');
    expect(state.payout).toBe(650);
  });

  it('expires session when timer passes limit', () => {
    let state: TerminalState = {
      ...initialTerminalState,
      status: 'playing',
      config: dummyConfig, // timerSeconds: 60
      startedAt: 10000,
    };

    state = terminalReducer(state, {
      type: 'TICK_TIMER',
      now: 10000 + 65 * 1000,
    });

    expect(state.status).toBe('lost');
    expect(state.attemptsLeft).toBe(0);
  });
});
