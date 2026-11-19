import React, { useState } from 'react';
import { Coins, ShieldCheck, X } from 'lucide-react';
import {
  CurrencyCode,
  StakingOffer,
  StakingPosition,
  WalletAccount,
} from '../types/wallet';
import { CHAINS, STAKING_OFFERS } from '../data/chainsAndTokens';
import { formatFiat, formatTokenAmount } from '../utils/formatters';
import { TokenIcon } from './ChainIcon';

interface EarnViewProps {
  wallet: WalletAccount;
  currency: CurrencyCode;
  hideBalances: boolean;
  onStake: (offer: StakingOffer, amount: number) => void;
  onUnstake: (position: StakingPosition) => void;
  onClaimReward: (position: StakingPosition) => void;
}

export const EarnView: React.FC<EarnViewProps> = ({
  wallet,
  currency,
  hideBalances,
  onStake,
  onUnstake,
  onClaimReward,
}) => {
  const [selectedOffer, setSelectedOffer] = useState<StakingOffer | null>(null);
  const [stakeAmountStr, setStakeAmountStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalStakedUsd = wallet.stakingPositions.reduce((sum, pos) => {
    const asset = wallet.assets.find((a) => a.id === pos.assetId);
    return sum + pos.stakedAmount * (asset?.priceUsd ?? 0);
  }, 0);

  const totalRewardsUsd = wallet.stakingPositions.reduce((sum, pos) => {
    const asset = wallet.assets.find((a) => a.id === pos.assetId);
    return sum + pos.earnedRewards * (asset?.priceUsd ?? 0);
  }, 0);

  const openStakeModal = (offer: StakingOffer) => {
    setSelectedOffer(offer);
    setStakeAmountStr('');
    setError(null);
  };

  const selectedAsset = selectedOffer
    ? wallet.assets.find((a) => a.id === selectedOffer.assetId)
    : null;

  const handleStakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !selectedAsset) return;
    const amount = parseFloat(stakeAmountStr) || 0;
    if (amount < selectedOffer.minStake) {
      setError(`Minimum stake is ${selectedOffer.minStake} ${selectedOffer.symbol}.`);
      return;
    }
    if (amount > selectedAsset.balance) {
      setError(`Insufficient ${selectedOffer.symbol} balance.`);
      return;
    }
    onStake(selectedOffer, amount);
    setSelectedOffer(null);
  };

  return (
    <div className="space-y-6">
      {/* Top summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Active Staked Value</div>
          <div className="mt-1.5 text-2xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatFiat(totalStakedUsd, currency, hideBalances)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {wallet.stakingPositions.length} active validator{wallet.stakingPositions.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Accrued Staking Yield</div>
          <div className="mt-1.5 text-2xl font-display font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatFiat(totalRewardsUsd, currency, hideBalances)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ready to claim directly to wallet
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Custody Model</div>
          <div className="mt-1.5 text-lg font-display font-bold text-slate-900 dark:text-white">
            Non-Custodial Delegation
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Keys remain in your biometric vault
          </div>
        </div>
      </div>

      {/* Active positions */}
      {wallet.stakingPositions.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
              Your Staked Positions
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {wallet.stakingPositions.map((pos) => {
              const asset = wallet.assets.find((a) => a.id === pos.assetId);
              const usdVal = pos.stakedAmount * (asset?.priceUsd ?? 0);
              return (
                <div
                  key={pos.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <TokenIcon symbol={pos.symbol} chainId={pos.chainId} size={38} />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {pos.symbol} · {CHAINS[pos.chainId].name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {pos.validatorName} ·{' '}
                        <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                          {pos.apy.toFixed(2)}% APY
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <div className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-white">
                        {formatTokenAmount(pos.stakedAmount, 4, hideBalances)} {pos.symbol}
                      </div>
                      <div className="font-mono tabular-nums text-xs text-emerald-600 dark:text-emerald-400">
                        +{formatTokenAmount(pos.earnedRewards, 5, hideBalances)} {pos.symbol} earned ({formatFiat(usdVal, currency, hideBalances)})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pos.earnedRewards > 0 && (
                        <button
                          type="button"
                          onClick={() => onClaimReward(pos)}
                          className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Claim Yield
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onUnstake(pos)}
                        className="h-9 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1B2332] text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Unstake
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available staking offers */}
      <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
            Native Validator Opportunities
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Delegate assets across Proof-of-Stake networks to earn compounding protocol rewards
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {STAKING_OFFERS.map((offer) => {
            const asset = wallet.assets.find((a) => a.id === offer.assetId);
            const balance = asset?.balance ?? 0;
            return (
              <div
                key={offer.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-[#1B2332]/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <TokenIcon symbol={offer.symbol} chainId={offer.chainId} size={38} />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {offer.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {offer.validatorName} · Lockup: {offer.lockupDays === 0 ? 'Liquid' : `${offer.lockupDays}d`} · Available:{' '}
                      <span className="font-mono tabular-nums">
                        {formatTokenAmount(balance, 4, hideBalances)} {offer.symbol}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-left sm:text-right">
                    <div className="font-mono tabular-nums text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {offer.apy.toFixed(2)}% APY
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Min {offer.minStake} {offer.symbol}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openStakeModal(offer)}
                    className="h-10 px-4 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Stake {offer.symbol}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stake Modal */}
      {selectedOffer && selectedAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stake-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3
                id="stake-modal-title"
                className="text-base font-display font-semibold text-slate-900 dark:text-white"
              >
                Stake {selectedOffer.symbol}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close stake modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStakeSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Validator: {selectedOffer.validatorName}</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedOffer.apy.toFixed(2)}% APY
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <label htmlFor="stake-amount-input" className="text-slate-500 dark:text-slate-400">
                    Amount to Delegate
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setStakeAmountStr(
                        Number(Math.max(0, selectedAsset.balance - 0.01).toFixed(4)).toString()
                      )
                    }
                    className="font-mono text-[#0500FF] dark:text-[#6B8AFF] hover:underline cursor-pointer"
                  >
                    Max: {formatTokenAmount(selectedAsset.balance, 4)} {selectedOffer.symbol}
                  </button>
                </div>
                <input
                  id="stake-amount-input"
                  type="number"
                  step="any"
                  min="0"
                  value={stakeAmountStr}
                  onChange={(e) => {
                    setStakeAmountStr(e.target.value);
                    setError(null);
                  }}
                  placeholder={`Min ${selectedOffer.minStake} ${selectedOffer.symbol}`}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] font-mono text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Biometrics & Delegate</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
