import React from 'react';
import { ChainId } from '../types/wallet';

export const TrustShieldLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
    <path
      d="M20 3.5L6.5 9.2V19.6C6.5 28.1 12.25 35.8 20 38.5C27.75 35.8 33.5 28.1 33.5 19.6V9.2L20 3.5Z"
      fill="url(#trust-shield-grad)"
    />
    <path
      d="M20 7.2L10.2 11.4V19.4C10.2 26.1 14.35 32.1 20 34.4C25.65 32.1 29.8 26.1 29.8 19.4V11.4L20 7.2Z"
      stroke="white"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="trust-shield-grad" x1="6.5" y1="3.5" x2="33.5" y2="38.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0500FF" />
        <stop offset="1" stopColor="#2E6BFF" />
      </linearGradient>
    </defs>
  </svg>
);

export const ChainBadgeIcon: React.FC<{ chainId: ChainId; size?: number }> = ({
  chainId,
  size = 20,
}) => {
  const style = { width: size, height: size };
  switch (chainId) {
    case 'ethereum':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#627EEA" />
          <path d="M16.4 5.5V13.2L22.8 16.1L16.4 5.5Z" fill="white" fillOpacity="0.65" />
          <path d="M16.4 5.5L10 16.1L16.4 13.2V5.5Z" fill="white" />
          <path d="M16.4 21.1V26.5L22.8 17.5L16.4 21.1Z" fill="white" fillOpacity="0.65" />
          <path d="M16.4 26.5V21.1L10 17.5L16.4 26.5Z" fill="white" />
          <path d="M16.4 19.9L22.8 16.1L16.4 13.2V19.9Z" fill="white" fillOpacity="0.3" />
          <path d="M10 16.1L16.4 19.9V13.2L10 16.1Z" fill="white" fillOpacity="0.8" />
        </svg>
      );
    case 'bitcoin':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#F7931A" />
          <path
            d="M21.4 14.1C21.7 12.1 20.1 11 18 10.3L18.7 7.5L17 7.1L16.3 9.8C15.9 9.7 15.4 9.6 15 9.5L15.7 6.8L14 6.4L13.3 9.2C12.9 9.1 12.6 9 12.2 8.9L10.1 8.4L9.7 10.2C9.7 10.2 10.9 10.5 10.9 10.5C11.6 10.7 11.7 11.1 11.7 11.5L10.9 14.7C11 14.7 11.1 14.7 11.2 14.8L10.9 14.7L9.8 19.2C9.7 19.4 9.5 19.8 9 19.7C9 19.7 7.8 19.4 7.8 19.4L7 21.3L9.1 21.8C9.5 21.9 9.9 22 10.2 22.1L9.5 24.9L11.2 25.3L11.9 22.5C12.4 22.6 12.8 22.8 13.2 22.9L12.5 25.6L14.2 26L14.9 23.2C17.8 23.8 20 23.5 20.9 20.9C21.6 18.8 20.9 17.6 19.4 16.8C20.5 16.5 21.2 15.6 21.4 14.1ZM18 19.6C17.5 21.7 14 20.6 12.9 20.3L13.8 16.6C14.9 16.9 18.5 17.4 18 19.6ZM18.5 14C18 15.9 15.1 15 14.2 14.7L15 11.4C15.9 11.6 19 12.1 18.5 14Z"
            fill="white"
          />
        </svg>
      );
    case 'bsc':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
          <path
            d="M16 7.5L19.4 10.9L13.4 16.9L10 13.5L16 7.5ZM21.1 12.6L24.5 16L21.1 19.4L17.7 16L21.1 12.6ZM10.9 12.6L14.3 16L10.9 19.4L7.5 16L10.9 12.6ZM16 17.7L19.4 21.1L16 24.5L12.6 21.1L16 17.7Z"
            fill="white"
          />
        </svg>
      );
    case 'solana':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#111827" />
          <path d="M9.5 20.3L11.4 18.3H22.5L20.6 20.3H9.5Z" fill="#14F195" />
          <path d="M9.5 11.7L11.4 9.7H22.5L20.6 11.7H9.5Z" fill="#9945FF" />
          <path d="M22.5 16L20.6 14H9.5L11.4 16H22.5Z" fill="#00C2FF" />
        </svg>
      );
    case 'polygon':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#8247E5" />
          <path
            d="M20.8 13.1C20.4 12.9 19.9 12.9 19.5 13.1L16.9 14.6L15.1 15.6L12.5 17.1C12.1 17.3 11.6 17.3 11.2 17.1L9.2 15.9C8.8 15.7 8.5 15.2 8.5 14.7V12.4C8.5 11.9 8.8 11.5 9.2 11.2L11.2 10.1C11.6 9.9 12.1 9.9 12.5 10.1L14.5 11.2C14.9 11.4 15.2 11.9 15.2 12.4V13.9L16.9 12.9V11.4C16.9 10.9 16.6 10.5 16.2 10.2L12.5 8.1C12.1 7.9 11.6 7.9 11.2 8.1L7.5 10.2C7.1 10.4 6.8 10.9 6.8 11.4V15.7C6.8 16.2 7.1 16.6 7.5 16.9L11.2 19C11.6 19.2 12.1 19.2 12.5 19L15.1 17.5L16.9 16.5L19.5 15C19.9 14.8 20.4 14.8 20.8 15L22.8 16.1C23.2 16.3 23.5 16.8 23.5 17.3V19.6C23.5 20.1 23.2 20.5 22.8 20.8L20.8 21.9C20.4 22.1 19.9 22.1 19.5 21.9L17.5 20.8C17.1 20.6 16.8 20.1 16.8 19.6V18.1L15.1 19.1V20.6C15.1 21.1 15.4 21.5 15.8 21.8L19.5 23.9C19.9 24.1 20.4 24.1 20.8 23.9L24.5 21.8C24.9 21.6 25.2 21.1 25.2 20.6V16.3C25.2 15.8 24.9 15.4 24.5 15.1L20.8 13.1Z"
            fill="white"
          />
        </svg>
      );
    case 'arbitrum':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#213147" />
          <path d="M16 6.5L8.2 11V20.8L16 25.5L23.8 20.8V11L16 6.5Z" stroke="#28A0F0" strokeWidth="2" />
          <path d="M14.2 11.5L10.8 20.2H13.1L15.5 14L14.2 11.5Z" fill="white" />
          <path d="M17.2 11.5L14.8 18L16.3 21.5L19.8 11.5H17.2Z" fill="#28A0F0" />
          <path d="M19.8 14.5L17.6 20.8H19.9L21.3 17.2L19.8 14.5Z" fill="white" />
        </svg>
      );
    case 'avalanche':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#E84142" />
          <path d="M16 8.2L9.2 21.2H13.5L16 16.3L18.5 21.2H22.8L16 8.2Z" fill="white" />
          <path d="M19.8 17.5L17.9 21.2H21.7L19.8 17.5Z" fill="white" />
        </svg>
      );
    case 'base':
      return (
        <svg viewBox="0 0 32 32" style={style} className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#0052FF" />
          <path
            d="M16 24.5C20.6944 24.5 24.5 20.6944 24.5 16C24.5 11.3056 20.6944 7.5 16 7.5C11.56 7.5 7.91 10.91 7.53 15.25H18.5V16.75H7.53C7.91 21.09 11.56 24.5 16 24.5Z"
            fill="white"
          />
        </svg>
      );
  }
};

export const TokenIcon: React.FC<{
  symbol: string;
  chainId: ChainId;
  size?: number;
  showChainBadge?: boolean;
}> = ({ symbol, chainId, size = 38, showChainBadge = true }) => {
  const sym = symbol.toUpperCase();
  const isNativeMatching =
    (sym === 'BTC' && chainId === 'bitcoin') ||
    (sym === 'ETH' && chainId === 'ethereum') ||
    (sym === 'SOL' && chainId === 'solana') ||
    (sym === 'BNB' && chainId === 'bsc') ||
    (sym === 'POL' && chainId === 'polygon') ||
    (sym === 'AVAX' && chainId === 'avalanche');

  const renderGlyph = () => {
    if (sym === 'BTC') return <ChainBadgeIcon chainId="bitcoin" size={size} />;
    if (sym === 'ETH') return <ChainBadgeIcon chainId="ethereum" size={size} />;
    if (sym === 'SOL') return <ChainBadgeIcon chainId="solana" size={size} />;
    if (sym === 'BNB') return <ChainBadgeIcon chainId="bsc" size={size} />;
    if (sym === 'POL') return <ChainBadgeIcon chainId="polygon" size={size} />;
    if (sym === 'ARB') return <ChainBadgeIcon chainId="arbitrum" size={size} />;
    if (sym === 'AVAX') return <ChainBadgeIcon chainId="avalanche" size={size} />;

    if (sym === 'USDC') {
      return (
        <svg viewBox="0 0 32 32" style={{ width: size, height: size }} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#2775CA" />
          <circle cx="16" cy="16" r="10.5" stroke="white" strokeWidth="1.6" strokeDasharray="18 6" />
          <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="sans-serif">
            $
          </text>
        </svg>
      );
    }

    if (sym === 'USDT') {
      return (
        <svg viewBox="0 0 32 32" style={{ width: size, height: size }} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#26A17B" />
          <path d="M10 10.5H22V13H17.3V22.5H14.7V13H10V10.5Z" fill="white" />
          <ellipse cx="16" cy="15.4" rx="7" ry="1.4" stroke="white" strokeWidth="1.4" fill="none" />
        </svg>
      );
    }

    if (sym === 'LINK') {
      return (
        <svg viewBox="0 0 32 32" style={{ width: size, height: size }} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#2A5ADA" />
          <path d="M16 7.5L23.5 11.8V20.2L16 24.5L8.5 20.2V11.8L16 7.5Z" stroke="white" strokeWidth="2.8" fill="none" />
        </svg>
      );
    }

    if (sym === 'UNI') {
      return (
        <svg viewBox="0 0 32 32" style={{ width: size, height: size }} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#FF007A" />
          <text x="16" y="20" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif">
            UNI
          </text>
        </svg>
      );
    }

    if (sym === 'JUP') {
      return (
        <svg viewBox="0 0 32 32" style={{ width: size, height: size }} aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#1D283A" />
          <circle cx="16" cy="16" r="8" fill="#19FB9B" fillOpacity="0.9" />
          <path d="M7.5 18.5C11 14.5 21 14.5 24.5 13.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-slate-800 dark:bg-slate-700 text-white font-display font-bold text-xs flex items-center justify-center shrink-0"
      >
        {sym.slice(0, 3)}
      </div>
    );
  };

  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {renderGlyph()}
      {showChainBadge && !isNativeMatching && (
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#131924] bg-white dark:bg-[#131924]">
          <ChainBadgeIcon chainId={chainId} size={Math.round(size * 0.42)} />
        </div>
      )}
    </div>
  );
};
