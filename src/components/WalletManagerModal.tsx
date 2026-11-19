import React, { useState } from 'react';
import { Check, Download, Plus, Shield, Wallet, X } from 'lucide-react';
import { WalletAccount } from '../types/wallet';
import { formatFiat } from '../utils/formatters';
import { generateMnemonic12, validateMnemonic } from '../utils/cryptoVault';

interface WalletManagerModalProps {
  isOpen: boolean;
  wallets: WalletAccount[];
  activeWalletId: string;
  onSelectWallet: (walletId: string) => void;
  onCreateWallet: (name: string, mnemonic: string, emptyStart: boolean) => Promise<void>;
  onClose: () => void;
}

export const WalletManagerModal: React.FC<WalletManagerModalProps> = ({
  isOpen,
  wallets,
  activeWalletId,
  onSelectWallet,
  onCreateWallet,
  onClose,
}) => {
  const [tab, setTab] = useState<'list' | 'create' | 'import'>('list');
  const [newWalletName, setNewWalletName] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState(() => generateMnemonic12());
  const [importPhrase, setImportPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const label = newWalletName.trim() || `Vault #${wallets.length + 1}`;
      await onCreateWallet(label, generatedMnemonic, false);
      setNewWalletName('');
      setGeneratedMnemonic(generateMnemonic12());
      setTab('list');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMnemonic(importPhrase)) {
      setError('Please enter a valid 12-word or 24-word recovery phrase.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const label = newWalletName.trim() || `Imported Vault #${wallets.length + 1}`;
      await onCreateWallet(label, importPhrase.trim().toLowerCase(), false);
      setNewWalletName('');
      setImportPhrase('');
      setTab('list');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-mgr-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="wallet-mgr-title"
            className="text-base font-display font-semibold text-slate-900 dark:text-slate-100"
          >
            Multi-Chain Wallets
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close wallet manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1B2332] rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('list');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'list'
                  ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              My Wallets ({wallets.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('create');
                setGeneratedMnemonic(generateMnemonic12());
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'create'
                  ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Create New
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('import');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'import'
                  ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Import Phrase
            </button>
          </div>

          {tab === 'list' && (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {wallets.map((w) => {
                const total = w.assets.reduce((sum, a) => sum + a.balance * a.priceUsd, 0);
                const isActive = w.id === activeWalletId;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      onSelectWallet(w.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[#0500FF] dark:border-[#6B8AFF] bg-[#0500FF]/5 dark:bg-[#6B8AFF]/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1B2332]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#0500FF]/10 dark:bg-[#6B8AFF]/15 text-[#0500FF] dark:text-[#7AA2FF] flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {w.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {w.addresses.ethereum.slice(0, 8)}...{w.addresses.ethereum.slice(-6)} · 8 Chains
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatFiat(total)}
                      </span>
                      {isActive && (
                        <Check className="w-4 h-4 text-[#0500FF] dark:text-[#6B8AFF]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'create' && (
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="new-wallet-name"
                  className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Wallet Name
                </label>
                <input
                  id="new-wallet-name"
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder={`Vault #${wallets.length + 1}`}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Generated 12-Word Secret Phrase (BIP-39)
                  </span>
                  <button
                    type="button"
                    onClick={() => setGeneratedMnemonic(generateMnemonic12())}
                    className="text-xs font-medium text-[#0500FF] dark:text-[#6B8AFF] hover:underline cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
                  {generatedMnemonic.split(' ').map((word, idx) => (
                    <div
                      key={`${word}-${idx}`}
                      className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-[#131924] px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800"
                    >
                      <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                      {word}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Shield className="w-4 h-4 text-[#0500FF] dark:text-[#6B8AFF] shrink-0" />
                <span>Keys are derived locally across Ethereum, Bitcoin, Solana, BSC, and 4 L2s.</span>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{busy ? 'Deriving HD Keys...' : 'Create Multi-Chain Wallet'}</span>
              </button>
            </form>
          )}

          {tab === 'import' && (
            <form onSubmit={(e) => void handleImport(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="import-wallet-name"
                  className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Wallet Label
                </label>
                <input
                  id="import-wallet-name"
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder={`Imported Vault #${wallets.length + 1}`}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
                />
              </div>

              <div>
                <label
                  htmlFor="import-mnemonic-input"
                  className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  12 or 24-Word Secret Recovery Phrase
                </label>
                <textarea
                  id="import-mnemonic-input"
                  rows={3}
                  value={importPhrase}
                  onChange={(e) => {
                    setImportPhrase(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your 12 or 24 recovery words separated by spaces..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{busy ? 'Restoring Accounts...' : 'Import Multi-Chain Wallet'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
