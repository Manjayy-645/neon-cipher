'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface BreachReceipt {
  bonusCredits: number;
  campaignLedgerCredit?: number;
  debtReduced?: number;
  remainingDebt?: number;
  confirmedBalance?: number;
}

interface BreachBannerProps {
  status: 'won' | 'lost';
  secret?: string;
  payout?: number;
  fine?: number;
  receipt?: BreachReceipt;
  attemptsUsed?: number;
  maxAttempts?: number | null;
  failureReason?: 'TRACE TIMEOUT' | 'ATTEMPTS EXHAUSTED' | string;
  onReturnToMap: () => void;
  isRecoveryRun?: boolean;
  onStartRecovery?: () => void;
  recoveryActionLabel?: string;
  returnActionLabel?: string;
}

export function BreachBanner({
  status,
  secret,
  payout,
  fine,
  receipt,
  attemptsUsed,
  maxAttempts,
  failureReason,
  onReturnToMap,
  isRecoveryRun = false,
  onStartRecovery,
  recoveryActionLabel = "START NIX'S RECOVERY RUN",
  returnActionLabel = 'RETURN TO MAP',
}: BreachBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  const isWon = status === 'won';

  return (
    <div
      role="alert"
      data-testid="breach-banner"
      data-surface="terminal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
    >
      <motion.div
        data-tour="breach-banner"
        initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          borderColor: isWon ? 'var(--terminal-phosphor)' : 'var(--terminal-danger)',
        }}
        className={`terminal-result-card w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 rounded-[12px] border shadow-sheet flex flex-col items-center text-center gap-4 ${
          isWon ? 'shadow-[0_0_24px_rgba(111,191,122,0.2)]' : 'shadow-[0_0_24px_rgba(208,118,90,0.2)]'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full border flex items-center justify-center ${
            isWon
              ? 'border-terminal-phosphor text-terminal-phosphor bg-terminal-phosphor/10'
              : 'border-terminal-danger text-terminal-danger bg-terminal-danger/10'
          }`}
        >
          {isWon ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        <div>
          <h2
            className={`font-heading text-2xl font-bold tracking-wider ${
              isWon ? 'terminal-result-success' : 'terminal-result-danger'
            }`}
          >
            {isRecoveryRun && isWon
              ? 'PRACTICE COMPLETE'
              : isWon
                ? 'BREACHED'
                : 'CONNECTION SEVERED'}
          </h2>
          <p className="font-data text-xs terminal-result-muted mt-1">
            {isRecoveryRun && isWon
              ? 'Your assignment is waiting. Head back when you are ready.'
              : isWon
                ? 'Node defense bypassed. Cipher cracked successfully.'
                : failureReason === 'TRACE TIMEOUT'
                  ? 'ICE trace timer expired before cipher breach.'
                  : 'Maximum trace threshold reached. Trace lock engaged.'}
          </p>
        </div>

        {/* Failure reason and attempts used breakdown */}
        {!isWon && (
          <div className="w-full flex flex-col gap-2 font-data text-xs">
            {failureReason && (
              <div
                data-testid="failure-reason"
                className="terminal-result-subpanel w-full p-2.5 rounded-[6px] border flex justify-between items-center"
              >
                <span className="terminal-result-muted uppercase">FAILURE REASON:</span>
                <span className="text-terminal-danger font-bold uppercase tracking-wider">
                  {failureReason}
                </span>
              </div>
            )}
            {attemptsUsed !== undefined && (
              <div
                data-testid="failure-attempts"
                className="terminal-result-subpanel w-full p-2.5 rounded-[6px] border flex justify-between items-center"
              >
                <span className="terminal-result-muted uppercase">ATTEMPTS:</span>
                <span className="terminal-result-ink font-bold">
                  {maxAttempts != null
                    ? `${attemptsUsed} of ${maxAttempts} used`
                    : `${attemptsUsed} used`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Revealed secret if lost */}
        {!isWon && secret && (
          <div className="terminal-result-subpanel w-full p-3 rounded-[6px] border font-data">
            <span className="text-[11px] terminal-result-muted uppercase tracking-wider block">
              TARGET CIPHER CODE
            </span>
            <span className="text-xl font-bold terminal-result-ink tracking-[0.25em] mt-1 block">
              {secret}
            </span>
          </div>
        )}

        {/* Payout or fine */}
        {isWon && payout !== undefined && (
          <div className="terminal-result-subpanel w-full p-2.5 rounded-[6px] border font-data text-xs">
            <span className="terminal-result-muted">PAYOUT CREDITED: </span>
            <span className="terminal-result-success font-bold">+${payout}</span>
          </div>
        )}
        {isWon && receipt && (
          <section aria-label="Confirmed breach receipt" className="terminal-result-subpanel w-full rounded-md border p-3 text-left font-data text-xs space-y-2">
            <h3 className="font-bold uppercase tracking-wide">Breach receipt</h3>
            <dl className="space-y-2">
              <div className="flex justify-between gap-3"><dt>Base payout</dt><dd>+${payout ?? 0}</dd></div>
              {receipt.bonusCredits > 0 && <div className="flex justify-between gap-3"><dt>Earned tool bonus</dt><dd>+${receipt.bonusCredits}</dd></div>}
              {receipt.campaignLedgerCredit !== undefined && <div className="flex justify-between gap-3"><dt>Campaign ledger credit</dt><dd>+${receipt.campaignLedgerCredit}</dd></div>}
              <div className="flex justify-between gap-3 border-t border-terminal-line pt-2 font-bold"><dt>Confirmed credits added</dt><dd>+${(payout ?? 0) + receipt.bonusCredits + (receipt.campaignLedgerCredit ?? 0)}</dd></div>
              {receipt.confirmedBalance !== undefined && <div className="flex justify-between gap-3"><dt>Current wallet balance</dt><dd>${receipt.confirmedBalance.toLocaleString()}</dd></div>}
              {receipt.debtReduced !== undefined && <div className="flex justify-between gap-3"><dt>Debt reduced separately</dt><dd>−${receipt.debtReduced}</dd></div>}
              {receipt.remainingDebt !== undefined && <div className="flex justify-between gap-3"><dt>Debt remaining</dt><dd>${receipt.remainingDebt.toLocaleString()}</dd></div>}
            </dl>
            {receipt.confirmedBalance === undefined && <p className="terminal-result-muted">Wallet balance is not yet confirmed. Check the Rig ledger for the latest balance.</p>}
            {receipt.campaignLedgerCredit !== undefined && <p className="terminal-result-muted leading-relaxed">This simulation credits the debt-relief amount to your wallet and reduces debt by the same amount. The advertised contract bounty is not an additional wallet award.</p>}
          </section>
        )}
        {!isWon && fine !== undefined && (
          <div className="terminal-result-subpanel w-full p-2.5 rounded-[6px] border font-data text-xs">
            <span className="terminal-result-muted">TRACE PENALTY: </span>
            <span className="terminal-result-danger font-bold">-${fine}</span>
          </div>
        )}

        {!isWon && onStartRecovery && (
          <div className="w-full flex flex-col gap-3">
            <p className="font-data text-xs terminal-result-ink leading-relaxed">
              Nix has a quiet practice lock ready. No clock and no fine. Crack it, then come back to this assignment together.
            </p>
            <button
              type="button"
              onClick={onStartRecovery}
              style={{
                border: '1px solid var(--terminal-phosphor)',
                color: 'var(--terminal-phosphor)',
              }}
              className="w-full min-h-[44px] rounded-[8px] font-data text-xs font-bold tracking-wider uppercase transition-transform active:scale-[0.97] flex items-center justify-center"
            >
              {recoveryActionLabel}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onReturnToMap}
          style={{
            backgroundColor: 'var(--terminal-phosphor)',
            color: 'var(--terminal-bg)',
          }}
          className="w-full h-12 min-h-[44px] rounded-[8px] font-data text-xs font-bold tracking-wider uppercase transition-transform active:scale-[0.97] hover:brightness-105 flex items-center justify-center shadow-card"
        >
          {returnActionLabel}
        </button>
      </motion.div>
    </div>
  );
}
