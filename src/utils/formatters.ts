import { CurrencyCode } from '../types/wallet';

const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rate: number }> = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 },
};

export function formatFiat(
  usdValue: number,
  currency: CurrencyCode = 'USD',
  hidden = false,
  compact = false
): string {
  if (hidden) {
    return `${CURRENCY_RATES[currency].symbol}••••••`;
  }
  const { symbol, rate } = CURRENCY_RATES[currency];
  const converted = usdValue * rate;

  if (compact && Math.abs(converted) >= 1_000_000) {
    return `${symbol}${(converted / 1_000_000).toFixed(2)}M`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Math.abs(converted) < 1 && converted !== 0 ? 4 : 2,
    maximumFractionDigits: Math.abs(converted) < 1 && converted !== 0 ? 4 : 2,
  }).format(converted);
}

export function formatTokenAmount(amount: number, maxDecimals = 6, hidden = false): string {
  if (hidden) {
    return '••••';
  }
  if (amount === 0) return '0';
  if (Math.abs(amount) < 0.000001) return '<0.000001';

  const decimals =
    Math.abs(amount) >= 1000 ? 2 : Math.abs(amount) >= 1 ? 4 : maxDecimals;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatPrice(usdPrice: number, currency: CurrencyCode = 'USD'): string {
  const { rate } = CURRENCY_RATES[currency];
  const converted = usdPrice * rate;
  const maxDigits = converted >= 100 ? 2 : converted >= 1 ? 3 : 4;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits,
  }).format(converted);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
