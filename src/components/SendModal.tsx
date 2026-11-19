import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ShieldCheck, X } from 'lucide-react';
import { Asset, CurrencyCode, GasSpeed, WalletAccount } from '../types/wallet';
import { CHAINS } from '../data/chainsAndTokens';
import { validateChainAddress } from '../utils/cryptoVault';
import { formatFiat, formatTokenAmount } from '../utils/formatters';
import { TokenIcon } from './ChainIcon';

interface SendModalProps {
  isOpen: boolean;
  wallet: WalletAccount;
  initialAssetId?: string;
  currency: CurrencyCode;
  requireBiometric: boolean;
  onClose: () => void;
  onRequestSend: (payload: {
    asset: Asset;
    recipient: string;
    amount: number;
    gasFeeNative: number;
    gasSpeed: GasSpeed;
  }) => void;
}

const GAS_MULTIPLIER: Record<GasSpeed, number> = {
  slow: 0.75,
  standard: 1.0,
  fast: 1.45,
};

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  wallet,
  initialAssetId,
  currency,
  requireBiometric,
  onClose,
  onRequestSend,
}) => {
  const sendableAssets = useMemo(
    () => wallet.assets.filter((a) => a.balance > 0),
    [wallet.assets]
  );

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialAssetId || sendableAssets[0]?.id || wallet.assets[0]?.id || ''
  );
  const [recipient, setRecipient] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [gasSpeed, setGasSpeed] = useState<GasSpeed>('standard');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAssetId(
        initialAssetId || sendableAssets[0]?.id || wallet.assets[0]?.id || ''
      );
      setRecipient('');
      setAmountStr('');
      setGasSpeed('standard');
      setError(null);
    }
  }, [isOpen, initialAssetId, sendableAssets, wallet.assets]);

  const asset = useMemo(
    () => wallet.assets.find((a) => a.id === selectedAssetId) || wallet.assets[0],
    [wallet.assets, selectedAssetId]
  );

  if (!isOpen || !asset) return null;

  const chain = CHAINS[asset.chainId];
  const nativeGasAsset = wallet.assets.find(
    (a) => a.chainId === asset.chainId && a.isNative
  );
  const gasFeeNative = chain.baseGasFeeNative * GAS_MULTIPLIER[gasSpeed];
  const gasFeeUsd = gasFeeNative * (nativeGasAsset?.priceUsd ?? 0);
  const parsedAmount = parseFloat(amountStr) || 0;
  const maxAvailable = asset.isNative
    ? Math.max(0, asset.balance - gasFeeNative)
    : asset.balance;

  const fillPresetAddress = () => {
    if (asset.chainId === 'bitcoin') {
      setRecipient('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    } else if (asset.chainId === 'solana') {
      setRecipient('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    } else {
      setRecipient('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc');
    }
    setError(null);
  };

  const handlePercentage = (pct: number) => {
    const val = maxAvailable * pct;
    setAmountStr(val > 0 ? Number(val.toFixed(6)).toString() : '0');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateChainAddress(asset.chainId, recipient)) {
      setError(
        `Enter a valid ${chain.name} address (${
          asset.chainId === 'bitcoin'
            ? 'bc1... or 1.../3...'
            : asset.chainId === 'solana'
            ? 'Base58 Solana address'
            : '0x... 42-char hex'
        }).`
      );
      return;
    }
    if (parsedAmount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (parsedAmount > maxAvailable + 1e-9) {
      setError(`Insufficient ${asset.symbol} balance after network gas fee.`);
      return;
    }
    if (!asset.isNative && nativeGasAsset && nativeGasAsset.balance < gasFeeNative) {
      setError(`Insufficient ${chain.nativeSymbol} to pay network gas fees.`);
      return;
    }

    onRequestSend({
      asset,
      recipient: recipient.trim(),
      amount: parsedAmount,
      gasFeeNative,
      gasSpeed,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="send-modal-title"
            className="text-base font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            Send Crypto
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close send modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="send-asset-select"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Asset & Network
            </label>
            <div className="relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17]">
              <TokenIcon symbol={asset.symbol} chainId={asset.chainId} size={32} />
              <select
                id="send-asset-select"
                value={asset.id}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setError(null);
                }}
                className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {wallet.assets.map((a) => (
                  <option key={a.id} value={a.id} className="bg-white dark:bg-[#131924]">
                    {a.symbol} · {CHAINS[a.chainId].name} (Bal: {formatTokenAmount(a.balance, 4)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="send-recipient-input"
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Recipient {chain.name} Address
              </label>
              <button
                type="button"
                onClick={fillPresetAddress}
                className="text-xs font-medium text-[#0500FF] dark:text-[#6B8AFF] hover:underline cursor-pointer"
              >
                Use Sample Contact
              </button>
            </div>
            <input
              id="send-recipient-input"
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setError(null);
              }}
              placeholder={
                asset.chainId === 'bitcoin'
                  ? 'bc1q...'
                  : asset.chainId === 'solana'
                  ? 'Solana Base58 address'
                  : '0x...'
              }
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="send-amount-input"
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Amount
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Available: {formatTokenAmount(maxAvailable, 6)} {asset.symbol}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3.5 py-2 focus-within:ring-2 focus-within:ring-[#0500FF]/30">
              <input
                id="send-amount-input"
                type="number"
                step="any"
                min="0"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="flex-1 bg-transparent font-mono tabular-nums text-lg font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {asset.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                ≈ {formatFiat(parsedAmount * asset.priceUsd, currency)}
              </span>
              <div className="flex items-center gap-1.5">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {pct === 1 ? 'MAX' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Network Gas Speed
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                {formatTokenAmount(gasFeeNative, 6)} {chain.nativeSymbol} · {formatFiat(gasFeeUsd, currency)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#1B2332] rounded-xl">
              {(['slow', 'standard', 'fast'] as GasSpeed[]).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setGasSpeed(spd)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                    gasSpeed === spd
                      ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {requireBiometric ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
            <span>{requireBiometric ? 'Verify Biometrics & Send' : 'Confirm & Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
