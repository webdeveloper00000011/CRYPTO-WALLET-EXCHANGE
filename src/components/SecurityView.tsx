import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import {
  CurrencyCode,
  SecuritySettings,
  ThemeMode,
  WalletAccount,
} from '../types/wallet';
import { enrollBiometricPasskey, hashPin } from '../utils/cryptoVault';

interface SecurityViewProps {
  wallet: WalletAccount;
  security: SecuritySettings;
  onUpdateSecurity: (patch: Partial<SecuritySettings>) => void;
  onRequestAuth: (
    title: string,
    subtitle: string,
    actionLabel: string,
    onSuccess: () => void
  ) => void;
  onLockNow: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  wallet,
  security,
  onUpdateSecurity,
  onRequestAuth,
  onLockNow,
}) => {
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string | null>(null);
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  const handleEnrollBiometrics = async () => {
    setEnrolling(true);
    setEnrollStatus(null);
    try {
      const result = await enrollBiometricPasskey(wallet.name);
      onUpdateSecurity({
        biometricEnabled: true,
        passkeyCredentialId: result.credentialId,
        passkeyDeviceLabel: result.deviceLabel,
        passkeyRegisteredAt: Date.now(),
      });
      setEnrollStatus(`Enrolled: ${result.deviceLabel}`);
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleBiometric = () => {
    if (security.biometricEnabled) {
      onRequestAuth(
        'Disable Biometric Authentication',
        'Verify your identity before disabling biometric passkey protection.',
        'Confirm Disable',
        () => {
          onUpdateSecurity({ biometricEnabled: false });
          setEnrollStatus('Biometric passkey disabled. Vault uses 6-digit PIN.');
        }
      );
    } else {
      void handleEnrollBiometrics();
    }
  };

  const handleRevealPhrase = () => {
    if (phraseRevealed) {
      setPhraseRevealed(false);
      return;
    }
    onRequestAuth(
      'Reveal Secret Recovery Phrase',
      'Anyone with these 12 words can control your multi-chain assets. Verify biometrics or PIN to decrypt.',
      'Decrypt Recovery Phrase',
      () => {
        setPhraseRevealed(true);
      }
    );
  };

  const handleCopyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(wallet.mnemonic);
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      setPinMsg('PIN must be exactly 6 numeric digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinMsg('PIN confirmation does not match.');
      return;
    }
    const targetPin = newPin;
    onRequestAuth(
      'Authorize PIN Change',
      'Verify your current PIN or biometric credential to set a new 6-digit vault PIN.',
      'Confirm PIN Update',
      () => {
        void hashPin(targetPin).then((hashed) => {
          onUpdateSecurity({ pinHash: hashed });
          setNewPin('');
          setConfirmPin('');
          setPinMsg('Vault PIN updated and hashed with SHA-256.');
        });
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Biometric & Recovery Controls */}
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0500FF]/10 dark:bg-[#6B8AFF]/15 text-[#0500FF] dark:text-[#7AA2FF] flex items-center justify-center shrink-0">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  Biometric Authentication (WebAuthn Passkey)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {security.biometricEnabled
                    ? `Active · ${security.passkeyDeviceLabel || 'Platform Biometric Enclave'}`
                    : 'Disabled · Using 6-digit PIN fallback only'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleBiometric}
              disabled={enrolling}
              className={`h-10 px-4 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                security.biometricEnabled
                  ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1B2332]'
                  : 'bg-[#0500FF] hover:bg-[#0400D6] text-white'
              }`}
            >
              {enrolling
                ? 'Enrolling...'
                : security.biometricEnabled
                ? 'Disable'
                : 'Enable Biometrics'}
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Require Verification for Swaps
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Prompt biometric or PIN signing before cross-chain or DEX swaps
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={security.requireAuthForSwap}
                onClick={() =>
                  onUpdateSecurity({ requireAuthForSwap: !security.requireAuthForSwap })
                }
                className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
                  security.requireAuthForSwap
                    ? 'bg-[#0500FF]'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    security.requireAuthForSwap ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Require Verification for Outgoing Transfers
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Gate all Send transactions behind device authentication
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={security.requireAuthForSend}
                onClick={() =>
                  onUpdateSecurity({ requireAuthForSend: !security.requireAuthForSend })
                }
                className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
                  security.requireAuthForSend
                    ? 'bg-[#0500FF]'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    security.requireAuthForSend ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="button"
                onClick={() => void handleEnrollBiometrics()}
                disabled={enrolling}
                className="text-xs font-medium text-[#0500FF] dark:text-[#6B8AFF] hover:underline cursor-pointer"
              >
                Register New Device Passkey
              </button>
              {enrollStatus && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {enrollStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secret Recovery Phrase Vault */}
        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900 dark:text-white">
                  Secret Recovery Phrase ({wallet.name})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  12-word BIP-39 master key backing all 8 blockchain addresses
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRevealPhrase}
              className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {phraseRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{phraseRevealed ? 'Hide Phrase' : 'Reveal Phrase'}</span>
            </button>
          </div>

          {phraseRevealed ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
                {wallet.mnemonic.split(' ').map((word, idx) => (
                  <div
                    key={`${word}-${idx}`}
                    className="font-mono text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2"
                  >
                    <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                    {word}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Never share these words. Store offline in a secure location.
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopyPhrase()}
                  className="text-xs font-medium text-[#0500FF] dark:text-[#6B8AFF] flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  {copiedPhrase ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhrase ? 'Copied' : 'Copy Phrase'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>••••••••••••••••••••••••••••••••••••••••••••</span>
              <span>Protected by Vault Lock</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: PIN, Auto-Lock, Theme & Currency */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <KeyRound className="w-4 h-4 text-[#0500FF] dark:text-[#6B8AFF]" />
            <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
              Vault PIN & Auto-Lock
            </h3>
          </div>

          <form onSubmit={(e) => void handleUpdatePin(e)} className="space-y-3">
            <div>
              <label
                htmlFor="new-pin-input"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                New 6-Digit PIN
              </label>
              <input
                id="new-pin-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, ''));
                  setPinMsg(null);
                }}
                placeholder="••••••"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-pin-input"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                Confirm New PIN
              </label>
              <input
                id="confirm-pin-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ''));
                  setPinMsg(null);
                }}
                placeholder="••••••"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0500FF]/30"
              />
            </div>

            {pinMsg && (
              <p className="text-xs font-medium text-[#0500FF] dark:text-[#7AA2FF]">
                {pinMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-slate-900 dark:bg-[#0500FF] hover:opacity-90 text-white text-xs font-medium transition-opacity cursor-pointer"
            >
              Update 6-Digit PIN
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Auto-Lock Timeout
              </span>
              <select
                aria-label="Auto-lock timeout"
                value={security.autoLockMinutes}
                onChange={(e) =>
                  onUpdateSecurity({ autoLockMinutes: Number(e.target.value) })
                }
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={0}>Manual Only</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onLockNow}
              className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1B2332] text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Vault Immediately</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-display font-semibold text-slate-900 dark:text-white">
            Preferences
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Appearance
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1B2332] rounded-lg">
              {(['light', 'dark'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSecurity({ theme: mode })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 capitalize transition-colors cursor-pointer ${
                    security.theme === mode
                      ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {mode === 'light' ? (
                    <Sun className="w-3.5 h-3.5" />
                  ) : (
                    <Moon className="w-3.5 h-3.5" />
                  )}
                  <span>{mode}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Display Fiat Currency
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1B2332] rounded-lg">
              {(['USD', 'EUR', 'GBP'] as CurrencyCode[]).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => onUpdateSecurity({ currency: curr })}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                    security.currency === curr
                      ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
