'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/app/api/mock/db';
import { rigService } from './rigService';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

export const WalletHistory: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'credits' | 'coins'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = (selectedFilter: 'all' | 'credits' | 'coins') => {
    setLoading(true);
    const param = selectedFilter === 'all' ? undefined : selectedFilter;
    rigService
      .getWalletHistory(param)
      .then((data) => {
        setTransactions(data.transactions);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load wallet history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory(filter);
  }, [filter]);

  return (
    <div className="w-full flex flex-col gap-3 font-data">
      {/* Filter Tabs using SegmentedControl */}
      <SegmentedControl<'all' | 'credits' | 'coins'>
        ariaLabel="Ledger Currency Filter"
        value={filter}
        onChange={(val) => setFilter(val)}
        options={[
          { id: 'all', label: 'ALL' },
          { id: 'credits', label: 'CREDITS' },
          { id: 'coins', label: 'COINS' },
        ]}
      />

      {/* Transaction List */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="py-8 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>SYNCING TRANSACTION LEDGER...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-panel-light p-6 rounded-[12px] border border-line text-center text-xs text-ink-muted italic">
            No transactions found for this filter.
          </div>
        ) : (
          transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            const isCoins = tx.currency === 'coins';
            const formattedAmount = isCoins
              ? `${isPositive ? '+' : ''}${tx.amount} Coins`
              : `${isPositive ? '+' : ''}$${Math.abs(tx.amount).toLocaleString()}`;

            const formattedTime = new Date(tx.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={tx.id}
                className="bg-panel-light border border-line rounded-[12px] p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-sm font-normal text-ink truncate">
                      {tx.source}
                    </span>
                    <span className="text-[9px] bg-panel text-ink-muted border border-line px-1.5 py-0.2 rounded-pill uppercase tracking-wider">
                      {tx.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1.5">
                    <span>{formattedTime}</span>
                    <span>•</span>
                    <span>
                      Bal:{' '}
                      {isCoins
                        ? `${tx.runningBalance} Coins`
                        : `$${tx.runningBalance.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-data text-[15px] font-semibold ${
                      isPositive ? 'text-accent-text' : 'text-danger-text'
                    }`}
                  >
                    {formattedAmount}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
