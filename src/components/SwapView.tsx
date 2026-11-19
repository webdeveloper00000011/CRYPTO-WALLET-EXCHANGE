import React, { useMemo, useState } from 'react';
import { ArrowUpDown, CheckCircle2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Asset, CurrencyCode, WalletAccount } from '../types/wallet';
import { CHAINS } from '../data/chainsAndTokens';
import { formatFiat, formatTokenAmount } from '../utils/formatters';
import { TokenIcon } from './ChainIcon';

interface SwapViewProps {
  wallet: WalletAccount;
  initialFromAssetId?: string;
  currency: CurrencyCode;
  hideBalances: boolean;
  requireBiometric: boolean;
  onExecuteSwap: (payload: {
    fromAsset: Asset;
    toAsset: Asset;
    fromAmount: number;
    toAmount: number;
    slippagePct: number;
    gasFeeNative: number;
    routeProvider: string;
  }) => void;
  lastSwapMessage: string | null;
}

export const SwapView: React.FC<SwapViewProps> = ({
  wallet,
  initialFromAssetId,
  currency,
  hideBalances,
  requireBiometric,
  onExecuteSwap,
  lastSwapMessage,
}) => {
  const [fromAssetId, setFromAssetId] = useState<string>(
    initialFromAssetId ||
      wallet.assets.find((a) => a.symbol === 'USDC')?.id ||
      wallet.assets[0].id
  );
  const [toAssetId, setToAssetId] = useState<string>(
    wallet.assets.find((a) => a.symbol === 'SOL')?.id || wallet.assets[1].id
  );
  const [fromAmountStr, setFromAmountStr] = useState<string>('500');
  const [slippagePct, setSlippagePct] = useState<number>(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  const fromAsset = useMemo(
    () => wallet.assets.find((a) => a.id === fromAssetId) || wallet.assets[0],
    [wallet.assets, fromAssetId]
  );
  const toAsset = useMemo(
    () => wallet.assets.find((a) => a.id === toAssetId) || wallet.assets[1],
    [wallet.assets, toAssetId]
  );

  const fromChain = CHAINS[fromAsset.chainId];
  const toChain = CHAINS[toAsset.chainId];
  const isCrossChain = fromAsset.chainId !== toAsset.chainId;

  const nativeGasAsset = wallet.assets.find(
    (a) => a.chainId === fromAsset.chainId && a.isNative
  );
  const gasFeeNative = fromChain.baseGasFeeNative * (isCrossChain ? 1.35 : 1.0);
  const gasFeeUsd = gasFeeNative * (nativeGasAsset?.priceUsd ?? 0);

  const fromAmount = Math.max(0, parseFloat(fromAmountStr) || 0);
  const usdValue = fromAmount * fromAsset.priceUsd;
  const protocolFeePct = isCrossChain ? 0.0025 : 0.001;
  const priceImpactPct = Math.min(2.4, Math.max(0.02, (usdValue / 250000) * 1.2));
  const netUsdOut = usdValue * (1 - protocolFeePct - priceImpactPct / 100);
  const toAmount = toAsset.priceUsd > 0 ? netUsdOut / toAsset.priceUsd : 0;
  const minReceived = toAmount * (1 - slippagePct / 100);
  const exchangeRate = toAsset.priceUsd > 0 ? fromAsset.priceUsd / toAsset.priceUsd : 0;

  const maxSpendable = fromAsset.isNative
    ? Math.max(0, fromAsset.balance - gasFeeNative)
    : fromAsset.balance;

  const routeProvider = isCrossChain
    ? fromAsset.chainId === 'bitcoin' || toAsset.chainId === 'bitcoin'
      ? 'THORChain Native Cross-Chain'
      : 'LayerZero + Stargate Bridge'
    : fromAsset.chainId === 'solana'
    ? 'Jupiter v6 Aggregator'
    : fromAsset.chainId === 'bsc'
    ? 'PancakeSwap Smart Router'
    : '1inch Fusion DEX Aggregator';

  const validationError = useMemo(() => {
    if (fromAsset.id === toAsset.id) return 'Select two different tokens to swap.';
    if (fromAmount <= 0) return 'Enter an amount greater than 0.';
    if (fromAmount > maxSpendable + 1e-9) {
      return `Insufficient ${fromAsset.symbol} balance (${formatTokenAmount(maxSpendable, 4)} available).`;
    }
    if (!fromAsset.isNative && nativeGasAsset && nativeGasAsset.balance < gasFeeNative) {
      return `Insufficient ${fromChain.nativeSymbol} on ${fromChain.name} to cover gas.`;
    }
    return null;
  }, [fromAsset, toAsset, fromAmount, maxSpendable, nativeGasAsset, gasFeeNative, fromChain]);

  const handleFlip = () => {
    setFromAssetId(toAsset.id);
    setToAssetId(fromAsset.id);
  };

  const handleQuickPct = (pct: number) => {
    const val = maxSpendable * pct;
    setFromAmountStr(val > 0 ? Number(val.toFixed(6)).toString() : '0');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;
    onExecuteSwap({
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      slippagePct,
      gasFeeNative,
      routeProvider,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
              Multi-Chain Swap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isCrossChain
                ? `Cross-chain bridge & swap · ${fromChain.name} to ${toChain.name}`
                : `Same-chain DEX execution · ${fromChain.name}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSlippageSettings((s) => !s)}
            className={`min-h-[40px] px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showSlippageSettings
                ? 'border-[#0500FF] text-[#0500FF] dark:border-[#6B8AFF] dark:text-[#93B4FF] bg-[#0500FF]/5'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1B2332]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{slippagePct}%</span>
          </button>
        </div>

        {showSlippageSettings && (
          <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Max Slippage Tolerance
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Protects against price movement
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[0.1, 0.5, 1.0, 2.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSlippagePct(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                    slippagePct === val
                      ? 'bg-[#0500FF] text-white'
                      : 'bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* From Box */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span>Pay From · {fromChain.name}</span>
              <span className="font-mono tabular-nums">
                Bal: {formatTokenAmount(fromAsset.balance, 4, hideBalances)} {fromAsset.symbol}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shrink-0">
                <TokenIcon symbol={fromAsset.symbol} chainId={fromAsset.chainId} size={28} />
                <select
                  aria-label="Pay token"
                  value={fromAsset.id}
                  onChange={(e) => setFromAssetId(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
                >
                  {wallet.assets.map((a) => (
                    <option key={a.id} value={a.id} className="bg-white dark:bg-[#131924]">
                      {a.symbol} ({CHAINS[a.chainId].shortName})
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="number"
                step="any"
                min="0"
                aria-label="Pay amount"
                value={fromAmountStr}
                onChange={(e) => setFromAmountStr(e.target.value)}
                placeholder="0.00"
                className="flex-1 min-w-0 bg-transparent text-right font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5">
                {[0.25, 0.5, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPct(pct)}
                    className="px-2 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-700 hover:border-[#0500FF] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {pct === 1 ? 'MAX' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                ≈ {formatFiat(usdValue, currency, hideBalances)}
              </span>
            </div>
          </div>

          {/* Flip button */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              type="button"
              onClick={handleFlip}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#1B2332] border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-[#0500FF] dark:hover:text-[#6B8AFF] hover:border-[#0500FF] transition-colors cursor-pointer"
              aria-label="Swap direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* To Box */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span>Receive To · {toChain.name}</span>
              <span className="font-mono tabular-nums">
                Bal: {formatTokenAmount(toAsset.balance, 4, hideBalances)} {toAsset.symbol}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shrink-0">
                <TokenIcon symbol={toAsset.symbol} chainId={toAsset.chainId} size={28} />
                <select
                  aria-label="Receive token"
                  value={toAsset.id}
                  onChange={(e) => setToAssetId(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
                >
                  {wallet.assets.map((a) => (
                    <option key={a.id} value={a.id} className="bg-white dark:bg-[#131924]">
                      {a.symbol} ({CHAINS[a.chainId].shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-0 text-right font-mono tabular-nums text-2xl font-semibold text-slate-900 dark:text-white truncate">
                {formatTokenAmount(toAmount, 6)}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums">
                1 {fromAsset.symbol} ≈ {formatTokenAmount(exchangeRate, 6)} {toAsset.symbol}
              </span>
              <span className="font-mono tabular-nums">
                ≈ {formatFiat(toAmount * toAsset.priceUsd, currency, hideBalances)}
              </span>
            </div>
          </div>

          {validationError && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium pt-1">
              {validationError}
            </p>
          )}

          {lastSwapMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{lastSwapMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!!validationError}
            className="w-full h-12 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {requireBiometric
                ? `Verify Biometrics & Swap ${fromAsset.symbol} → ${toAsset.symbol}`
                : `Confirm Swap ${fromAsset.symbol} → ${toAsset.symbol}`}
            </span>
          </button>
        </form>
      </div>

      {/* Right column: Route & Execution Summary */}
      <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div>
          <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-white">
            Quote & Liquidity Routing
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Best execution across decentralized liquidity pools
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Aggregator / Bridge</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {routeProvider}
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Minimum Received</span>
            <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
              {formatTokenAmount(minReceived, 6)} {toAsset.symbol}
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Price Impact</span>
            <span className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
              {priceImpactPct.toFixed(2)}%
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Provider Fee</span>
            <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {(protocolFeePct * 100).toFixed(2)}% ({formatFiat(usdValue * protocolFeePct, currency)})
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Estimated Gas ({fromChain.shortName})</span>
            <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatTokenAmount(gasFeeNative, 6)} {fromChain.nativeSymbol} ({formatFiat(gasFeeUsd, currency)})
            </span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Estimated Settlement</span>
            <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {isCrossChain ? '~45 seconds' : `~${Math.max(1, fromChain.avgBlockTimeSec)}s`}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          All swaps are signed locally using your encrypted vault keys after biometric or PIN verification. Private keys never leave your device.
        </div>
      </div>
    </div>
  );
};
