'use client';

import React, { useState, useEffect, useRef } from 'react';
import { calculateScore, Score } from '@neon-cipher/game-rules/src/index';
import { Button } from '@/components/ui/Button';

interface GuessRecord {
  guess: string;
  pots: number;
  pans: number;
}

interface BetaStage {
  id: number;
  name: string;
  secret: string;
  digits: number;
  rewardType: 'extra_attempt' | 'remove_dead_digit';
  rewardDescription: string;
  completed: boolean;
}

export function CoopConsole() {
  // Shared Timer (180s countdown)
  const [secondsLeft, setSecondsLeft] = useState<number>(180);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Active Role View ('alpha' | 'beta' | 'split')
  const [activeRole, setActiveRole] = useState<'split' | 'alpha' | 'beta'>('split');
  const [heistStatus, setHeistStatus] = useState<'active' | 'won' | 'lost'>('active');
  const [partnerLog, setPartnerLog] = useState<string[]>([]);

  // Alpha (Infiltrator) State
  const [alphaSecret] = useState<string>('7294');
  const [alphaAttempts, setAlphaAttempts] = useState<number>(4);
  const [alphaHistory, setAlphaHistory] = useState<GuessRecord[]>([]);
  const [alphaGuess, setAlphaGuess] = useState<string>('');
  const [eliminatedDigits, setEliminatedDigits] = useState<string[]>([]);

  // Beta (Support) State
  const [betaStages, setBetaStages] = useState<BetaStage[]>([
    {
      id: 1,
      name: 'Subroutine 01: Firewall Bypass',
      secret: '381',
      digits: 3,
      rewardType: 'remove_dead_digit',
      rewardDescription: 'Eliminates 1 dead digit from Alpha keypad',
      completed: false,
    },
    {
      id: 2,
      name: 'Subroutine 02: Buffer Overflow',
      secret: '519',
      digits: 3,
      rewardType: 'extra_attempt',
      rewardDescription: 'Grants +1 guess attempt to Alpha',
      completed: false,
    },
    {
      id: 3,
      name: 'Subroutine 03: Shroud Override',
      secret: '842',
      digits: 3,
      rewardType: 'extra_attempt',
      rewardDescription: 'Grants +1 guess attempt to Alpha',
      completed: false,
    },
  ]);
  const [currentBetaStageIdx, setCurrentBetaStageIdx] = useState<number>(0);
  const [betaGuess, setBetaGuess] = useState<string>('');
  const [betaHistory, setBetaHistory] = useState<GuessRecord[]>([]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || heistStatus !== 'active') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          setHeistStatus('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, heistStatus]);

  // Format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock Partner automated action simulation (if idle)
  const partnerSimRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (heistStatus !== 'active') return;

    partnerSimRef.current = setTimeout(() => {
      if (currentBetaStageIdx === 0 && !betaStages[0].completed) {
        addPartnerMessage('Partner Glitch (Beta) scanning Subroutine 01 carrier waves...');
      }
    }, 10000);

    return () => {
      if (partnerSimRef.current) clearTimeout(partnerSimRef.current);
    };
  }, [currentBetaStageIdx, betaStages, heistStatus]);

  const addPartnerMessage = (msg: string) => {
    setPartnerLog((prev) => [msg, ...prev.slice(0, 8)]);
  };

  // Alpha Guess Submission
  const handleAlphaSubmit = () => {
    if (alphaGuess.length !== 4 || alphaAttempts <= 0 || heistStatus !== 'active') return;

    const score = calculateScore(alphaSecret, alphaGuess);
    const newRecord: GuessRecord = { guess: alphaGuess, pots: score.pots, pans: score.pans };
    setAlphaHistory((prev) => [newRecord, ...prev]);
    setAlphaGuess('');

    if (score.pots === 4) {
      setHeistStatus('won');
      setTimerActive(false);
      addPartnerMessage('VAULT CRACKED! Master signal unlocked by Alpha Infiltrator.');
      return;
    }

    const nextAttempts = alphaAttempts - 1;
    setAlphaAttempts(nextAttempts);
    if (nextAttempts <= 0) {
      setHeistStatus('lost');
      setTimerActive(false);
      addPartnerMessage('MISSION FAILED // Alpha exhausted all guess attempts.');
    }
  };

  // Beta Guess Submission
  const handleBetaSubmit = () => {
    const stage = betaStages[currentBetaStageIdx];
    if (!stage || stage.completed || betaGuess.length !== stage.digits || heistStatus !== 'active') return;

    const score = calculateScore(stage.secret, betaGuess);
    const newRecord: GuessRecord = { guess: betaGuess, pots: score.pots, pans: score.pans };
    setBetaHistory((prev) => [newRecord, ...prev]);
    setBetaGuess('');

    if (score.pots === stage.digits) {
      // Stage cracked! Apply reward to Alpha
      const updatedStages = [...betaStages];
      updatedStages[currentBetaStageIdx].completed = true;
      setBetaStages(updatedStages);

      if (stage.rewardType === 'extra_attempt') {
        setAlphaAttempts((prev) => prev + 1);
        addPartnerMessage(`[BETA SUPPORT] ${stage.name} CRACKED! +1 Attempt granted to Alpha.`);
      } else if (stage.rewardType === 'remove_dead_digit') {
        const deadCandidates = ['0', '1', '3', '5', '6', '8'].filter((d) => !eliminatedDigits.includes(d));
        const deadToRemove = deadCandidates[0] || '0';
        setEliminatedDigits((prev) => [...prev, deadToRemove]);
        addPartnerMessage(`[BETA SUPPORT] ${stage.name} CRACKED! Dead digit '${deadToRemove}' eliminated for Alpha.`);
      }

      if (currentBetaStageIdx < betaStages.length - 1) {
        setCurrentBetaStageIdx((prev) => prev + 1);
        setBetaHistory([]);
      } else {
        addPartnerMessage('[BETA SUPPORT] All security firewalls bypassed! Alpha has full signal support.');
      }
    }
  };

  // Quick bot solve for Beta (Simulate partner cracking)
  const handleSimulatePartnerSolve = () => {
    const stage = betaStages[currentBetaStageIdx];
    if (!stage || stage.completed) return;
    setBetaGuess(stage.secret);
    setTimeout(() => {
      handleBetaSubmit();
    }, 150);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-panel text-ink overflow-y-auto pb-[env(safe-area-inset-bottom)] select-none">
      {/* Top Console Header & Shared Timer (Requirement 2) */}
      <div className="bg-panel-light border-b border-line px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <span className="font-data text-[10px] uppercase tracking-[1.5px] text-ink-muted block">
            CO-OP HEIST CONSOLE // TWO-MAN RIG LINK
          </span>
          <h1 className="font-heading text-lg font-bold text-ink">
            Synchronized Heist
          </h1>
        </div>

        {/* SHARED COUNTDOWN TIMER */}
        <div
          data-testid="shared-countdown"
          className={`px-3 py-1.5 rounded-sm border font-data text-xs font-bold tracking-wider flex items-center gap-2 ${
            secondsLeft < 30
              ? 'bg-danger/20 border-danger text-danger-text animate-pulse'
              : 'bg-panel border-line text-ink'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span>CREW TIME: {formatTime(secondsLeft)}</span>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="bg-panel border-b border-line px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={activeRole === 'split' ? 'primary' : 'secondary'}
            compact
            onClick={() => setActiveRole('split')}
            data-testid="view-split-button"
          >
            Split Console
          </Button>
          <Button
            type="button"
            variant={activeRole === 'alpha' ? 'primary' : 'secondary'}
            compact
            onClick={() => setActiveRole('alpha')}
            data-testid="view-alpha-button"
          >
            Alpha (Infiltrator)
          </Button>
          <Button
            type="button"
            variant={activeRole === 'beta' ? 'primary' : 'secondary'}
            compact
            onClick={() => setActiveRole('beta')}
            data-testid="view-beta-button"
          >
            Beta (Support)
          </Button>
        </div>

        {/* Partner Action Simulator */}
        <Button
          type="button"
          variant="secondary"
          compact
          onClick={handleSimulatePartnerSolve}
          disabled={heistStatus !== 'active'}
          data-testid="partner-solve-button"
          className="text-accent-text"
        >
          ⚡ Partner Bot Solve Stage
        </Button>
      </div>

      {/* Heist Outcome Banner */}
      {heistStatus === 'won' && (
        <div
          data-testid="heist-won-banner"
          className="bg-accent text-white p-3 font-data text-xs font-bold uppercase text-center shrink-0 tracking-wider"
        >
          🎉 VAULT BREACH SUCCESSFUL // All syndicate dividends secured!
        </div>
      )}
      {heistStatus === 'lost' && (
        <div
          data-testid="heist-lost-banner"
          className="bg-danger text-white p-3 font-data text-xs font-bold uppercase text-center shrink-0 tracking-wider"
        >
          ⚠️ HEIST TRACED // Connection terminated by counter-ICE.
        </div>
      )}

      {/* Console Feeds Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-w-4xl mx-auto w-full">
        {/* ============================================================ */}
        {/* ROLE ALPHA (INFILTRATOR) VIEW */}
        {/* ============================================================ */}
        {(activeRole === 'split' || activeRole === 'alpha') && (
          <div
            data-testid="role-alpha-container"
            className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3"
          >
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <span className="font-data text-[10px] uppercase tracking-wider text-accent-text font-bold block">
                  ROLE ALPHA // INFILTRATOR
                </span>
                <h2 className="font-heading text-base font-bold text-ink">
                  Central Vault Master Code
                </h2>
              </div>
              <span
                data-testid="alpha-attempts-left"
                className="font-data text-xs font-bold bg-accent/15 text-accent-text border border-accent/40 px-2.5 py-1 rounded-pill"
              >
                {alphaAttempts} ATTEMPTS LEFT
              </span>
            </div>

            {/* Eliminated Dead Digits from Beta Support */}
            {eliminatedDigits.length > 0 && (
              <div
                data-testid="eliminated-digits-banner"
                className="bg-accent/10 border border-accent/30 text-accent-text p-2 rounded-sm font-data text-[11px] flex items-center justify-between"
              >
                <span>SUPPORT BUFF: Dead Digits Purged</span>
                <span className="font-bold">[{eliminatedDigits.join(', ')}]</span>
              </div>
            )}

            {/* Alpha Code Input */}
            <div className="flex flex-col gap-2 bg-panel p-3 rounded-sm border border-line">
              <span className="font-data text-xs text-ink-muted">ENTER 4-DIGIT CODE:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={alphaGuess}
                  onChange={(e) => setAlphaGuess(e.target.value.replace(/\D/g, ''))}
                  placeholder="----"
                  disabled={heistStatus !== 'active'}
                  data-testid="alpha-guess-input"
                  className="flex-1 min-h-[44px] px-3 bg-panel-light border border-line text-center font-data text-xl font-bold tracking-[6px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  aria-label="Alpha guess code"
                />
                <Button
                  type="button"
                  variant="primary"
                  compact
                  onClick={handleAlphaSubmit}
                  disabled={alphaGuess.length !== 4 || heistStatus !== 'active'}
                  data-testid="alpha-submit-button"
                >
                  INJECT
                </Button>
              </div>

              {/* Keypad Digits */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {'0123456789'.split('').map((d) => {
                  const isDead = eliminatedDigits.includes(d);
                  return (
                    <Button
                      key={d}
                      type="button"
                      variant="secondary"
                      compact
                      disabled={isDead || alphaGuess.length >= 4 || heistStatus !== 'active'}
                      onClick={() => setAlphaGuess((prev) => prev + d)}
                      className={`min-h-[40px] p-0 text-xs font-bold ${
                        isDead ? 'line-through opacity-40' : ''
                      }`}
                    >
                      {d}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Alpha Guess History */}
            <div className="flex-1 flex flex-col gap-1 min-h-[120px] max-h-[200px] overflow-y-auto">
              <span className="font-data text-[10px] uppercase text-ink-muted">INFILTRATOR PROBE LOG:</span>
              {alphaHistory.length === 0 ? (
                <span className="font-data text-xs text-ink-muted italic">Awaiting initial guess...</span>
              ) : (
                alphaHistory.map((rec, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center font-data text-xs p-1.5 bg-panel border border-line rounded-sm"
                  >
                    <span className="font-bold tracking-wider">{rec.guess}</span>
                    <div className="flex gap-2">
                      <span className="text-accent-text font-bold">● {rec.pots} POT</span>
                      <span className="text-money-text font-bold">○ {rec.pans} PAN</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROLE BETA (SUPPORT) VIEW */}
        {/* ============================================================ */}
        {(activeRole === 'split' || activeRole === 'beta') && (
          <div
            data-testid="role-beta-container"
            className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3"
          >
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <span className="font-data text-[10px] uppercase tracking-wider text-money-text font-bold block">
                  ROLE BETA // SUPPORT HACKER
                </span>
                <h2 className="font-heading text-base font-bold text-ink">
                  Auxiliary Subroutines
                </h2>
              </div>
              <span className="font-data text-xs font-bold text-ink-muted">
                STAGE {currentBetaStageIdx + 1} / {betaStages.length}
              </span>
            </div>

            {/* Current Beta Stage Info */}
            <div className="bg-panel p-3 rounded-sm border border-line flex flex-col gap-1">
              <span className="font-heading text-sm font-bold text-ink">
                {betaStages[currentBetaStageIdx]?.name}
              </span>
              <span className="font-data text-xs text-accent-text font-semibold">
                REWARD: {betaStages[currentBetaStageIdx]?.rewardDescription}
              </span>
            </div>

            {/* Beta Code Input */}
            <div className="flex flex-col gap-2 bg-panel p-3 rounded-sm border border-line">
              <span className="font-data text-xs text-ink-muted">
                SOLVE 3-DIGIT AUXILIARY CODE:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={betaGuess}
                  onChange={(e) => setBetaGuess(e.target.value.replace(/\D/g, ''))}
                  placeholder="---"
                  disabled={heistStatus !== 'active' || betaStages[currentBetaStageIdx]?.completed}
                  data-testid="beta-guess-input"
                  className="flex-1 min-h-[44px] px-3 bg-panel-light border border-line text-center font-data text-xl font-bold tracking-[6px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  aria-label="Beta guess code"
                />
                <Button
                  type="button"
                  variant="primary"
                  compact
                  onClick={handleBetaSubmit}
                  disabled={betaGuess.length !== 3 || heistStatus !== 'active'}
                  data-testid="beta-submit-button"
                >
                  BYPASS
                </Button>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {'0123456789'.split('').map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="secondary"
                    compact
                    disabled={betaGuess.length >= 3 || heistStatus !== 'active'}
                    onClick={() => setBetaGuess((prev) => prev + d)}
                    className="min-h-[40px] p-0 text-xs font-bold"
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>

            {/* Beta Log */}
            <div className="flex-1 flex flex-col gap-1 min-h-[120px] max-h-[200px] overflow-y-auto">
              <span className="font-data text-[10px] uppercase text-ink-muted">SUBROUTINE BYPASS LOG:</span>
              {betaHistory.length === 0 ? (
                <span className="font-data text-xs text-ink-muted italic">Crack this stage to empower Alpha...</span>
              ) : (
                betaHistory.map((rec, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center font-data text-xs p-1.5 bg-panel border border-line rounded-sm"
                  >
                    <span className="font-bold tracking-wider">{rec.guess}</span>
                    <div className="flex gap-2">
                      <span className="text-accent-text font-bold">● {rec.pots} POT</span>
                      <span className="text-money-text font-bold">○ {rec.pans} PAN</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Crew Comms Feed Log */}
      <div className="px-4 pb-4 max-w-4xl mx-auto w-full">
        <div
          data-testid="coop-comms-feed"
          className="bg-panel-light p-3 rounded-md border border-line shadow-card flex flex-col gap-1.5"
        >
          <span className="font-data text-[10px] uppercase tracking-wider text-ink-muted font-bold">
            CREW COMMS // LIVE DATA LINK
          </span>
          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto text-xs font-data">
            {partnerLog.length === 0 ? (
              <span className="text-ink-muted italic">Secure audio channel linked. Glitch standing by on Support.</span>
            ) : (
              partnerLog.map((log, i) => (
                <div key={i} className="text-ink flex items-center gap-2">
                  <span className="text-accent font-bold">›</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
