'use client';

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { terminalReducer, initialTerminalState } from './terminalReducer';
import { terminalService } from './terminalService';
import { bestGuess, provenDeadDigits, validateGuess } from '@neon-cipher/game-rules';

export function useTerminalSession(nodeId: string) {
  const [state, dispatch] = useReducer(terminalReducer, initialTerminalState);

  // Initialize session on nodeId mount
  useEffect(() => {
    let mounted = true;
    terminalService
      .startSession(nodeId)
      .then((data) => {
        if (!mounted) return;
        dispatch({
          type: 'INIT_SESSION',
          payload: {
            sessionId: data.sessionId,
            config: data.config,
            startedAt: data.startedAt,
          },
        });
      })
      .catch((err) => {
        if (!mounted) return;
        dispatch({
          type: 'SUBMIT_FAIL',
          error: err.message || 'Failed to start session',
        });
      });

    return () => {
      mounted = false;
    };
  }, [nodeId]);

  // Client-side timer tick from single server startedAt (no server polling)
  useEffect(() => {
    if (state.status !== 'playing' || !state.config || state.config.timerSeconds === 0) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER', now: Date.now() });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status, state.config, state.startedAt]);

  const best = useMemo(() => bestGuess(state.history), [state.history]);
  const deadDigits = useMemo(() => provenDeadDigits(state.history), [state.history]);

  const inputDigit = useCallback((digit: number) => {
    dispatch({ type: 'INPUT_DIGIT', digit });
  }, []);

  const backspace = useCallback(() => {
    dispatch({ type: 'BACKSPACE' });
  }, []);

  const clearEntry = useCallback(() => {
    dispatch({ type: 'CLEAR_ENTRY' });
  }, []);

  const submit = useCallback(async () => {
    if (!state.config || !state.sessionId || state.status !== 'playing') return;

    if (state.entry.length !== state.config.digits) {
      dispatch({
        type: 'SET_VALIDATION_ERROR',
        error: `Needs ${state.config.digits} digits`,
        shake: true,
      });
      return;
    }

    const guessStr = state.entry.join('');
    const isValid = validateGuess(
      guessStr,
      state.config.digits,
      state.config.allowDuplicates
    );

    if (!isValid) {
      const errorMsg = !state.config.allowDuplicates
        ? 'No repeats on this tier'
        : `Needs ${state.config.digits} digits`;
      dispatch({
        type: 'SET_VALIDATION_ERROR',
        error: errorMsg,
        shake: true,
      });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });
    try {
      const res = await terminalService.submitGuess(state.sessionId, guessStr);
      dispatch({
        type: 'SUBMIT_SUCCESS',
        payload: {
          pots: res.pots ?? 0,
          pans: res.pans ?? 0,
          attemptsLeft: res.attemptsLeft ?? 0,
          status: res.status,
          secret: res.secret,
          payout: res.payout,
          fine: res.fine,
        },
      });
    } catch (err: any) {
      dispatch({
        type: 'SUBMIT_FAIL',
        error: err.message || 'Error submitting guess',
      });
    }
  }, [state.config, state.sessionId, state.status, state.entry]);

  return {
    state,
    config: state.config,
    history: state.history,
    entry: state.entry,
    attemptsLeft: state.attemptsLeft,
    status: state.status,
    startedAt: state.startedAt,
    elapsedSeconds: state.elapsedSeconds,
    secret: state.secret,
    payout: state.payout,
    fine: state.fine,
    validationError: state.validationError,
    shakeKey: state.shakeKey,
    loading: state.loading,
    error: state.error,
    best,
    deadDigits,
    inputDigit,
    backspace,
    clearEntry,
    submit,
  };
}
