import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  X,
} from 'lucide-react';
import { Asset, CurrencyCode, Transaction, WalletAccount } from '../types/wallet';
import { CHAINS } from '../data/chainsAndTokens';
import {
  formatFiat,
  formatPercent,
  formatPrice,
  formatRelativeTime,
  formatTokenAmount,
  truncateAddress,
} from '../utils/formatters';
import { TokenIcon } from './ChainIcon';

interface AssetDetailModalProps {
  asset: Asset | null;
  wallet: WalletAccount;
  currency: CurrencyCode;
  hideBalances: boolean;
  onClose: () => void;
  onSend: (assetId: string) => void;
  onReceive: (chainId: Asset['chainId']) => void;
  onSwap: (assetId: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  wallet,
  currency,
  hideBalances,
  onClose,
  onSend,
  onReceive,
  onSwap,
  onSelectTransaction,
}) => {
  const [copiedAddr, setCopiedAddr] = useState(false);

  if (!asset) return null;

  const chain = CHAINS[asset.chainId];
  const address = wallet.addresses[asset.chainId];
  const usdValue = asset.balance * asset.priceUsd;
  const isPositive = asset.change24h >= 0;

  const relatedTxs = wallet.transactions.filter(
    (tx) => tx.assetId === asset.id || tx.toAssetId === asset.id
  );

  // Build mini sparkline path
  const minVal = Math.min(...asset.sparkline);
  const maxVal = Math.max(...asset.sparkline);
  const range = maxVal - minVal || 1;
  const sparkPath = asset.sparkline
    .map((val, idx) => {
      const x = (idx / (asset.sparkline.length - 1)) * 280;
      const y = 52 - ((val - minVal) / range) * 44;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-detail-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={asset.symbol} chainId={asset.chainId} size={36} />
            <div>
              <h2
                id="asset-detail-title"
                className="text-base font-display font-semibold text-slate-900 dark:text-slate-100"
              >
                {asset.name}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {asset.symbol} · {chain.name} · {chain.standardLabel}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close asset detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Your Balance
              </div>
              <div className="text-2xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatTokenAmount(asset.balance, 6, hideBalances)} {asset.symbol}
              </div>
              <div className="text-sm font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                {formatFiat(usdValue, currency, hideBalances)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Market Price
              </div>
              <div className="text-base font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                {formatPrice(asset.priceUsd, currency)}
              </div>
              <div
                className={`text-xs font-mono tabular-nums font-medium mt-0.5 ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPercent(asset.change24h)} (24h)
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>7-Day Price Trend</span>
              <span className="font-mono tabular-nums">
                Range: {formatPrice(minVal, currency)} – {formatPrice(maxVal, currency)}
              </span>
            </div>
            <svg viewBox="0 0 280 56" className="w-full h-14 overflow-visible">
              <path
                d={sparkPath}
                fill="none"
                stroke={isPositive ? '#16A34A' : '#DC2626'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSend(asset.id);
              }}
              className="h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReceive(asset.chainId);
              }}
              className="h-11 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Receive</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwap(asset.id);
              }}
              className="h-11 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Swap</span>
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Your {chain.shortName} Address</span>
              <button
                type="button"
                onClick={() => void copyAddress()}
                className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 hover:text-[#0500FF] dark:hover:text-[#6B8AFF] cursor-pointer"
              >
                <span>{truncateAddress(address, 8, 6)}</span>
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {asset.contractAddress && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Token Contract</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {truncateAddress(asset.contractAddress, 8, 6)}
                </span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Recent {asset.symbol} Activity
            </h3>
            {relatedTxs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                No transactions recorded for {asset.symbol} yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {relatedTxs.slice(0, 4).map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectTransaction(tx);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-[#1B2332] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100 capitalize">
                        {tx.type}
                        {tx.type === 'swap' && tx.toAssetSymbol
                          ? ` ${tx.assetSymbol} → ${tx.toAssetSymbol}`
                          : ` ${tx.assetSymbol}`}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(tx.timestamp)} · {tx.status}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums text-xs font-medium text-slate-900 dark:text-slate-100">
                      {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}
                      {formatTokenAmount(tx.amount, 4, hideBalances)} {tx.assetSymbol}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
