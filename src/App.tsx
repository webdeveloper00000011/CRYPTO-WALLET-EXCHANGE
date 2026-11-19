import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeftRight,
  ChevronDown,
  Coins,
  LayoutGrid,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  Wallet,
} from 'lucide-react';
import {
  Asset,
  AuthChallengeRequest,
  ChainId,
  GasSpeed,
  NavTab,
  SecuritySettings,
  StakingOffer,
  StakingPosition,
  Transaction,
  WalletAccount,
} from './types/wallet';
import {
  CHAINS,
  createInitialAssets,
  createInitialStakingPositions,
  createInitialTransactions,
} from './data/chainsAndTokens';
import {
  deriveMultiChainAddresses,
  generateMnemonic12,
  generateTxHash,
  hashPin,
} from './utils/cryptoVault';
import { TrustShieldLogo } from './components/ChainIcon';
import { PortfolioView } from './components/PortfolioView';
import { SwapView } from './components/SwapView';
import { ActivityView } from './components/ActivityView';
import { EarnView } from './components/EarnView';
import { SecurityView } from './components/SecurityView';
import { BiometricAuthModal } from './components/BiometricAuthModal';
import { LockScreen } from './components/LockScreen';
import { ReceiveModal } from './components/ReceiveModal';
import { SendModal } from './components/SendModal';
import { BuyModal } from './components/BuyModal';
import { WalletManagerModal } from './components/WalletManagerModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';

const STORAGE_KEYS = {
  wallets: 'trustvault_wallets_v1',
  activeWalletId: 'trustvault_active_wallet_v1',
  security: 'trustvault_security_v1',
};

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'portfolio', label: 'Portfolio', icon: LayoutGrid },
  { id: 'swap', label: 'Swap', icon: ArrowLeftRight },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'earn', label: 'Earn', icon: Coins },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

export default function App() {
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string>('');
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('portfolio');

  // Modals & Selection State
  const [authChallenge, setAuthChallenge] = useState<AuthChallengeRequest | null>(null);
  const [receiveModalChain, setReceiveModalChain] = useState<ChainId | null>(null);
  const [sendModalAssetId, setSendModalAssetId] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [walletMgrOpen, setWalletMgrOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [swapInitialAssetId, setSwapInitialAssetId] = useState<string | undefined>(undefined);
  const [lastSwapMessage, setLastSwapMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Bootstrap initial wallets & SHA-256 PIN hash
  useEffect(() => {
    let mounted = true;

    async function initVault() {
      const savedWalletsRaw = localStorage.getItem(STORAGE_KEYS.wallets);
      const savedSecurityRaw = localStorage.getItem(STORAGE_KEYS.security);
      const savedActiveId = localStorage.getItem(STORAGE_KEYS.activeWalletId);

      let initialSecurity: SecuritySettings;
      if (savedSecurityRaw) {
        initialSecurity = JSON.parse(savedSecurityRaw) as SecuritySettings;
      } else {
        const defaultHash = await hashPin('123456');
        initialSecurity = {
          biometricEnabled: true,
          passkeyCredentialId: null,
          passkeyDeviceLabel: 'Platform Biometric Enclave',
          passkeyRegisteredAt: null,
          pinHash: defaultHash,
          autoLockMinutes: 5,
          requireAuthForSwap: true,
          requireAuthForSend: true,
          hideBalances: false,
          theme: 'light',
          currency: 'USD',
        };
      }

      let initialWallets: WalletAccount[];
      if (savedWalletsRaw) {
        initialWallets = JSON.parse(savedWalletsRaw) as WalletAccount[];
      } else {
        const mnemonic =
          'shield anchor crypto vault orbit timber solar matrix velvet ridge pulse quantum';
        const addresses = await deriveMultiChainAddresses(mnemonic, 0);
        initialWallets = [
          {
            id: 'wallet-main-1',
            name: 'Main Multi-Chain Vault',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 32,
            mnemonic,
            addresses,
            assets: createInitialAssets(false),
            transactions: createInitialTransactions(addresses),
            stakingPositions: createInitialStakingPositions(),
          },
        ];
      }

      if (!mounted) return;
      setSecurity(initialSecurity);
      setWallets(initialWallets);
      setActiveWalletId(
        savedActiveId && initialWallets.some((w) => w.id === savedActiveId)
          ? savedActiveId
          : initialWallets[0].id
      );
    }

    void initVault();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist wallets & security settings
  useEffect(() => {
    if (wallets.length > 0) {
      localStorage.setItem(STORAGE_KEYS.wallets, JSON.stringify(wallets));
    }
  }, [wallets]);

  useEffect(() => {
    if (activeWalletId) {
      localStorage.setItem(STORAGE_KEYS.activeWalletId, activeWalletId);
    }
  }, [activeWalletId]);

  useEffect(() => {
    if (!security) return;
    localStorage.setItem(STORAGE_KEYS.security, JSON.stringify(security));
    document.documentElement.classList.toggle('dark', security.theme === 'dark');
  }, [security]);

  // Auto-lock inactivity monitor
  useEffect(() => {
    if (!security || security.autoLockMinutes <= 0 || isLocked) return;
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener('pointerdown', markActive);
    window.addEventListener('keydown', markActive);

    const interval = window.setInterval(() => {
      const elapsedMin = (Date.now() - lastActivityRef.current) / 60000;
      if (elapsedMin >= security.autoLockMinutes) {
        setIsLocked(true);
      }
    }, 15000);

    return () => {
      window.removeEventListener('pointerdown', markActive);
      window.removeEventListener('keydown', markActive);
      window.clearInterval(interval);
    };
  }, [security, isLocked]);

  // Subtle live market price micro-ticks (non-stablecoins)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setWallets((prev) =>
        prev.map((w) => ({
          ...w,
          assets: w.assets.map((asset) => {
            if (asset.symbol === 'USDC' || asset.symbol === 'USDT') return asset;
            const delta = (Math.random() - 0.495) * 0.0024;
            const nextPrice = Math.max(0.01, asset.priceUsd * (1 + delta));
            return {
              ...asset,
              priceUsd: nextPrice,
            };
          }),
        }))
      );
    }, 12000);
    return () => window.clearInterval(timer);
  }, []);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId) || wallets[0] || null,
    [wallets, activeWalletId]
  );

  const selectedAsset = useMemo(
    () => activeWallet?.assets.find((a) => a.id === selectedAssetId) || null,
    [activeWallet, selectedAssetId]
  );

  const updateActiveWallet = useCallback(
    (updater: (wallet: WalletAccount) => WalletAccount) => {
      setWallets((prev) =>
        prev.map((w) => (w.id === activeWalletId ? updater(w) : w))
      );
    },
    [activeWalletId]
  );

  const updateSecurity = useCallback((patch: Partial<SecuritySettings>) => {
    setSecurity((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const requestAuth = useCallback(
    (
      title: string,
      subtitle: string,
      actionLabel: string,
      onSuccess: () => void
    ) => {
      setAuthChallenge({ title, subtitle, actionLabel, onSuccess });
    },
    []
  );

  // Create or import HD wallet
  const handleCreateWallet = async (
    name: string,
    mnemonic: string,
    emptyStart: boolean
  ) => {
    const cleanMnemonic = mnemonic.trim().toLowerCase() || generateMnemonic12();
    const addresses = await deriveMultiChainAddresses(cleanMnemonic, wallets.length);
    const newWallet: WalletAccount = {
      id: `wallet-${Date.now()}`,
      name,
      createdAt: Date.now(),
      mnemonic: cleanMnemonic,
      addresses,
      assets: createInitialAssets(emptyStart),
      transactions: emptyStart ? [] : createInitialTransactions(addresses),
      stakingPositions: emptyStart ? [] : createInitialStakingPositions(),
    };
    setWallets((prev) => [...prev, newWallet]);
    setActiveWalletId(newWallet.id);
    showToast(`Switched to ${name}`);
  };

  // Send transaction handler
  const handleRequestSend = (payload: {
    asset: Asset;
    recipient: string;
    amount: number;
    gasFeeNative: number;
    gasSpeed: GasSpeed;
  }) => {
    if (!activeWallet || !security) return;
    const execute = () => {
      const chain = CHAINS[payload.asset.chainId];
      const nativeGasAsset = activeWallet.assets.find(
        (a) => a.chainId === payload.asset.chainId && a.isNative
      );
      const gasFeeUsd = payload.gasFeeNative * (nativeGasAsset?.priceUsd ?? 0);

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'send',
        status: 'confirmed',
        chainId: payload.asset.chainId,
        timestamp: Date.now(),
        hash: generateTxHash(payload.asset.chainId),
        blockHeight: Math.floor(20000000 + Math.random() * 500000),
        assetSymbol: payload.asset.symbol,
        assetId: payload.asset.id,
        amount: payload.amount,
        usdValueAtTx: payload.amount * payload.asset.priceUsd,
        counterpartyAddress: payload.recipient,
        gasFeeNative: payload.gasFeeNative,
        gasSymbol: chain.nativeSymbol,
        gasFeeUsd,
      };

      updateActiveWallet((w) => ({
        ...w,
        assets: w.assets.map((a) => {
          if (a.id === payload.asset.id) {
            const deduction = a.isNative
              ? payload.amount + payload.gasFeeNative
              : payload.amount;
            return { ...a, balance: Math.max(0, a.balance - deduction) };
          }
          if (!payload.asset.isNative && a.chainId === payload.asset.chainId && a.isNative) {
            return { ...a, balance: Math.max(0, a.balance - payload.gasFeeNative) };
          }
          return a;
        }),
        transactions: [tx, ...w.transactions],
      }));

      setSendModalOpen(false);
      showToast(`Sent ${payload.amount} ${payload.asset.symbol} on ${chain.name}`);
    };

    if (security.requireAuthForSend) {
      requestAuth(
        'Authorize Outgoing Transfer',
        `Verify biometrics or PIN to send ${payload.amount} ${payload.asset.symbol} on ${CHAINS[payload.asset.chainId].name}.`,
        'Verify & Broadcast',
        execute
      );
    } else {
      execute();
    }
  };

  // Swap execution handler
  const handleExecuteSwap = (payload: {
    fromAsset: Asset;
    toAsset: Asset;
    fromAmount: number;
    toAmount: number;
    slippagePct: number;
    gasFeeNative: number;
    routeProvider: string;
  }) => {
    if (!activeWallet || !security) return;

    const execute = () => {
      const fromChain = CHAINS[payload.fromAsset.chainId];
      const nativeGasAsset = activeWallet.assets.find(
        (a) => a.chainId === payload.fromAsset.chainId && a.isNative
      );
      const gasFeeUsd = payload.gasFeeNative * (nativeGasAsset?.priceUsd ?? 0);

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'swap',
        status: 'confirmed',
        chainId: payload.fromAsset.chainId,
        toChainId: payload.toAsset.chainId,
        timestamp: Date.now(),
        hash: generateTxHash(payload.fromAsset.chainId),
        blockHeight: Math.floor(21000000 + Math.random() * 500000),
        assetSymbol: payload.fromAsset.symbol,
        assetId: payload.fromAsset.id,
        amount: payload.fromAmount,
        usdValueAtTx: payload.fromAmount * payload.fromAsset.priceUsd,
        toAssetSymbol: payload.toAsset.symbol,
        toAssetId: payload.toAsset.id,
        toAmount: payload.toAmount,
        counterpartyAddress: payload.routeProvider,
        gasFeeNative: payload.gasFeeNative,
        gasSymbol: fromChain.nativeSymbol,
        gasFeeUsd,
        routeProvider: payload.routeProvider,
        slippagePct: payload.slippagePct,
      };

      updateActiveWallet((w) => ({
        ...w,
        assets: w.assets.map((a) => {
          if (a.id === payload.fromAsset.id) {
            const deduction = a.isNative
              ? payload.fromAmount + payload.gasFeeNative
              : payload.fromAmount;
            return { ...a, balance: Math.max(0, a.balance - deduction) };
          }
          if (a.id === payload.toAsset.id) {
            return { ...a, balance: a.balance + payload.toAmount };
          }
          if (
            !payload.fromAsset.isNative &&
            a.chainId === payload.fromAsset.chainId &&
            a.isNative
          ) {
            return { ...a, balance: Math.max(0, a.balance - payload.gasFeeNative) };
          }
          return a;
        }),
        transactions: [tx, ...w.transactions],
      }));

      const msg = `Swapped ${payload.fromAmount} ${payload.fromAsset.symbol} for ${payload.toAmount.toFixed(4)} ${payload.toAsset.symbol} via ${payload.routeProvider}.`;
      setLastSwapMessage(msg);
      showToast(`Swap confirmed: ${payload.fromAsset.symbol} → ${payload.toAsset.symbol}`);
    };

    if (security.requireAuthForSwap) {
      requestAuth(
        'Sign Multi-Chain Swap',
        `Authorize swapping ${payload.fromAmount} ${payload.fromAsset.symbol} to ~${payload.toAmount.toFixed(4)} ${payload.toAsset.symbol}.`,
        'Sign & Execute Swap',
        execute
      );
    } else {
      execute();
    }
  };

  // Buy/deposit handler
  const handleRequestBuy = (payload: {
    asset: Asset;
    usdAmount: number;
    tokenAmount: number;
  }) => {
    if (!activeWallet) return;
    requestAuth(
      'Authorize Asset Purchase',
      `Confirm deposit of $${payload.usdAmount.toFixed(2)} for ${payload.tokenAmount.toFixed(4)} ${payload.asset.symbol}.`,
      'Confirm Purchase',
      () => {
        const chain = CHAINS[payload.asset.chainId];
        const tx: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'buy',
          status: 'confirmed',
          chainId: payload.asset.chainId,
          timestamp: Date.now(),
          hash: generateTxHash(payload.asset.chainId),
          blockHeight: Math.floor(21500000 + Math.random() * 500000),
          assetSymbol: payload.asset.symbol,
          assetId: payload.asset.id,
          amount: payload.tokenAmount,
          usdValueAtTx: payload.usdAmount,
          counterpartyAddress: 'Trust On-Ramp Gateway',
          gasFeeNative: 0,
          gasSymbol: chain.nativeSymbol,
          gasFeeUsd: 0,
        };

        updateActiveWallet((w) => ({
          ...w,
          assets: w.assets.map((a) =>
            a.id === payload.asset.id
              ? { ...a, balance: a.balance + payload.tokenAmount, visible: true }
              : a
          ),
          transactions: [tx, ...w.transactions],
        }));

        setBuyModalOpen(false);
        showToast(`Deposited ${payload.tokenAmount.toFixed(4)} ${payload.asset.symbol}`);
      }
    );
  };

  // Staking handlers
  const handleStake = (offer: StakingOffer, amount: number) => {
    if (!activeWallet) return;
    requestAuth(
      `Stake ${offer.symbol}`,
      `Delegate ${amount} ${offer.symbol} to ${offer.validatorName} at ${offer.apy.toFixed(2)}% APY.`,
      'Verify & Stake',
      () => {
        const chain = CHAINS[offer.chainId];
        const asset = activeWallet.assets.find((a) => a.id === offer.assetId);
        const tx: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'stake',
          status: 'confirmed',
          chainId: offer.chainId,
          timestamp: Date.now(),
          hash: generateTxHash(offer.chainId),
          blockHeight: Math.floor(305000000 + Math.random() * 500000),
          assetSymbol: offer.symbol,
          assetId: offer.assetId,
          amount,
          usdValueAtTx: amount * (asset?.priceUsd ?? 0),
          counterpartyAddress: offer.validatorName,
          gasFeeNative: chain.baseGasFeeNative,
          gasSymbol: chain.nativeSymbol,
          gasFeeUsd: chain.baseGasFeeNative * (asset?.priceUsd ?? 0),
        };

        updateActiveWallet((w) => {
          const existing = w.stakingPositions.find((p) => p.offerId === offer.id);
          const nextPositions = existing
            ? w.stakingPositions.map((p) =>
                p.offerId === offer.id
                  ? { ...p, stakedAmount: p.stakedAmount + amount }
                  : p
              )
            : [
                ...w.stakingPositions,
                {
                  id: `pos-${Date.now()}`,
                  offerId: offer.id,
                  chainId: offer.chainId,
                  assetId: offer.assetId,
                  symbol: offer.symbol,
                  stakedAmount: amount,
                  earnedRewards: 0.0025,
                  apy: offer.apy,
                  validatorName: offer.validatorName,
                  stakedAt: Date.now(),
                },
              ];

          return {
            ...w,
            assets: w.assets.map((a) =>
              a.id === offer.assetId
                ? { ...a, balance: Math.max(0, a.balance - amount) }
                : a
            ),
            stakingPositions: nextPositions,
            transactions: [tx, ...w.transactions],
          };
        });

        showToast(`Staked ${amount} ${offer.symbol} with ${offer.validatorName}`);
      }
    );
  };

  const handleUnstake = (position: StakingPosition) => {
    if (!activeWallet) return;
    requestAuth(
      `Unstake ${position.symbol}`,
      `Withdraw ${position.stakedAmount} ${position.symbol} + ${position.earnedRewards.toFixed(4)} rewards back to your wallet.`,
      'Confirm Unstake',
      () => {
        const asset = activeWallet.assets.find((a) => a.id === position.assetId);
        const totalReturn = position.stakedAmount + position.earnedRewards;
        const tx: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'unstake',
          status: 'confirmed',
          chainId: position.chainId,
          timestamp: Date.now(),
          hash: generateTxHash(position.chainId),
          blockHeight: Math.floor(305000000 + Math.random() * 500000),
          assetSymbol: position.symbol,
          assetId: position.assetId,
          amount: totalReturn,
          usdValueAtTx: totalReturn * (asset?.priceUsd ?? 0),
          counterpartyAddress: position.validatorName,
          gasFeeNative: CHAINS[position.chainId].baseGasFeeNative,
          gasSymbol: CHAINS[position.chainId].nativeSymbol,
          gasFeeUsd: 0.01,
        };

        updateActiveWallet((w) => ({
          ...w,
          assets: w.assets.map((a) =>
            a.id === position.assetId ? { ...a, balance: a.balance + totalReturn } : a
          ),
          stakingPositions: w.stakingPositions.filter((p) => p.id !== position.id),
          transactions: [tx, ...w.transactions],
        }));

        showToast(`Unstaked ${totalReturn.toFixed(4)} ${position.symbol}`);
      }
    );
  };

  const handleClaimReward = (position: StakingPosition) => {
    if (!activeWallet || position.earnedRewards <= 0) return;
    updateActiveWallet((w) => ({
      ...w,
      assets: w.assets.map((a) =>
        a.id === position.assetId
          ? { ...a, balance: a.balance + position.earnedRewards }
          : a
      ),
      stakingPositions: w.stakingPositions.map((p) =>
        p.id === position.id ? { ...p, earnedRewards: 0 } : p
      ),
    }));
    showToast(`Claimed ${position.earnedRewards.toFixed(4)} ${position.symbol} rewards`);
  };

  if (!security || !activeWallet) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F17] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          <TrustShieldLogo className="w-7 h-7" />
          <span>Decrypting local vault...</span>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <LockScreen
        walletName={activeWallet.name}
        security={security}
        onUnlock={() => {
          lastActivityRef.current = Date.now();
          setIsLocked(false);
        }}
      />
    );
  }

  const currentTabMeta = NAV_ITEMS.find((n) => n.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B0F17] text-[#0D111C] dark:text-[#F1F5F9] flex">
      {/* Desktop Sidebar (248px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131924] sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <TrustShieldLogo className="w-8 h-8 shrink-0" />
          <span className="text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            TrustVault
          </span>
        </div>

        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setWalletMgrOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 hover:border-[#0500FF] dark:hover:border-[#6B8AFF] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Wallet className="w-4 h-4 text-[#0500FF] dark:text-[#6B8AFF] shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {activeWallet.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  8 Networks
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#0500FF]/8 dark:bg-[#6B8AFF]/15 text-[#0500FF] dark:text-[#8FB0FF]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1B2332] hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() =>
              updateSecurity({
                theme: security.theme === 'dark' ? 'light' : 'dark',
              })
            }
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1B2332] text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{security.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            {security.theme === 'dark' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Bar (Strict 3-Zone Contract) */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-white/90 dark:bg-[#131924]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Zone 1: Brand / Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden">
              <TrustShieldLogo className="w-7 h-7" />
            </div>
            <h1 className="text-base lg:text-lg font-display font-bold text-slate-900 dark:text-white truncate">
              {currentTabMeta.label}
            </h1>
          </div>

          {/* Zone 2: Mobile Wallet Switcher / Desktop Context */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setWalletMgrOpen(true)}
              className="lg:hidden h-9 px-3 rounded-xl bg-slate-100 dark:bg-[#1B2332] text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 max-w-[160px] truncate cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-[#0500FF] dark:text-[#6B8AFF] shrink-0" />
              <span className="truncate">{activeWallet.name}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            </button>

            <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span>{activeWallet.name}</span>
              <span aria-hidden="true">·</span>
              <span>
                {security.biometricEnabled
                  ? 'Biometric Vault Armed'
                  : 'PIN Protection Active'}
              </span>
            </div>
          </div>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              className="h-9 lg:h-10 px-3.5 lg:px-4 rounded-xl bg-slate-900 dark:bg-[#0500FF] hover:opacity-90 text-white text-xs font-medium flex items-center gap-2 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Vault</span>
            </button>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'portfolio' && (
            <PortfolioView
              wallet={activeWallet}
              currency={security.currency}
              hideBalances={security.hideBalances}
              onToggleHideBalances={() =>
                updateSecurity({ hideBalances: !security.hideBalances })
              }
              onOpenSend={(assetId) => {
                setSendModalAssetId(assetId || null);
                setSendModalOpen(true);
              }}
              onOpenReceive={(chainId) =>
                setReceiveModalChain(chainId || 'ethereum')
              }
              onOpenBuy={() => setBuyModalOpen(true)}
              onGoToSwap={(assetId) => {
                setSwapInitialAssetId(assetId);
                setLastSwapMessage(null);
                setActiveTab('swap');
              }}
              onGoToActivity={() => setActiveTab('activity')}
              onSelectAsset={(asset) => setSelectedAssetId(asset.id)}
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
              onToggleTokenVisibility={(assetId) => {
                updateActiveWallet((w) => ({
                  ...w,
                  assets: w.assets.map((a) =>
                    a.id === assetId ? { ...a, visible: !a.visible } : a
                  ),
                }));
              }}
            />
          )}

          {activeTab === 'swap' && (
            <SwapView
              wallet={activeWallet}
              initialFromAssetId={swapInitialAssetId}
              currency={security.currency}
              hideBalances={security.hideBalances}
              requireBiometric={security.requireAuthForSwap}
              onExecuteSwap={handleExecuteSwap}
              lastSwapMessage={lastSwapMessage}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityView
              transactions={activeWallet.transactions}
              currency={security.currency}
              hideBalances={security.hideBalances}
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            />
          )}

          {activeTab === 'earn' && (
            <EarnView
              wallet={activeWallet}
              currency={security.currency}
              hideBalances={security.hideBalances}
              onStake={handleStake}
              onUnstake={handleUnstake}
              onClaimReward={handleClaimReward}
            />
          )}

          {activeTab === 'security' && (
            <SecurityView
              wallet={activeWallet}
              security={security}
              onUpdateSecurity={updateSecurity}
              onRequestAuth={requestAuth}
              onLockNow={() => setIsLocked(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (<=15% viewport height, 44px+ hitboxes) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#131924]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                active
                  ? 'text-[#0500FF] dark:text-[#7AA2FF]'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <ReceiveModal
        isOpen={receiveModalChain !== null}
        wallet={activeWallet}
        initialChainId={receiveModalChain || 'ethereum'}
        onClose={() => setReceiveModalChain(null)}
      />

      <SendModal
        isOpen={sendModalOpen}
        wallet={activeWallet}
        initialAssetId={sendModalAssetId || undefined}
        currency={security.currency}
        requireBiometric={security.requireAuthForSend}
        onClose={() => setSendModalOpen(false)}
        onRequestSend={handleRequestSend}
      />

      <BuyModal
        isOpen={buyModalOpen}
        wallet={activeWallet}
        currency={security.currency}
        onClose={() => setBuyModalOpen(false)}
        onRequestBuy={handleRequestBuy}
      />

      <WalletManagerModal
        isOpen={walletMgrOpen}
        wallets={wallets}
        activeWalletId={activeWallet.id}
        onSelectWallet={(id) => setActiveWalletId(id)}
        onCreateWallet={handleCreateWallet}
        onClose={() => setWalletMgrOpen(false)}
      />

      <AssetDetailModal
        asset={selectedAsset}
        wallet={activeWallet}
        currency={security.currency}
        hideBalances={security.hideBalances}
        onClose={() => setSelectedAssetId(null)}
        onSend={(assetId) => {
          setSendModalAssetId(assetId);
          setSendModalOpen(true);
        }}
        onReceive={(chainId) => setReceiveModalChain(chainId)}
        onSwap={(assetId) => {
          setSwapInitialAssetId(assetId);
          setLastSwapMessage(null);
          setActiveTab('swap');
        }}
        onSelectTransaction={(tx) => setSelectedTransaction(tx)}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        currency={security.currency}
        onClose={() => setSelectedTransaction(null)}
      />

      <BiometricAuthModal
        isOpen={authChallenge !== null}
        title={authChallenge?.title || ''}
        subtitle={authChallenge?.subtitle || ''}
        actionLabel={authChallenge?.actionLabel || 'Verify'}
        security={security}
        onVerified={() => {
          const cb = authChallenge?.onSuccess;
          setAuthChallenge(null);
          cb?.();
        }}
        onCancel={() => setAuthChallenge(null)}
      />

      {/* Non-blocking Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium shadow-xl border border-slate-800 dark:border-slate-200"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
