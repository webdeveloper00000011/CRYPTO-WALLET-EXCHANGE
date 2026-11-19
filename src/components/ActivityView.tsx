import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Coins,
  CreditCard,
  Search,
} from 'lucide-react';
import {
  ChainId,
  CurrencyCode,
  Transaction,
  TransactionType,
} from '../types/wallet';
import { CHAINS, CHAIN_LIST } from '../data/chainsAndTokens';
import {
  formatFiat,
  formatRelativeTime,
  formatTokenAmount,
  truncateAddress,
} from '../utils/formatters';
import { ChainBadgeIcon } from './ChainIcon';

interface ActivityViewProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  hideBalances: boolean;
  onSelectTransaction: (tx: Transaction) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  transactions,
  currency,
  hideBalances,
  onSelectTransaction,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [chainFilter, setChainFilter] = useState<'all' | ChainId>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (chainFilter !== 'all' && tx.chainId !== chainFilter && tx.toChainId !== chainFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          tx.assetSymbol.toLowerCase().includes(q) ||
          (tx.toAssetSymbol && tx.toAssetSymbol.toLowerCase().includes(q)) ||
          tx.hash.toLowerCase().includes(q) ||
          tx.counterpartyAddress.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, chainFilter, search]);

  const renderIcon = (type: TransactionType) => {
    switch (type) {
      case 'swap':
        return <ArrowLeftRight className="w-4 h-4 text-[#0500FF] dark:text-[#7AA2FF]" />;
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'buy':
        return <CreditCard className="w-4 h-4 text-[#0500FF] dark:text-[#7AA2FF]" />;
      case 'stake':
      case 'unstake':
        return <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
            On-Chain Activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} recorded multi-chain transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol or tx hash..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
            />
          </div>

          <select
            aria-label="Filter by network"
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value as 'all' | ChainId)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Networks</option>
            {CHAIN_LIST.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'swap', label: 'Swaps' },
            { id: 'send', label: 'Sent' },
            { id: 'receive', label: 'Received' },
            { id: 'stake', label: 'Staking' },
            { id: 'buy', label: 'Deposits' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              typeFilter === tab.id
                ? 'bg-[#0500FF] text-white'
                : 'bg-slate-100 dark:bg-[#1B2332] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No matching transactions
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adjust your network or transaction type filter to inspect other records.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((tx) => {
            const chain = CHAINS[tx.chainId];
            const toChain = tx.toChainId ? CHAINS[tx.toChainId] : null;
            return (
              <button
                key={tx.id}
                type="button"
                onClick={() => onSelectTransaction(tx)}
                className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-[#1B2332]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1B2332] flex items-center justify-center shrink-0">
                    {renderIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                        {tx.type}
                      </span>
                      <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <ChainBadgeIcon chainId={tx.chainId} size={14} />
                        <span>{chain.shortName}</span>
                        {toChain && toChain.id !== chain.id && (
                          <>
                            <span>→</span>
                            <ChainBadgeIcon chainId={toChain.id} size={14} />
                            <span>{toChain.shortName}</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {formatRelativeTime(tx.timestamp)} ·{' '}
                      <span className="font-mono">{truncateAddress(tx.hash, 6, 4)}</span> ·{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 capitalize">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {tx.type === 'swap' && tx.toAmount && tx.toAssetSymbol ? (
                    <div className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">
                      +{formatTokenAmount(tx.toAmount, 4, hideBalances)} {tx.toAssetSymbol}
                    </div>
                  ) : (
                    <div
                      className={`font-mono tabular-nums text-sm font-semibold ${
                        tx.type === 'receive' || tx.type === 'buy'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {tx.type === 'receive' || tx.type === 'buy' ? '+' : '-'}
                      {formatTokenAmount(tx.amount, 5, hideBalances)} {tx.assetSymbol}
                    </div>
                  )}
                  <div className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx.type === 'swap'
                      ? `From ${formatTokenAmount(tx.amount, 4, hideBalances)} ${tx.assetSymbol}`
                      : formatFiat(tx.usdValueAtTx, currency, hideBalances)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
