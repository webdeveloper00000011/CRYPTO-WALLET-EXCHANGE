import React, { useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, X } from 'lucide-react';
import { CurrencyCode, Transaction } from '../types/wallet';
import { CHAINS } from '../data/chainsAndTokens';
import {
  formatFiat,
  formatFullTimestamp,
  formatTokenAmount,
  truncateAddress,
} from '../utils/formatters';
import { ChainBadgeIcon } from './ChainIcon';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  currency: CurrencyCode;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  currency,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!transaction) return null;

  const chain = CHAINS[transaction.chainId];
  const toChain = transaction.toChainId ? CHAINS[transaction.toChainId] : null;

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(transaction.hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-detail-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="tx-detail-title"
            className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 capitalize"
          >
            {transaction.type} Receipt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close transaction receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <ChainBadgeIcon chainId={transaction.chainId} size={28} />
              {toChain && toChain.id !== chain.id && (
                <>
                  <span className="text-xs text-slate-400">→</span>
                  <ChainBadgeIcon chainId={toChain.id} size={28} />
                </>
              )}
            </div>

            {transaction.type === 'swap' && transaction.toAmount && transaction.toAssetSymbol ? (
              <div className="text-lg font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatTokenAmount(transaction.amount, 4)} {transaction.assetSymbol} →{' '}
                {formatTokenAmount(transaction.toAmount, 4)} {transaction.toAssetSymbol}
              </div>
            ) : (
              <div className="text-xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {transaction.type === 'receive' || transaction.type === 'buy' ? '+' : '-'}
                {formatTokenAmount(transaction.amount, 6)} {transaction.assetSymbol}
              </div>
            )}

            <div className="text-sm font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1">
              {formatFiat(transaction.usdValueAtTx, currency)}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {transaction.status === 'confirmed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
              <span className="capitalize">{transaction.status}</span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">
                {formatFullTimestamp(transaction.timestamp)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-500 dark:text-slate-400">Network</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {chain.name}
                {toChain && toChain.id !== chain.id ? ` → ${toChain.name}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-500 dark:text-slate-400">Counterparty / Router</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {transaction.counterpartyAddress.startsWith('0x') ||
                transaction.counterpartyAddress.startsWith('bc1')
                  ? truncateAddress(transaction.counterpartyAddress, 8, 6)
                  : transaction.counterpartyAddress}
              </span>
            </div>

            {transaction.routeProvider && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-slate-500 dark:text-slate-400">Liquidity Route</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {transaction.routeProvider}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-500 dark:text-slate-400">Block Height</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                #{transaction.blockHeight.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-500 dark:text-slate-400">Network Gas Fee</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {formatTokenAmount(transaction.gasFeeNative, 6)} {transaction.gasSymbol} ({formatFiat(transaction.gasFeeUsd, currency)})
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Tx Hash</span>
              <button
                type="button"
                onClick={() => void copyHash()}
                className="flex items-center gap-1.5 font-mono text-slate-900 dark:text-slate-100 hover:text-[#0500FF] dark:hover:text-[#6B8AFF] cursor-pointer truncate"
              >
                <span className="truncate">{truncateAddress(transaction.hash, 10, 8)}</span>
                {copiedHash ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
