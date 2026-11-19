import React, { useMemo, useState } from 'react';
import { CreditCard, ShieldCheck, X } from 'lucide-react';
import { Asset, CurrencyCode, WalletAccount } from '../types/wallet';
import { CHAINS } from '../data/chainsAndTokens';
import { formatFiat, formatTokenAmount } from '../utils/formatters';
import { TokenIcon } from './ChainIcon';

interface BuyModalProps {
  isOpen: boolean;
  wallet: WalletAccount;
  currency: CurrencyCode;
  onClose: () => void;
  onRequestBuy: (payload: { asset: Asset; usdAmount: number; tokenAmount: number }) => void;
}

const PRESET_USD = [100, 250, 500, 1000];

export const BuyModal: React.FC<BuyModalProps> = ({
  isOpen,
  wallet,
  currency,
  onClose,
  onRequestBuy,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    wallet.assets[0]?.id || ''
  );
  const [usdAmountStr, setUsdAmountStr] = useState('250');

  const asset = useMemo(
    () => wallet.assets.find((a) => a.id === selectedAssetId) || wallet.assets[0],
    [wallet.assets, selectedAssetId]
  );

  if (!isOpen || !asset) return null;

  const usdAmount = Math.max(0, parseFloat(usdAmountStr) || 0);
  const feeUsd = usdAmount * 0.012;
  const netUsd = Math.max(0, usdAmount - feeUsd);
  const tokenAmount = asset.priceUsd > 0 ? netUsd / asset.priceUsd : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usdAmount < 10) return;
    onRequestBuy({ asset, usdAmount, tokenAmount });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="buy-modal-title"
            className="text-base font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            Buy & Deposit Assets
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close buy modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="buy-asset-select"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Asset to Purchase
            </label>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17]">
              <TokenIcon symbol={asset.symbol} chainId={asset.chainId} size={32} />
              <select
                id="buy-asset-select"
                value={asset.id}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {wallet.assets.map((a) => (
                  <option key={a.id} value={a.id} className="bg-white dark:bg-[#131924]">
                    {a.name} ({a.symbol}) · {CHAINS[a.chainId].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="buy-usd-input"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Purchase Amount (USD)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3.5 py-2.5">
              <span className="text-base font-mono text-slate-400">$</span>
              <input
                id="buy-usd-input"
                type="number"
                min="10"
                step="any"
                value={usdAmountStr}
                onChange={(e) => setUsdAmountStr(e.target.value)}
                className="flex-1 bg-transparent font-mono tabular-nums text-lg font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {PRESET_USD.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUsdAmountStr(String(preset))}
                  className={`py-2 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                    Number(usdAmountStr) === preset
                      ? 'bg-[#0500FF]/10 text-[#0500FF] dark:bg-[#6B8AFF]/15 dark:text-[#93B4FF]'
                      : 'bg-slate-100 dark:bg-[#1B2332] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Payment Method</span>
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                <CreditCard className="w-3.5 h-3.5" />
                Apple Pay / Debit Card
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>On-Ramp Fee (1.2%)</span>
              <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                {formatFiat(feeUsd, currency)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">You Receive</span>
              <span className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-white">
                {formatTokenAmount(tokenAmount, 6)} {asset.symbol}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={usdAmount < 10}
            className="w-full h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authorize Purchase</span>
          </button>
        </form>
      </div>
    </div>
  );
};
