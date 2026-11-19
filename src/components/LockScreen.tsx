import React, { useCallback, useEffect, useState } from 'react';
import { Delete, Fingerprint, Lock } from 'lucide-react';
import { SecuritySettings } from '../types/wallet';
import { verifyBiometricPasskey, verifyPinHash } from '../utils/cryptoVault';
import { TrustShieldLogo } from './ChainIcon';

interface LockScreenProps {
  walletName: string;
  security: SecuritySettings;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  walletName,
  security,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const handlePinDigit = useCallback(
    async (digit: string) => {
      if (pin.length >= 6) return;
      const next = pin + digit;
      setPin(next);
      setError(null);

      if (next.length === 6) {
        const ok = await verifyPinHash(next, security.pinHash);
        if (ok) {
          onUnlock();
        } else {
          setError('Incorrect PIN. Default demo PIN is 123456.');
          setPin('');
        }
      }
    },
    [pin, security.pinHash, onUnlock]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        void handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePinDigit]);

  const handleBiometricUnlock = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await verifyBiometricPasskey(security.passkeyCredentialId);
      if (res.verified) {
        onUnlock();
      } else {
        setError('Biometric verification cancelled. Enter your 6-digit PIN.');
      }
    } catch {
      setError('Biometric prompt unavailable. Please enter your 6-digit PIN.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F17] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <TrustShieldLogo className="w-12 h-12 mb-4" />
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">
            TrustVault Locked
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {walletName} · Encrypted local vault
          </p>
        </div>

        {security.biometricEnabled && (
          <div className="mt-6">
            <button
              type="button"
              disabled={scanning}
              onClick={() => void handleBiometricUnlock()}
              className="w-full h-12 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <Fingerprint className="w-5 h-5" />
              <span>{scanning ? 'Verifying Biometrics...' : 'Unlock with Biometrics'}</span>
            </button>
          </div>
        )}

        <div className="mt-7">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Or enter 6-digit vault PIN</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-5">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  idx < pin.length
                    ? 'bg-[#0500FF] border-[#0500FF] dark:bg-[#6B8AFF] dark:border-[#6B8AFF]'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => void handlePinDigit(digit)}
                className="h-12 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-lg font-medium transition-colors cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => void handlePinDigit('0')}
              className="h-12 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-lg font-medium transition-colors cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((prev) => prev.slice(0, -1))}
              className="h-12 rounded-xl bg-slate-100 dark:bg-[#1B2332] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <p className="mt-4 text-xs text-center text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          )}

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Default demo PIN: <span className="font-mono font-medium">123456</span>
          </p>
        </div>
      </div>
    </div>
  );
};
