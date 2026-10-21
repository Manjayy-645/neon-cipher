'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getNodes, GameNode } from '../map/nodeService';
import {
  possibleCodes,
  isCommonWeakCode,
  estimateCodeDifficulty,
  calculateNodeDecay,
  calculateNodeIncome,
  IceType,
  CodeDifficultyEstimate,
  NodeDecayStatus,
  NodeIncomeStatus,
} from '@neon-cipher/game-rules/src/index';
import { defenseService, NodeDefenseData } from './defenseService';
import { usePlayerStore } from '../../stores/player-store';
import { Button } from '@/components/ui/Button';

const AVAILABLE_ICE: Array<{
  type: IceType;
  name: string;
  cost: number;
  description: string;
}> = [
  { type: 'Ghost', name: 'Ghost Protocol', cost: 150, description: 'Obscures digit positions on partial matches' },
  { type: 'Liar', name: 'Liar Algorithm', cost: 200, description: 'Injects one falsified pot/pan feedback signal' },
  { type: 'Drift', name: 'Drift Carrier', cost: 180, description: 'Periodically shifts feedback polarity' },
  { type: 'Sticky', name: 'Sticky Trap', cost: 120, description: 'Burns extra attacker clock on failed guesses' },
  { type: 'Pot-only', name: 'Null-Pan Shroud', cost: 250, description: 'Completely suppresses pan feedback' },
];

export function Codemaker() {
  const router = useRouter();
  const syncWallet = usePlayerStore((s) => s.syncWallet);

  const [allNodes] = useState<GameNode[]>(() => getNodes());
  const [selectedNodeId, setSelectedNodeId] = useState<string>('n2'); // Alley Relay default owned
  const [activeAccount, setActiveAccount] = useState<string>('ZERO_COOL');
  const [defenseData, setDefenseData] = useState<NodeDefenseData | null>(null);

  // Form state
  const [codeDigits, setCodeDigits] = useState<string[]>(['4', '9', '2', '1']);
  const [selectedIce, setSelectedIce] = useState<IceType>('Ghost');
  const [selectedIceModifiers, setSelectedIceModifiers] = useState<IceType[]>(['Ghost']);
  const [dailyBudget, setDailyBudget] = useState<number>(250);

  // Status & feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync selected node from search param if provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const paramNodeId = new URLSearchParams(window.location.search).get('nodeId');
      if (paramNodeId && allNodes.some((n) => n.id === paramNodeId)) {
        setSelectedNodeId(paramNodeId);
      }
    }
  }, [allNodes]);

  // Current node
  const currentNode = useMemo(() => {
    return allNodes.find((n) => n.id === selectedNodeId) || allNodes[0];
  }, [allNodes, selectedNodeId]);

  // Load defense for selected node
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    defenseService
      .getDefense(selectedNodeId)
      .then((res) => {
        if (!mounted) return;
        if (res.defense) {
          setDefenseData(res.defense);
          const digits = res.defense.code.split('');
          if (digits.length === (currentNode?.digits || 4)) {
            setCodeDigits(digits);
          } else {
            setCodeDigits(new Array(currentNode?.digits || 4).fill('1'));
          }
          setSelectedIce(res.defense.ice || 'None');
          setSelectedIceModifiers(res.defense.iceModifiers || (res.defense.ice ? [res.defense.ice] : []));
          setDailyBudget(res.defense.dailyBudget || 200);
          setActiveAccount(res.defense.ownerHandle || 'ZERO_COOL');
        }
      })
      .catch(() => {
        // Fallback for nodes without existing defense
        if (!mounted) return;
        setCodeDigits(new Array(currentNode?.digits || 4).fill('1'));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedNodeId, currentNode?.digits]);

  const currentCode = codeDigits.join('');

  // Live difficulty estimate using game-rules
  const difficultyEstimate: CodeDifficultyEstimate = useMemo(() => {
    if (!currentNode) {
      return {
        score: 50,
        rating: 'MODERATE',
        poolSize: 5040,
        estimatedGuesses: 4,
        iceDefenseBonus: 0,
      };
    }
    return estimateCodeDifficulty(currentCode, currentNode.allowDuplicates, selectedIceModifiers);
  }, [currentCode, currentNode, selectedIceModifiers]);

  // Live weak code warning
  const weakWarning = useMemo(() => {
    return isCommonWeakCode(currentCode);
  }, [currentCode]);

  // Live decay calculation
  const decayStatus: NodeDecayStatus = useMemo(() => {
    const lastMaintained = defenseData?.lastMaintainedAt || Date.now() - 3600000 * 4;
    return calculateNodeDecay(lastMaintained, Date.now(), dailyBudget);
  }, [defenseData, dailyBudget]);

  // Live income calculation
  const incomeStatus: NodeIncomeStatus = useMemo(() => {
    const lastCollected = defenseData?.lastCollectedAt || Date.now() - 3600000 * 6;
    const hourlyYield = currentNode ? Math.floor(currentNode.bounty / 2) : 75;
    return calculateNodeIncome(hourlyYield, lastCollected, Date.now(), 1000);
  }, [defenseData, currentNode]);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...codeDigits];
    next[index] = val || '0';
    setCodeDigits(next);
  };

  const handleToggleIce = (ice: IceType) => {
    if (selectedIceModifiers.includes(ice)) {
      const next = selectedIceModifiers.filter((i) => i !== ice);
      setSelectedIceModifiers(next);
      setSelectedIce(next[0] || 'None');
    } else {
      const next = [...selectedIceModifiers, ice];
      setSelectedIceModifiers(next);
      setSelectedIce(ice);
    }
  };

  const handleSaveDefense = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await defenseService.saveDefense(selectedNodeId, {
        code: currentCode,
        ice: selectedIce,
        iceModifiers: selectedIceModifiers,
        dailyBudget,
      });

      if (res.success && res.defense) {
        setDefenseData(res.defense);
        setStatusMessage('DEFENSE DEPLOYED // Node defenses fortified successfully.');
      }
    } catch (e: any) {
      setStatusMessage(`FAILED: ${e.message || 'Could not save defense.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClaimYield = async () => {
    try {
      const res = await defenseService.claimYield(selectedNodeId);
      if (res.success) {
        setStatusMessage(`YIELD COLLECTED: +${res.amount} Credits added to syndicate wallet.`);
        // Reload defense to reset lastCollectedAt
        const updated = await defenseService.getDefense(selectedNodeId);
        if (updated.defense) setDefenseData(updated.defense);
      }
    } catch (e: any) {
      setStatusMessage(`CLAIM ERROR: ${e.message}`);
    }
  };

  const handleSwitchAccount = async (targetHandle: string) => {
    try {
      await defenseService.switchAccount(targetHandle);
      setActiveAccount(targetHandle);
      setStatusMessage(`ACTIVE DECKER SWITCHED // Logged in as ${targetHandle}.`);
      // Re-fetch defense
      const res = await defenseService.getDefense(selectedNodeId);
      if (res.defense) setDefenseData(res.defense);
    } catch (e: any) {
      setStatusMessage(`SWITCH ERROR: ${e.message}`);
    }
  };

  return (
    <div className="scene-ground w-full flex-1 min-h-0 flex flex-col text-ink overflow-y-auto pb-24 pb-safe-bottom select-none">
      {/* Account & Mode Header Bar */}
      <div className="bg-panel-light border-b border-line px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <span className="font-data text-[10px] uppercase tracking-[1.5px] text-ink-muted block">
            CODEMAKER NODE DEFENSE
          </span>
          <h1 className="font-heading text-lg font-bold text-ink">
            Fortify Owned Node
          </h1>
        </div>

        {/* Navigation & Account Switcher */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            compact
            arrow
            onClick={() => router.push('/duel')}
            aria-label="Return to Turf War"
          >
            TURF WAR
          </Button>
          <span className="font-data text-xs text-ink-muted hidden sm:inline">
            DECKER: <strong className="text-ink">{activeAccount}</strong>
          </span>
          <Button
            type="button"
            variant="secondary"
            compact
            onClick={() => handleSwitchAccount(activeAccount === 'ZERO_COOL' ? 'PHREAK' : 'ZERO_COOL')}
            data-testid="account-switch-button"
          >
            Switch to {activeAccount === 'ZERO_COOL' ? 'PHREAK' : 'ZERO_COOL'}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          data-testid="defense-status-banner"
          className="bg-accent/15 border-b border-accent/30 text-accent-text font-data text-xs px-4 py-2 flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <Button
            type="button"
            variant="icon"
            compact
            onClick={() => setStatusMessage(null)}
            className="text-accent ml-4 p-1"
            aria-label="Dismiss status message"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}

      <div className="p-4 flex flex-col gap-4 max-w-xl mx-auto w-full">
        {/* Node Selector Row */}
        <div className="bg-panel-light p-3 rounded-md border border-line shadow-card flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-data text-[10px] uppercase tracking-wider text-ink-muted">
              TARGET NODE
            </span>
            <span className="font-heading text-base font-bold text-ink">
              {currentNode.name}
            </span>
            <span className="font-data text-xs text-ink-muted">
              Tier {currentNode.tier} • {currentNode.digits} Digits • {currentNode.allowDuplicates ? 'Repeats Allowed' : 'Unique Digits'}
            </span>
          </div>

          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            data-testid="node-select-dropdown"
            className="min-h-[44px] px-3 py-2 bg-panel border border-line rounded-sm font-data text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Select node to defend"
          >
            {allNodes
              .filter((n) => n.status === 'owned' || n.id === 'n2' || n.id === 'n11')
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} (T{n.tier})
                </option>
              ))}
          </select>
        </div>

        {/* Master Secret Code Input */}
        <div className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-ink">
                Master Secret Code
              </h2>
              <p className="font-data text-xs text-ink-muted">
                Set the digits an intruder must guess to crack your node.
              </p>
            </div>
            <span className="font-data text-xs font-bold text-ink-muted">
              {possibleCodes(currentNode.digits, currentNode.allowDuplicates).toLocaleString()} COMBINATIONS
            </span>
          </div>

          {/* Digit Inputs */}
          <div className="flex gap-3 justify-center py-2" data-testid="code-inputs-container">
            {codeDigits.map((digit, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <input
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  data-testid={`code-digit-input-${idx}`}
                  className="w-12 h-14 bg-panel border-b-4 border-accent text-center font-data text-2xl font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-t-sm"
                  aria-label={`Digit ${idx + 1}`}
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    compact
                    onClick={() => handleDigitChange(idx, String((parseInt(digit || '0', 10) + 1) % 10))}
                    className="w-5 h-6 min-h-[44px] min-w-[24px] p-0 text-[12px]"
                    aria-label={`Increment digit ${idx + 1}`}
                  >
                    +
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    compact
                    onClick={() => handleDigitChange(idx, String((parseInt(digit || '0', 10) - 1 + 10) % 10))}
                    className="w-5 h-6 min-h-[44px] min-w-[24px] p-0 text-[12px]"
                    aria-label={`Decrement digit ${idx + 1}`}
                  >
                    -
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Live Weak Code Warning */}
          {weakWarning.isWeak && (
            <div
              data-testid="weak-code-warning"
              className="bg-danger/10 border border-danger/30 text-danger-text p-2.5 rounded-sm font-data text-xs flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-danger" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <strong className="block font-bold">WEAK CODE WARNING</strong>
                <span>{weakWarning.warning}</span>
              </div>
            </div>
          )}

          {/* Live Difficulty Meter */}
          <div
            data-testid="difficulty-meter"
            className="p-3 bg-panel rounded-sm border border-line flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-data text-xs text-ink-muted uppercase">
                ESTIMATED DIFFICULTY:
              </span>
              <span
                data-testid="difficulty-rating-badge"
                className={`font-data text-xs font-bold uppercase px-2 py-0.5 rounded-sm ${
                  difficultyEstimate.rating === 'FORTIFIED'
                    ? 'bg-accent text-white'
                    : difficultyEstimate.rating === 'STRONG'
                    ? 'bg-accent/80 text-white'
                    : difficultyEstimate.rating === 'MODERATE'
                    ? 'bg-money/20 text-money-text'
                    : 'bg-danger/20 text-danger-text'
                }`}
              >
                {difficultyEstimate.rating} ({difficultyEstimate.score}/100)
              </span>
            </div>

            <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  difficultyEstimate.score >= 65 ? 'bg-accent' : difficultyEstimate.score >= 40 ? 'bg-money' : 'bg-danger'
                }`}
                style={{ width: `${difficultyEstimate.score}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-data text-ink-muted">
              <span>Estimated intruder tries: ~{difficultyEstimate.estimatedGuesses}</span>
              <span>Pool: {difficultyEstimate.poolSize.toLocaleString()} codes</span>
            </div>
          </div>
        </div>

        {/* ICE Countermeasures */}
        <div className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-ink">
              Deploy ICE Countermeasures
            </h2>
            <span className="font-data text-xs text-ink-muted">
              {selectedIceModifiers.length} ACTIVE
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {AVAILABLE_ICE.map((ice) => {
              const isSelected = selectedIceModifiers.includes(ice.type);
              return (
                <Button
                  key={ice.type}
                  type="button"
                  variant={isSelected ? 'secondary' : 'ghost'}
                  onClick={() => handleToggleIce(ice.type)}
                  data-testid={`ice-toggle-${ice.type.toLowerCase()}`}
                  className={`w-full p-3 text-left flex items-center justify-between normal-case tracking-normal ${
                    isSelected
                      ? 'border-accent ring-1 ring-accent text-ink font-semibold'
                      : 'text-ink-muted'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex flex-col">
                    <span className="font-data text-xs font-bold text-ink">
                      {isSelected ? '[✓] ' : '[ ] '} {ice.name}
                    </span>
                    <span className="font-data text-[11px] text-ink-muted font-normal">
                      {ice.description}
                    </span>
                  </div>
                  <span className="font-data text-xs font-bold text-money-text shrink-0 ml-2">
                    -{ice.cost} cr/day
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Defense Budget & Decay Rate (Requirement 4) */}
        <div className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-ink">
              Defense Budget & Decay
            </h2>
            <span className="font-data text-xs text-money-text font-bold">
              {dailyBudget} Credits / Day
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={50}
              max={1000}
              step={50}
              value={dailyBudget}
              onChange={(e) => setDailyBudget(parseInt(e.target.value, 10))}
              data-testid="defense-budget-slider"
              className="w-full accent-accent cursor-pointer"
              aria-label="Daily defense maintenance budget"
            />
            <div className="flex justify-between text-[11px] font-data text-ink-muted">
              <span>50 cr/day (Rapid decay)</span>
              <span>500+ cr/day (Fortified maintenance)</span>
            </div>
          </div>

          {/* Decay Integrity Status */}
          <div
            data-testid="decay-status-container"
            className="p-3 bg-panel rounded-sm border border-line flex items-center justify-between"
          >
            <div>
              <span className="font-data text-xs font-bold text-ink block">
                INTEGRITY: {decayStatus.integrityPercent}%
              </span>
              <span className="font-data text-[11px] text-ink-muted">
                Decay rate: -{decayStatus.decayRatePerHour}% / hr ({decayStatus.hoursElapsed}h elapsed)
              </span>
            </div>
            {decayStatus.isVulnerable ? (
              <span className="bg-danger text-white font-data text-[10px] font-bold uppercase px-2 py-1 rounded-sm">
                VULNERABLE
              </span>
            ) : (
              <span className="bg-accent text-white font-data text-[10px] font-bold uppercase px-2 py-1 rounded-sm">
                SHIELDED
              </span>
            )}
          </div>
        </div>

        {/* Income Cap & Fines Earned (Requirement 3 & 4) */}
        <div className="bg-panel-light p-4 rounded-md border border-line shadow-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-ink">
              Node Revenue & Fines
            </h2>
            <span className="font-data text-xs font-bold text-accent-text">
              +{incomeStatus.hourlyYield} cr / hr
            </span>
          </div>

          {/* Income Cap Meter */}
          <div
            data-testid="income-cap-container"
            className="p-3 bg-panel rounded-sm border border-line flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-data text-xs text-ink-muted uppercase">
                UNCOLLECTED YIELD:
              </span>
              <span className="font-data text-xs font-bold text-money-text">
                {incomeStatus.accumulatedYield} / {incomeStatus.incomeCap} Credits
              </span>
            </div>

            <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${incomeStatus.isCapped ? 'bg-danger' : 'bg-money'}`}
                style={{ width: `${incomeStatus.percentFilled}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-data text-[11px] text-ink-muted">
                {incomeStatus.isCapped ? 'CAP REACHED // Collect now to resume yield' : `${incomeStatus.percentFilled}% of maximum cap`}
              </span>
              <Button
                type="button"
                variant="compact"
                onClick={handleClaimYield}
                disabled={incomeStatus.accumulatedYield <= 0}
                data-testid="claim-yield-button"
              >
                CLAIM YIELD
              </Button>
            </div>
          </div>

          {/* Fines Earned Display */}
          <div
            data-testid="fines-earned-container"
            className="p-3 bg-panel rounded-sm border border-line flex items-center justify-between"
          >
            <div>
              <span className="font-data text-xs font-bold text-ink block">
                FINES REPELLED FROM RIVALS:
              </span>
              <span className="font-data text-[11px] text-ink-muted">
                Collected from failed breach attempts on this node
              </span>
            </div>
            <span
              data-testid="fines-earned-value"
              className="font-data text-sm font-bold text-money-text"
            >
              +{defenseData?.finesEarned ?? 0} Credits
            </span>
          </div>
        </div>

        {/* Deploy & Test Attack Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleSaveDefense}
            disabled={isSaving || weakWarning.isWeak}
            loading={isSaving}
            data-testid="deploy-defense-button"
          >
            DEPLOY DEFENSE MATRIX
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            arrow
            onClick={() => router.push(`/terminal/${selectedNodeId}`)}
            data-testid="test-attack-button"
          >
            JACK IN // TEST ATTACK THIS NODE
          </Button>
        </div>
      </div>
    </div>
  );
}
