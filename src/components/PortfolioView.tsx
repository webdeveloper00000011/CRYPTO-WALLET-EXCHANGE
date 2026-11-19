import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Asset,
  ChainId,
  CurrencyCode,
  Transaction,
  WalletAccount,
} from '../types/wallet';
import { CHAINS, CHAIN_LIST } from '../data/chainsAndTokens';
import {
  formatFiat,
  formatPercent,
  formatPrice,
  formatRelativeTime,
  formatTokenAmount,
  truncateAddress,
} from '../utils/formatters';
import { ChainBadgeIcon, TokenIcon } from './ChainIcon';
import { PortfolioChart } from './PortfolioChart';

interface PortfolioViewProps {
  wallet: WalletAccount;
  currency: CurrencyCode;
  hideBalances: boolean;
  onToggleHideBalances: () => void;
  onOpenSend: (assetId?: string) => void;
  onOpenReceive: (chainId?: ChainId) => void;
  onOpenBuy: () => void;
  onGoToSwap: (assetId?: string) => void;
  onGoToActivity: () => void;
  onSelectAsset: (asset: Asset) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onToggleTokenVisibility: (assetId: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  wallet,
  currency,
  hideBalances,
  onToggleHideBalances,
  onOpenSend,
  onOpenReceive,
  onOpenBuy,
  onGoToSwap,
  onGoToActivity,
  onSelectAsset,
  onSelectTransaction,
  onToggleTokenVisibility,
}) => {
  const [chainFilter, setChainFilter] = useState<'all' | ChainId>('all');
  const [search, setSearch] = useState('');
  const [manageTokens, setManageTokens] = useState(false);
  const [copiedChain, setCopiedChain] = useState<string | null>(null);

  const visibleAssets = useMemo(
    () => wallet.assets.filter((a) => manageTokens || a.visible),
    [wallet.assets, manageTokens]
  );

  const totalPortfolioUsd = useMemo(
    () => wallet.assets.reduce((sum, a) => sum + a.balance * a.priceUsd, 0),
    [wallet.assets]
  );

  const weighted24hChange = useMemo(() => {
    if (totalPortfolioUsd === 0) return 0;
    const weightedSum = wallet.assets.reduce(
      (sum, a) => sum + a.balance * a.priceUsd * a.change24h,
      0
    );
    return weightedSum / totalPortfolioUsd;
  }, [wallet.assets, totalPortfolioUsd]);

  const filteredAssets = useMemo(() => {
    return visibleAssets
      .filter((a) => {
        if (chainFilter !== 'all' && a.chainId !== chainFilter) return false;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          return (
            a.symbol.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            CHAINS[a.chainId].name.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.balance * b.priceUsd - a.balance * a.priceUsd);
  }, [visibleAssets, chainFilter, search]);

  const chainAllocations = useMemo(() => {
    const map = new Map<ChainId, number>();
    wallet.assets.forEach((a) => {
      const val = a.balance * a.priceUsd;
      if (val > 0) {
        map.set(a.chainId, (map.get(a.chainId) || 0) + val);
      }
    });
    return Array.from(map.entries())
      .map(([chainId, usd]) => ({
        chainId,
        usd,
        pct: totalPortfolioUsd > 0 ? (usd / totalPortfolioUsd) * 100 : 0,
      }))
      .sort((a, b) => b.usd - a.usd);
  }, [wallet.assets, totalPortfolioUsd]);

  const copyAddress = async (key: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedChain(key);
      setTimeout(() => setCopiedChain(null), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left/Center Main Column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Portfolio Balance + Chart */}
        <section className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Multi-Chain Portfolio Value</span>
                <button
                  type="button"
                  onClick={onToggleHideBalances}
                  className="min-w-[28px] min-h-[28px] inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                  aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
                >
                  {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h2 className="text-3xl sm:text-4xl font-display font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {formatFiat(totalPortfolioUsd, currency, hideBalances)}
                </h2>
                <span
                  className={`text-sm font-mono tabular-nums font-semibold ${
                    weighted24hChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatPercent(weighted24hChange)} (24h)
                </span>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="grid grid-cols-4 sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenSend()}
                className="h-10 px-3.5 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Send</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenReceive('ethereum')}
                className="h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Receive</span>
              </button>
              <button
                type="button"
                onClick={() => onGoToSwap()}
                className="h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Swap</span>
              </button>
              <button
                type="button"
                onClick={onOpenBuy}
                className="h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Buy</span>
              </button>
            </div>
          </div>

          <PortfolioChart
            currentTotalUsd={totalPortfolioUsd}
            currency={currency}
            hideBalances={hideBalances}
          />
        </section>

        {/* Multi-Chain Asset Table */}
        <section className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                Assets Across Networks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {filteredAssets.length} active tokens · Click any asset to inspect or transfer
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter token or chain..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
                />
              </div>
              <button
                type="button"
                onClick={() => setManageTokens((m) => !m)}
                className={`h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  manageTokens
                    ? 'border-[#0500FF] text-[#0500FF] dark:border-[#6B8AFF] dark:text-[#93B4FF] bg-[#0500FF]/5'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1B2332]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{manageTokens ? 'Done' : 'Manage'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Chain Filter Tabs */}
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setChainFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                chainFilter === 'all'
                  ? 'bg-[#0500FF] text-white'
                  : 'bg-slate-100 dark:bg-[#1B2332] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Chains
            </button>
            {CHAIN_LIST.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => setChainFilter(chain.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  chainFilter === chain.id
                    ? 'bg-[#0500FF] text-white'
                    : 'bg-slate-100 dark:bg-[#1B2332] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ChainBadgeIcon chainId={chain.id} size={14} />
                <span>{chain.shortName}</span>
              </button>
            ))}
          </div>

          {/* Table Header (desktop) */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50/70 dark:bg-[#0B0F17]/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <div className="col-span-5">Asset</div>
            <div className="col-span-3 text-right">Price / 24h</div>
            <div className="col-span-4 text-right">
              {manageTokens ? 'Visibility' : 'Holdings'}
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                No assets match your filter
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try clearing the search query or switching back to All Chains.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssets.map((asset) => {
                const chain = CHAINS[asset.chainId];
                const usdVal = asset.balance * asset.priceUsd;
                const isUp = asset.change24h >= 0;

                return (
                  <div
                    key={asset.id}
                    className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-[#1B2332]/50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectAsset(asset)}
                      className="col-span-7 sm:col-span-5 flex items-center gap-3 text-left min-w-0 cursor-pointer"
                    >
                      <TokenIcon symbol={asset.symbol} chainId={asset.chainId} size={36} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {asset.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {asset.symbol} · {chain.name}
                        </div>
                      </div>
                    </button>

                    <div className="hidden sm:block col-span-3 text-right">
                      <div className="font-mono tabular-nums text-xs font-medium text-slate-900 dark:text-slate-100">
                        {formatPrice(asset.priceUsd, currency)}
                      </div>
                      <div
                        className={`font-mono tabular-nums text-[11px] font-medium ${
                          isUp
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatPercent(asset.change24h)}
                      </div>
                    </div>

                    <div className="col-span-5 sm:col-span-4 text-right flex items-center justify-end gap-3">
                      {manageTokens ? (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={asset.visible}
                          aria-label={`Toggle ${asset.symbol} visibility`}
                          onClick={() => onToggleTokenVisibility(asset.id)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                            asset.visible
                              ? 'bg-[#0500FF]'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                              asset.visible ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectAsset(asset)}
                          className="text-right cursor-pointer"
                        >
                          <div className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatFiat(usdVal, currency, hideBalances)}
                          </div>
                          <div className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                            {formatTokenAmount(asset.balance, 5, hideBalances)} {asset.symbol}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Allocation, Multi-Chain Addresses & Recent Activity */}
      <div className="lg:col-span-4 space-y-6">
        {/* Network Allocation */}
        <section className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white mb-4">
            Network Allocation
          </h3>
          <div className="space-y-3.5">
            {chainAllocations.slice(0, 6).map(({ chainId, usd, pct }) => {
              const chain = CHAINS[chainId];
              return (
                <div key={chainId}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <ChainBadgeIcon chainId={chainId} size={16} />
                      <span>{chain.name}</span>
                    </div>
                    <div className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {pct.toFixed(1)}% · {formatFiat(usd, currency, hideBalances)}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#1B2332] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, pct)}%`,
                        backgroundColor: chain.accentColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Multi-Chain Addresses */}
        <section className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Vault Addresses
            </h3>
            <button
              type="button"
              onClick={() => onOpenReceive('ethereum')}
              className="text-xs font-medium text-[#0500FF] dark:text-[#6B8AFF] hover:underline cursor-pointer"
            >
              Show QR
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {(
              [
                { key: 'evm', label: 'EVM (ETH, BSC, L2s)', chain: 'ethereum' as ChainId },
                { key: 'btc', label: 'Bitcoin (SegWit)', chain: 'bitcoin' as ChainId },
                { key: 'sol', label: 'Solana (SPL)', chain: 'solana' as ChainId },
              ] as const
            ).map((row) => {
              const addr = wallet.addresses[row.chain];
              return (
                <div
                  key={row.key}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChainBadgeIcon chainId={row.chain} size={18} />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {row.label}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {truncateAddress(addr, 8, 6)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copyAddress(row.key, addr)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#1B2332] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    aria-label={`Copy ${row.label} address`}
                  >
                    {copiedChain === row.key ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity Preview */}
        <section className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <button
              type="button"
              onClick={onGoToActivity}
              className="text-xs font-medium text-[#0500FF] dark:text-[#6B8AFF] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {wallet.transactions.slice(0, 3).map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => onSelectTransaction(tx)}
                className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-[#1B2332]/50 rounded-lg px-1.5 -mx-1.5 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 capitalize truncate">
                    {tx.type}
                    {tx.type === 'swap' && tx.toAssetSymbol
                      ? ` ${tx.assetSymbol} → ${tx.toAssetSymbol}`
                      : ` ${tx.assetSymbol}`}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {CHAINS[tx.chainId].shortName} · {formatRelativeTime(tx.timestamp)}
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums text-xs font-medium text-slate-900 dark:text-slate-100 shrink-0">
                  {tx.type === 'receive' || tx.type === 'buy' ? '+' : ''}
                  {formatTokenAmount(tx.amount, 4, hideBalances)} {tx.assetSymbol}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
