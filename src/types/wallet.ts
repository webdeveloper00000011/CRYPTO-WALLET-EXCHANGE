export type ChainId =
  | 'ethereum'
  | 'bsc'
  | 'bitcoin'
  | 'solana'
  | 'polygon'
  | 'arbitrum'
  | 'avalanche'
  | 'base';

export type NavTab = 'portfolio' | 'swap' | 'activity' | 'earn' | 'security';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export type ThemeMode = 'light' | 'dark';

export type TransactionType = 'swap' | 'send' | 'receive' | 'stake' | 'unstake' | 'buy';

export type TransactionStatus = 'confirmed' | 'pending';

export type GasSpeed = 'slow' | 'standard' | 'fast';

export interface ChainConfig {
  id: ChainId;
  name: string;
  shortName: string;
  nativeSymbol: string;
  explorerUrl: string;
  addressPrefix: string;
  derivationPath: string;
  avgBlockTimeSec: number;
  baseGasFeeNative: number;
  accentColor: string;
  standardLabel: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  chainId: ChainId;
  isNative: boolean;
  contractAddress?: string;
  decimals: number;
  balance: number;
  priceUsd: number;
  change24h: number;
  sparkline: number[];
  visible: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  chainId: ChainId;
  toChainId?: ChainId;
  timestamp: number;
  hash: string;
  blockHeight: number;
  assetSymbol: string;
  assetId: string;
  amount: number;
  usdValueAtTx: number;
  toAssetSymbol?: string;
  toAssetId?: string;
  toAmount?: number;
  counterpartyAddress: string;
  gasFeeNative: number;
  gasSymbol: string;
  gasFeeUsd: number;
  routeProvider?: string;
  slippagePct?: number;
}

export interface StakingOffer {
  id: string;
  chainId: ChainId;
  assetId: string;
  symbol: string;
  name: string;
  apy: number;
  lockupDays: number;
  validatorName: string;
  minStake: number;
  commissionPct: number;
}

export interface StakingPosition {
  id: string;
  offerId: string;
  chainId: ChainId;
  assetId: string;
  symbol: string;
  stakedAmount: number;
  earnedRewards: number;
  apy: number;
  validatorName: string;
  stakedAt: number;
}

export interface WalletAccount {
  id: string;
  name: string;
  createdAt: number;
  mnemonic: string;
  addresses: Record<ChainId, string>;
  assets: Asset[];
  transactions: Transaction[];
  stakingPositions: StakingPosition[];
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  passkeyCredentialId: string | null;
  passkeyDeviceLabel: string | null;
  passkeyRegisteredAt: number | null;
  pinHash: string;
  autoLockMinutes: number;
  requireAuthForSwap: boolean;
  requireAuthForSend: boolean;
  hideBalances: boolean;
  theme: ThemeMode;
  currency: CurrencyCode;
}

export interface AuthChallengeRequest {
  title: string;
  subtitle: string;
  actionLabel: string;
  onSuccess: () => void;
}
