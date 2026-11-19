import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, AlertTriangle, X } from 'lucide-react';
import { ChainId, WalletAccount } from '../types/wallet';
import { CHAINS, CHAIN_LIST } from '../data/chainsAndTokens';
import { ChainBadgeIcon } from './ChainIcon';

interface ReceiveModalProps {
  isOpen: boolean;
  wallet: WalletAccount;
  initialChainId?: ChainId;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  isOpen,
  wallet,
  initialChainId = 'ethereum',
  onClose,
}) => {
  const [selectedChain, setSelectedChain] = useState<ChainId>(initialChainId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedChain(initialChainId);
      setCopied(false);
    }
  }, [isOpen, initialChainId]);

  const address = wallet.addresses[selectedChain];
  const chain = CHAINS[selectedChain];

  useEffect(() => {
    if (!isOpen || !address) return;
    let active = true;
    QRCode.toDataURL(address, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0D111C',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isOpen, address]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receive-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="receive-modal-title"
            className="text-base font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            Receive Digital Assets
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close receive modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label
              htmlFor="receive-chain-select"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2"
            >
              Blockchain Network
            </label>
            <div className="grid grid-cols-4 gap-2" id="receive-chain-select">
              {CHAIN_LIST.map((item) => {
                const active = item.id === selectedChain;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedChain(item.id);
                      setCopied(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'border-[#0500FF] dark:border-[#6B8AFF] bg-[#0500FF]/5 dark:bg-[#6B8AFF]/10 text-[#0500FF] dark:text-[#93B4FF]'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1B2332] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <ChainBadgeIcon chainId={item.id} size={22} />
                    <span className="truncate max-w-full">{item.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center p-5 rounded-2xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${chain.name} wallet deposit QR code`}
                  className="w-44 h-44 block"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="mt-4 w-full text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {chain.name} · {chain.standardLabel}
              </div>
              <div className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 select-all">
                {address}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleCopy()}
              className="mt-3 w-full h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Address Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy {chain.shortName} Address</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Send only <span className="font-semibold">{chain.name} ({chain.standardLabel})</span> assets to this address. Sending assets from an incompatible network may result in permanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
