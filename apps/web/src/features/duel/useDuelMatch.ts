'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { duelFeed, FeedEvent, DuelStateUpdate, DuelConfig } from './duelFeed';
import {
  provenDeadDigits,
  GuessRecord,
  validateGuess,
} from '@neon-cipher/game-rules';

export function useDuelMatch(duelId: string, config?: DuelConfig) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [rivalAttemptsLeft, setRivalAttemptsLeft] = useState<number>(config?.attempts ?? 7);
  const [playerAttemptsLeft, setPlayerAttemptsLeft] = useState<number>(config?.attempts ?? 7);

  const [entry, setEntry] = useState<number[]>([]);
  const [unseenRivalCount, setUnseenRivalCount] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [activeFeedTab, setActiveFeedTab] = useState<'shared' | 'you' | 'rival'>('shared');

  // Subscribe to live duel events via polling
  useEffect(() => {
    if (!duelId) return;

    let previousRivalEventCount = 0;

    const unsubscribe = duelFeed.subscribe(duelId, (update: DuelStateUpdate) => {
      setEvents(update.events);
      setStatus(update.status);
      if (update.secret) setSecret(update.secret);
      if (update.rivalAttemptsLeft !== undefined) setRivalAttemptsLeft(update.rivalAttemptsLeft);
      if (update.playerAttemptsLeft !== undefined) setPlayerAttemptsLeft(update.playerAttemptsLeft);

      // Count new rival events if user is not currently viewing the rival feed
      const currentRivalEvents = update.events.filter((e) => e.who === 'rival').length;
      if (currentRivalEvents > previousRivalEventCount) {
        const added = currentRivalEvents - previousRivalEventCount;
        setUnseenRivalCount((prev) => prev + added);
      }
      previousRivalEventCount = currentRivalEvents;
    });

    return () => {
      unsubscribe();
    };
  }, [duelId]);

  // When switching to RIVAL or SHARED tab, clear unseen badge
  const selectTab = useCallback((tab: 'shared' | 'you' | 'rival') => {
    setActiveFeedTab(tab);
    if (tab === 'shared' || tab === 'rival') {
      setUnseenRivalCount(0);
    }
  }, []);

  // Filter histories
  const yourHistory = useMemo<GuessRecord[]>(() => {
    return events
      .filter((e) => e.who === 'you' && e.guess !== null && e.pots !== null && e.pans !== null)
      .map((e) => ({
        guess: e.guess!,
        pots: e.pots!,
        pans: e.pans!,
      }));
  }, [events]);

  const rivalHistory = useMemo<GuessRecord[]>(() => {
    return events
      .filter(
        (e) => e.who === 'rival' && !e.hidden && e.guess !== null && e.pots !== null && e.pans !== null
      )
      .map((e) => ({
        guess: e.guess!,
        pots: e.pots!,
        pans: e.pans!,
      }));
  }, [events]);

  // Keypad elimination derived from provenDeadDigits over BOTH visible histories
  const deadDigits = useMemo(() => {
    return provenDeadDigits([...yourHistory, ...rivalHistory]);
  }, [yourHistory, rivalHistory]);

  // Rival latest visible result
  const lastRivalVisibleGuess = useMemo(() => {
    const list = events.filter((e) => e.who === 'rival' && !e.hidden && e.pots !== null);
    if (list.length === 0) return null;
    return list[list.length - 1];
  }, [events]);

  const inputDigit = useCallback(
    (digit: number) => {
      if (status !== 'playing' || !config) return;

      if (entry.length >= config.length) {
        setValidationError(`Needs ${config.length} digits`);
        setShakeKey((k) => k + 1);
        return;
      }

      if (!config.allowDuplicates && entry.includes(digit)) {
        setValidationError('No repeats on this tier');
        setShakeKey((k) => k + 1);
        return;
      }

      setEntry((prev) => [...prev, digit]);
      setValidationError(null);
    },
    [status, config, entry]
  );

  const backspace = useCallback(() => {
    if (status !== 'playing') return;
    setEntry((prev) => prev.slice(0, -1));
    setValidationError(null);
  }, [status]);

  const clearEntry = useCallback(() => {
    if (status !== 'playing') return;
    setEntry([]);
    setValidationError(null);
  }, [status]);

  const submitGuess = useCallback(async () => {
    if (status !== 'playing' || !config || !duelId) return;

    if (entry.length !== config.length) {
      setValidationError(`Needs ${config.length} digits`);
      setShakeKey((k) => k + 1);
      return;
    }

    const guessStr = entry.join('');
    const isValid = validateGuess(guessStr, config.length, config.allowDuplicates);
    if (!isValid) {
      setValidationError(
        !config.allowDuplicates ? 'No repeats on this tier' : `Needs ${config.length} digits`
      );
      setShakeKey((k) => k + 1);
      return;
    }

    try {
      const res = await duelFeed.submitGuess(duelId, entry);
      setEntry([]);
      setValidationError(null);
      if (res.status !== 'playing') {
        setStatus(res.status);
        if (res.secret) setSecret(res.secret);
      }
    } catch (err: any) {
      setValidationError(err.message || 'Submission error');
      setShakeKey((k) => k + 1);
    }
  }, [status, config, duelId, entry]);

  return {
    events,
    yourHistory,
    rivalHistory,
    deadDigits,
    unseenRivalCount,
    status,
    secret,
    rivalAttemptsLeft,
    playerAttemptsLeft,
    lastRivalVisibleGuess,
    entry,
    validationError,
    shakeKey,
    activeFeedTab,
    selectTab,
    inputDigit,
    backspace,
    clearEntry,
    submitGuess,
  };
}
