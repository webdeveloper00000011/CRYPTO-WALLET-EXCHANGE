import React, { useCallback, useEffect, useState } from 'react';
import { Fingerprint, KeyRound, ShieldCheck, X, Delete } from 'lucide-react';
import { SecuritySettings } from '../types/wallet';
import { verifyBiometricPasskey, verifyPinHash } from '../utils/cryptoVault';

interface BiometricAuthModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  actionLabel: string;
  security: SecuritySettings;
  onVerified: () => void;
  onCancel: () => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  title,
  subtitle,
  actionLabel,
  security,
  onVerified,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'biometric' | 'pin'>(
    security.biometricEnabled ? 'biometric' : 'pin'
  );
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setScanning(false);
      setMode(security.biometricEnabled ? 'biometric' : 'pin');
    }
  }, [isOpen, security.biometricEnabled]);

  const handlePinDigit = useCallback(
    async (digit: string) => {
      if (pin.length >= 6) return;
      const next = pin + digit;
      setPin(next);
      setError(null);

      if (next.length === 6) {
        const ok = await verifyPinHash(next, security.pinHash);
        if (ok) {
          onVerified();
        } else {
          setError('Incorrect 6-digit PIN. Default demo PIN is 123456.');
          setPin('');
        }
      }
    },
    [pin, security.pinHash, onVerified]
  );

  useEffect(() => {
    if (!isOpen || mode !== 'pin') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        void handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, mode, handlePinDigit, onCancel]);

  const triggerBiometricScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const result = await verifyBiometricPasskey(security.passkeyCredentialId);
      if (result.verified) {
        onVerified();
      } else {
        setError('Biometric check did not complete. Please enter your Vault PIN.');
        setMode('pin');
      }
    } catch {
      setError('Biometric verification failed. Use your 6-digit PIN instead.');
      setMode('pin');
    } finally {
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="biometric-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0500FF] dark:text-[#6B8AFF]" />
            <h2
              id="biometric-modal-title"
              className="text-base font-display font-semibold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cancel authentication"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-5">
            {subtitle}
          </p>

          {security.biometricEnabled && (
            <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 dark:bg-[#1B2332] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('biometric');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'biometric'
                    ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Biometric Passkey
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('pin');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'pin'
                    ? 'bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                6-Digit PIN
              </button>
            </div>
          )}

          {mode === 'biometric' ? (
            <div className="flex flex-col items-center py-2">
              <button
                type="button"
                disabled={scanning}
                onClick={() => void triggerBiometricScan()}
                className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-transform cursor-pointer ${
                  scanning
                    ? 'border-[#0500FF] bg-[#0500FF]/10 scale-95'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1B2332] hover:border-[#0500FF] dark:hover:border-[#6B8AFF] hover:scale-[1.03]'
                }`}
                aria-label="Verify with biometrics"
              >
                <Fingerprint
                  className={`w-12 h-12 ${
                    scanning
                      ? 'text-[#0500FF] dark:text-[#6B8AFF]'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                />
              </button>

              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                {scanning
                  ? 'Verifying device credential...'
                  : security.passkeyDeviceLabel || 'Platform Biometric Enclave'}
              </p>

              <button
                type="button"
                disabled={scanning}
                onClick={() => void triggerBiometricScan()}
                className="mt-5 w-full h-11 rounded-xl bg-[#0500FF] hover:bg-[#0400D6] disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                {scanning ? 'Verifying Biometrics...' : actionLabel}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-3 mb-5" aria-label="PIN entry dots">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                      index < pin.length
                        ? 'bg-[#0500FF] border-[#0500FF] dark:bg-[#6B8AFF] dark:border-[#6B8AFF]'
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
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
                <div className="flex items-center justify-center text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
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
                  aria-label="Delete last digit"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Type or tap your 6-digit PIN (Default: 123456)
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 text-xs text-center text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
